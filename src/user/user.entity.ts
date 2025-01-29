import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../auth/refresh-token/refresh-token.entity';
import { Comment } from '../comments/comment.entity';
import { Exclude } from 'class-transformer';

export interface IJwtPayload {
  id: string;
  email: string;
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ nullable: false })
  @Index('IDX_user_username', { synchronize: false })
  public username!: string;

  @Column({ nullable: false, unique: true })
  public email!: string;

  @Column({ nullable: true })
  public home_page?: string;

  @Exclude()
  @Column({ nullable: false })
  public encrypted_password!: string;

  @OneToMany(() => RefreshToken, (refresh_token) => refresh_token.user)
  public refresh_tokens?: RefreshToken[];

  @OneToMany(() => Comment, (comment) => comment.user)
  public comments!: Comment[];

  @CreateDateColumn({
    type: 'timestamp without time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updated_at!: Date;

  public getJwtPayload(): IJwtPayload {
    return {
      id: this.id,
      email: this.email,
    };
  }
}
