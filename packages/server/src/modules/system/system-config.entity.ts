import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'

@Entity()
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  key: string

  @Column()
  value: string

  @UpdateDateColumn()
  updatedAt: Date
}