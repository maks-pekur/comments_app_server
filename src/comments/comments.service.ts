import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { IsNull, Like, Repository } from 'typeorm';
import { File } from '../upload/file.entity';
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
      relations: ['replies', 'user', 'files'],
      order:
        sort === 'username'
          ? { user: { username: order } }
          : sort === 'email'
            ? { user: { email: order } }
            : { created_at: order },
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    });

    const pages = Math.ceil(total / validLimit);

    return {
      data: comments,
      meta: {
        total,
        page: validPage,
        pages,
      },
    };
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
      let successCount = 0;
      let errorCount = 0;

      for (const file of comment.files) {
        try {
          await fs.unlink(file.path);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete file: ${file.path}`, error);
          errorCount++;
        }
      }

      console.log(`Files deleted: ${successCount}, Errors: ${errorCount}`);
    }

    await this.commentRepository.remove(comment);
  }
}
