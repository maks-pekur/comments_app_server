import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../comments/comment.entity';

@Entity('file')
export class File {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  public filename!: string;

  @Column()
  public mimetype!: string;

  @Column()
  public path!: string;

  @ManyToOne(() => Comment, (comment) => comment.files, {
    onDelete: 'CASCADE',
  })
  public comment!: Comment;

  @CreateDateColumn()
  public created_at!: Date;
}
