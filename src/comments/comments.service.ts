import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { sanitizeComment } from '../utils/sanitize';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getComments(
    page: number,
    limit: number,
    sort: 'created_at' | 'username' | 'email',
    order: 'ASC' | 'DESC',
    filters: { text?: string; username?: string; email?: string },
  ): Promise<{
    data: Comment[];
    meta: { total: number; page: number; pages: number };
  }> {
    const where: Record<string, any> = { parentComment: IsNull() };

    if (filters.text) {
      where.text = Like(`%${filters.text}%`);
    }
    if (filters.username) {
      where.user = { username: Like(`%${filters.username}%`) };
    }
    if (filters.email) {
      where.user = { ...where.user, email: Like(`%${filters.email}%`) };
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where,
      relations: ['replies', 'user'],
      order:
        sort === 'username'
          ? { user: { username: order } }
          : sort === 'email'
            ? { user: { email: order } }
            : { created_at: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      data: comments,
      meta: {
        total,
        page,
        pages,
      },
    };
  }

  async createComment(
    userId: string,
    text: string,
    parentId?: string,
  ): Promise<Comment> {
    const parentComment = parentId
      ? await this.commentRepository.findOneBy({ id: parentId })
      : null;

    if (parentId && !parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const sanitizedText = sanitizeComment(text);

    const comment = this.commentRepository.create({
      text: sanitizedText,
      user: { id: userId } as any,
      parentComment: parentComment || undefined,
    });

    return this.commentRepository.save(comment);
  }

  async updateComment(
    id: string,
    userId: string,
    newText: string,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new UnauthorizedException('Not authorized to edit this comment');
    }

    comment.text = newText;
    return this.commentRepository.save(comment);
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    await this.commentRepository.remove(comment);
  }
}
