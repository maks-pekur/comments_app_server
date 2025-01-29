import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { Brackets, Repository } from 'typeorm';
import { File } from '../files/file.entity';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { UploadService } from '../upload/upload.service';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly uploadService: UploadService,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
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
    const validPage = Math.max(page, 1);
    const validLimit = Math.max(limit, 1);

    const cacheKey = `comments:${validPage}:${validLimit}:${sort}:${order}:${JSON.stringify(
      filters,
    )}`;

    const cachedResult = await this.redisService.get<{
      data: Comment[];
      meta: { total: number; page: number; pages: number };
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const where = new Brackets((qb) => {
      if (filters.text) {
        qb.andWhere('comment.text LIKE :text', { text: `%${filters.text}%` });
      }
      if (filters.username) {
        qb.andWhere('user.username LIKE :username', {
          username: `%${filters.username}%`,
        });
      }
      if (filters.email) {
        qb.andWhere('user.email LIKE :email', { email: `%${filters.email}%` });
      }
    });

    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('comment.files', 'files')
      .where(where)
      .orderBy(`comment.${sort}`, order)
      .skip((validPage - 1) * validLimit)
      .take(validLimit)
      .getManyAndCount();

    const pages = Math.ceil(total / validLimit);

    const result = {
      data: comments,
      meta: {
        total,
        page: validPage,
        pages,
      },
    };

    await this.redisService.set(cacheKey, result, 60 * 5);

    return result;
  }

  async createComment(
    userId: string,
    text: string,
    files?: Express.Multer.File[],
    parentId?: string,
  ): Promise<Comment> {
    const parentComment = parentId
      ? await this.commentRepository.findOne({ where: { id: parentId } })
      : null;

    if (parentId && !parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const comment = this.commentRepository.create({
      text,
      user: { id: userId } as any,
      parentComment: parentComment || undefined,
    });

    const savedComment = await this.commentRepository.save(comment);

    if (files && files.length > 0) {
      const uploadedFiles = await Promise.all(
        files.map((file) => this.uploadService.uploadFile(file)),
      );

      const newFiles = uploadedFiles.map((file) =>
        this.fileRepository.create({
          filename: file.filename,
          mimetype: file.mimetype,
          path: file.path,
          comment: savedComment,
        }),
      );

      await this.fileRepository.save(newFiles);
    }

    return savedComment;
  }

  async updateComment(
    id: string,
    userId: string,
    newText?: string,
    files?: Express.Multer.File[],
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'files'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new UnauthorizedException('Not authorized to edit this comment');
    }

    if (newText) {
      comment.text = newText;
    }

    if (files && files.length > 0) {
      if (comment.files && comment.files.length > 0) {
        for (const file of comment.files) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error(`Failed to delete file: ${file.path}`, error);
          }
        }
        await this.fileRepository.remove(comment.files);
      }

      const uploadedFiles = await Promise.all(
        files.map((file) => this.uploadService.uploadFile(file)),
      );

      const newFiles = uploadedFiles.map((file) =>
        this.fileRepository.create({
          filename: file.filename,
          mimetype: file.mimetype,
          path: file.path,
          comment,
        }),
      );

      await this.fileRepository.save(newFiles);
    }

    return this.commentRepository.save(comment);
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'files'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    if (comment.files && comment.files.length > 0) {
      await this.rabbitMQService.send('file.delete', {
        files: comment.files.map((file) => file.path),
      });
    }

    await this.commentRepository.remove(comment);
  }
}
