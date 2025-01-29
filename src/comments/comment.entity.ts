import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '../files/file.entity';
import { User } from '../user/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  @Index('IDX_comment_id')
  public id!: string;

  @Column({ type: 'text' })
  public text!: string;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @Index('IDX_comment_user_id')
  public user!: User;

  @OneToMany(() => File, (file) => file.comment, { cascade: true })
  public files!: File[];

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @Index('IDX_comment_parent_id')
  public parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  public replies?: Comment[];

  @CreateDateColumn({
    type: 'timestamp without time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index('IDX_comment_created_at')
  public created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updated_at!: Date;
}
