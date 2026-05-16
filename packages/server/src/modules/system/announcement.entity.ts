import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column({ type: 'text' })
  content: string

  @Column({ default: false })
  forceRead: boolean

  @Column({ default: true })
  showDismiss: boolean

  @Column({ default: false })
  isPinned: boolean

  @Column({ default: 0 })
  forceReadSeconds: number

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}