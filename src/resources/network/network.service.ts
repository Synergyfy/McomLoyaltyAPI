import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Network } from './entities/network.entity';
import { CreateNetworkDto } from './dto/create-network.dto';
import { Business } from '../business/entities/business.entity';
import { BulkImportNetworkDto } from './dto/bulk-import-network.dto';
import { GetNetworkDto } from './dto/get-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { NetworkList } from './entities/network-list.entity';
import { CreateNetworkListDto } from './dto/create-network-list.dto';
import { UpdateNetworkListDto } from './dto/update-network-list.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NetworkService {
    constructor(
        @InjectRepository(Network)
        private readonly networkRepository: Repository<Network>,
        @InjectRepository(NetworkList)
        private readonly networkListRepository: Repository<NetworkList>,
    ) { }

    async createList(createNetworkListDto: CreateNetworkListDto, business: Business) {
        const { networkIds, ...data } = createNetworkListDto;

        const list = this.networkListRepository.create({
            ...data,
            business,
        });

        if (networkIds && networkIds.length > 0) {
            const networks = await this.networkRepository.find({
                where: {
                    id: In(networkIds),
                    business: { id: business.id }
                }
            });
            list.networks = networks;
        }

        return await this.networkListRepository.save(list);
    }

    async findAllLists(query: PaginationDto, businessId: string) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await this.networkListRepository.findAndCount({
            where: { business: { id: businessId } },
            take: limit,
            skip,
            order: { created_at: 'DESC' },
            relations: ['networks'] // Load count or details? Details might be heavy.
        });

        const lastPage = Math.ceil(total / limit);
        const nextPage = page < lastPage ? page + 1 : null;
        const prevPage = page > 1 ? page - 1 : null;

        return {
            data,
            meta: {
                total,
                page,
                lastPage,
                nextPage,
                prevPage,
            }
        };
    }

    async findListOne(id: string, businessId: string) {
        const list = await this.networkListRepository.findOne({
            where: { id, business: { id: businessId } },
            relations: ['networks']
        });

        if (!list) {
            throw new NotFoundException(`Network list with ID ${id} not found`);
        }
        return list;
    }

    async updateList(id: string, updateNetworkListDto: UpdateNetworkListDto, business: Business) {
        const list = await this.findListOne(id, business.id);
        const { networkIds, ...data } = updateNetworkListDto;

        Object.assign(list, data);

        if (networkIds) {
            const networks = await this.networkRepository.find({
                where: {
                    id: In(networkIds),
                    business: { id: business.id }
                }
            });
            list.networks = networks;
        }

        return await this.networkListRepository.save(list);
    }

    async deleteList(id: string, business: Business) {
        const list = await this.findListOne(id, business.id);
        return await this.networkListRepository.remove(list);
    }

    async addNetwork(createNetworkDto: CreateNetworkDto, business: Business) {
        const { email, phone } = createNetworkDto;

        // Check for duplicates
        const existing = await this.networkRepository.createQueryBuilder('network')
            .where('network.businessId = :businessId', { businessId: business.id })
            .andWhere(
                '(network.email = :email OR network.phone = :phone)',
                { email: email || '', phone }
            )
            .getOne();

        if (existing) {
            if (email && existing.email === email) {
                throw new ConflictException(`Network contact with email ${email} already exists in your network.`);
            }
            if (existing.phone === phone) {
                throw new ConflictException(`Network contact with phone ${phone} already exists in your network.`);
            }
        }

        try {
            const network = this.networkRepository.create({
                ...createNetworkDto,
                hasSharingPermission: createNetworkDto.hasPermission,
                business,
            });
            return await this.networkRepository.save(network);
        } catch (error) {
            // Catch duplicate error if race condition occurs
            if (error.code === '23505') { // Postgres unique violation code
                throw new ConflictException('Network contact already exists.');
            }
            throw new InternalServerErrorException('Failed to add network contact');
        }
    }

    async bulkImport(bulkImportDto: BulkImportNetworkDto, business: Business) {
        const { networks } = bulkImportDto;
        if (!networks.length) return { message: 'No contacts provided for import.' };

        const emails = networks.map(n => n.email).filter(Boolean);
        const phones = networks.map(n => n.phone);

        // Fetch existing contacts for this business to check duplicates
        // Using simple query builder to get all potentially conflicting entries
        const existingContacts = await this.networkRepository.createQueryBuilder('network')
            .where('network.businessId = :businessId', { businessId: business.id })
            .andWhere(
                '(network.email IN (:...emails) OR network.phone IN (:...phones))',
                {
                    emails: emails.length ? emails : [''],
                    phones: phones.length ? phones : ['']
                }
            )
            .getMany();

        const existingEmails = new Set(existingContacts.map(c => c.email).filter(Boolean));
        const existingPhones = new Set(existingContacts.map(c => c.phone));

        const toInsert = [];
        const errors = [];

        // Set to track duplicates within the payload itself
        const payloadEmails = new Set();
        const payloadPhones = new Set();

        for (const contact of networks) {
            let error = null;
            if (contact.email) {
                if (existingEmails.has(contact.email)) error = `Email ${contact.email} already exists`;
                else if (payloadEmails.has(contact.email)) error = `Duplicate email ${contact.email} in import list`;
            }

            if (!error && existingPhones.has(contact.phone)) error = `Phone ${contact.phone} already exists`;
            if (!error && payloadPhones.has(contact.phone)) error = `Duplicate phone ${contact.phone} in import list`;

            if (error) {
                errors.push({ ...contact, error });
            } else {
                if (contact.email) payloadEmails.add(contact.email);
                payloadPhones.add(contact.phone);

                toInsert.push(this.networkRepository.create({
                    ...contact,
                    hasSharingPermission: bulkImportDto.hasPermission ?? contact.hasPermission,
                    business
                }));
            }
        }

        if (toInsert.length > 0) {
            // "send a query at once" - simple insert is much faster than save for bulk
            // Using chunking if array is massive, but TypeORM handles reasonably sized arrays well.
            // Insert ignores listeners/hooks but is faster. If hooks needed, use save.
            await this.networkRepository.insert(toInsert);
        }

        return {
            message: `Imported ${toInsert.length} contacts. ${errors.length} failed.`,
            importedCount: toInsert.length,
            failedCount: errors.length,
            errors: errors // Return specific errors for failed items
        };
    }

    async findAll(query: GetNetworkDto, businessId?: string) {
        const { page, limit, search, locationTag, relationshipTag, status, sortBy, sortOrder } = query;
        const filterBusinessId = businessId || query.businessId;

        const qb = this.networkRepository.createQueryBuilder('network');

        if (filterBusinessId) {
            qb.where('network.businessId = :businessId', { businessId: filterBusinessId });
        }

        if (search) {
            qb.andWhere(
                '(network.fullName ILIKE :search OR network.email ILIKE :search OR network.phone ILIKE :search OR network.businessName ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (locationTag) {
            qb.andWhere('network.locationTag = :locationTag', { locationTag });
        }

        if (relationshipTag) {
            qb.andWhere('network.relationshipTag = :relationshipTag', { relationshipTag });
        }

        if (status) {
            qb.andWhere('network.status = :status', { status });
        }

        const sortMapping: Record<string, string> = {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        };

        const sortField = sortMapping[sortBy] || sortBy;

        qb.orderBy(`network.${sortField}`, sortOrder as 'ASC' | 'DESC');

        // Pagination logic
        const skip = (page - 1) * limit;
        const [data, total] = await qb.take(limit).skip(skip).getManyAndCount();

        const lastPage = Math.ceil(total / limit);
        const nextPage = page < lastPage ? page + 1 : null;
        const prevPage = page > 1 ? page - 1 : null;

        return {
            data,
            meta: {
                total,
                page,
                lastPage,
                nextPage,
                prevPage,
            }
        };
    }

    async update(id: string, updateNetworkDto: UpdateNetworkDto, business: Business) {
        const network = await this.findOne(id, business.id);

        Object.assign(network, {
            ...updateNetworkDto,
            hasSharingPermission: updateNetworkDto.hasPermission ?? network.hasSharingPermission,
        });

        return await this.networkRepository.save(network);
    }

    async remove(id: string, business: Business) {
        const network = await this.findOne(id, business.id);
        return await this.networkRepository.softRemove(network);
    }

    async findOne(id: string, businessId: string) {
        const network = await this.networkRepository.findOne({
            where: { id, business: { id: businessId } },
        });

        if (!network) {
            throw new NotFoundException(`Network contact with ID ${id} not found`);
        }

        return network;
    }
}
