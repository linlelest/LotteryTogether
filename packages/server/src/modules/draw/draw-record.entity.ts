import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { User } from '../user/user.entity'
import { Activity } from '../activity/activity.entity'
import { Prize } from '../prize/prize.entity'

export type DrawStatus = 'pending' | 'shipped' | 'claimed'

@Entity()
export class DrawRecord {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  activityId: number

  @ManyToOne(() => Activity)
  @JoinColumn({ name: 'activityId' })
  activity: Activity

  @Column({ nullable: true })
  prizeId: number

  @ManyToOne(() => Prize)
  @JoinColumn({ name: 'prizeId' })
  prize: Prize

  @Column({ nullable: true })
  prizeName: string

  @Column({ length: 20, default: 'pending' })
  status: DrawStatus

  @CreateDateColumn()
  drawnAt: Date
}