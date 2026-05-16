import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class IpBlacklist {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  ip: string

  @Column({ nullable: true })
  reason: string

  @Column({ nullable: true })
  bannedById: number

  @Column({ nullable: true, type: 'datetime' })
  unbanAt: Date | null

  @CreateDateColumn()
  createdAt: Date
}