import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { DataSource, Repository } from 'typeorm';
import { File } from '../files/file.entity';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { UploadService } from '../upload/upload.service';
import { User } from '../user/user.entity';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,

    private readonly uploadService: UploadService,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly data_source: DataSource,
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

    const cacheKey = `comments:${validPage}:${validLimit}:${sort}:${order}:${JSON.stringify(filters)}`;
    const cachedResult = await this.redisService.get<{
      data: Comment[];
      meta: { total: number; page: number; pages: number };
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.files', 'files')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('replies.files', 'replyFiles')
      .where('comment.parentComment IS NULL');

    if (filters.text) {
      queryBuilder.andWhere('comment.text LIKE :text', {
        text: `%${filters.text}%`,
      });
    }
    if (filters.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${filters.username}%`,
      });
    }
    if (filters.email) {
      queryBuilder.andWhere('user.email LIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    const [comments, total] = await queryBuilder
      .orderBy(`comment.${sort}`, order)
      .skip((validPage - 1) * validLimit)
      .take(validLimit)
      .getManyAndCount();

    const pages = Math.ceil(total / validLimit);

    const result = {
      data: comments,
      meta: { total, page: validPage, pages },
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
    return this.data_source.transaction(async (manager) => {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      let parentComment: Comment | null = null;
      if (parentId) {
        parentComment = await manager
          .getRepository(Comment)
          .findOne({ where: { id: parentId } });
        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const comment = manager.getRepository(Comment).create({
        text,
        user,
        parentComment: parentComment || undefined,
      });

      const savedComment = await manager.getRepository(Comment).save(comment);

      if (files && files.length > 0) {
        const uploadedFiles = await Promise.all(
          files.map((file) => this.uploadService.uploadFile(file)),
        );

        const newFiles = uploadedFiles.map((file) =>
          manager.getRepository(File).create({
            filename: file.filename,
            mimetype: file.mimetype,
            path: file.path,
            comment: savedComment,
          }),
        );

        await manager.getRepository(File).save(newFiles);
      }

      await this.redisService.delPattern('comments:*');

      return savedComment;
    });
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

    if (newText !== undefined) {
      if (newText.trim() === '') {
        throw new ForbiddenException('Comment text cannot be empty');
      }
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

    await this.commentRepository.save(comment);

    await this.redisService.delPattern('comments:*');

    return comment;
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'files', 'replies'],
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

    if (comment.replies && comment.replies.length > 0) {
      await this.commentRepository.remove(comment.replies);
    }

    await this.commentRepository.remove(comment);

    await this.redisService.delPattern('comments:*');
  }
}
