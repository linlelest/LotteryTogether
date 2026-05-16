import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column({ select: false })
  password: string

  @Column({ default: false })
  isAdmin: boolean

  @Column({ nullable: true })
  avatar: string

  @Column({ default: 0 })
  inviteCodeCount: number

  @Column({ default: false })
  isBanned: boolean

  @Column({ nullable: true, type: 'varchar' })
  banReason: string | null

  @Column({ nullable: true, type: 'datetime' })
  bannedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}