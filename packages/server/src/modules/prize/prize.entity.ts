import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { Activity } from '../activity/activity.entity'

export type PrizeType = 'virtual'

@Entity()
export class Prize {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ length: 20, default: 'virtual' })
  type: PrizeType

  @Column({ default: 0 })
  stock: number

  @Column({ default: 1 })
  weight: number

  @Column({ nullable: true })
  image: string

  @Column({ nullable: true, type: 'text' })
  description: string

  @Column()
  activityId: number

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: Activity

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}