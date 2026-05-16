import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class PaperSlip {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  activityId: number

  @Column()
  userId: number

  @Column({ length: 200 })
  content: string

  @Column({ length: 20, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'winner'

  @CreateDateColumn()
  createdAt: Date
}