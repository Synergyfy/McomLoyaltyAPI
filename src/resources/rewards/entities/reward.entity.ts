import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBaseEntity } from 'src/database/entities/base.entity';

@Entity()
export class Reward extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column()
  points_required: number;

  @Column()
  value: number;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column({ default: 0 })
  quantity: number;
}
