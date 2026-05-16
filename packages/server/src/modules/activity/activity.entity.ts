import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { User } from '../user/user.entity'

export type ActivityMode = 'wheel' | 'blindbox' | 'paper'
export type ActivityStatus = 'draft' | 'pending' | 'active' | 'paused' | 'ended'

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 30 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ nullable: true })
  cover: string

  @Column({ length: 20 })
  mode: ActivityMode

  @Column({ length: 20, default: 'draft' })
  status: ActivityStatus

  @Column({ nullable: true })
  startTime: Date

  @Column({ nullable: true })
  endTime: Date

  @Column({ default: true })
  isPublic: boolean

  @Column({ nullable: true })
  accessPassword: string

  @Column({ default: false })
  requireLogin: boolean

  @Column({ unique: true, length: 10 })
  lotteryCode: string

  @Column({ default: 0 })
  participantCount: number

  @Column({ default: 9 })
  blindBoxGridSize: number

  @Column({ default: 3 })
  blindBoxOpenable: number

  @Column({ nullable: true, type: 'text' })
  paperQuestion: string

  @Column({ default: 1 })
  paperPrizeCount: number

  @Column({ default: 'time', length: 10 })
  paperDrawTrigger: string

  @Column({ nullable: true })
  paperDrawTime: Date

  @Column({ default: 10 })
  paperDrawCount: number

  @Column({ nullable: true, type: 'text' })
  forceEndReason: string

  @Column()
  createdById: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}