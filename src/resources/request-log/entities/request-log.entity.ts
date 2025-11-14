import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ip: string;

  @Column()
  userAgent: string;

  @Column()
  method: string;

  @Column()
  originalUrl: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
