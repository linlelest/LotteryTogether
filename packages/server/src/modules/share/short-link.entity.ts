import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class ShortLink {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 10 })
  code: string

  @Column()
  targetUrl: string

  @Column({ nullable: true })
  activityId: number

  @Column({ nullable: true })
  creatorId: number

  @Column({ default: 0 })
  clickCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}