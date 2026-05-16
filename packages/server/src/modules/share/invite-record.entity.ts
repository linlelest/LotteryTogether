import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class InviteRecord {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  inviterId: number

  @Column()
  inviteeId: number

  @Column({ nullable: true })
  activityId: number

  @CreateDateColumn()
  createdAt: Date
}