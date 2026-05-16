import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class InvitationCode {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  code: string

  @Column({ default: false })
  isUsed: boolean

  @Column({ nullable: true })
  usedById: number

  @Column({ nullable: true })
  ownerId: number

  @CreateDateColumn()
  createdAt: Date

  @Column({ nullable: true })
  usedAt: Date
}