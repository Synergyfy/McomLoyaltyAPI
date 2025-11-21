import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { SubCategory } from '../../subcategory/entities/subcategory.entity';

@Entity('partners')
export class Partner extends AbstractBaseEntity {
    @Column()
    name: string;

    @Column()
    businessName: string;

    @Column({ unique: true })
    email: string;

    @Column()
    phoneNumber: string;

    @ManyToOne(() => SubCategory)
    @JoinColumn({ name: 'sub_category_id' })
    subCategory: SubCategory;

    @Column()
    password: string;
}
