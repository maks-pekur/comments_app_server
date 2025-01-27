import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { sanitizeComment } from '../utils/sanitize';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { UpdateCommentDTO } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of comments per page (default: 10)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    example: 'created_at',
    description: 'Sorting criteria (default: "created_at")',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'DESC',
    description: 'Sorting order (default: "DESC")',
  })
  @ApiQuery({
    name: 'text',
    required: false,
    example: 'comment',
    description: 'Filter comments by text content',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    example: 'Alice',
    description: 'Filter comments by username',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    example: 'alice@example.com',
    description: 'Filter comments by email',
  })
  async getComments(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sort') sort: 'created_at' | 'username' | 'email' = 'created_at',
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('text') text?: string,
    @Query('username') username?: string,
    @Query('email') email?: string,
  ) {
    const validSortFields = ['created_at', 'username', 'email'];
    const validOrderValues = ['ASC', 'DESC'];

    if (!validSortFields.includes(sort)) {
      sort = 'created_at';
    }
    if (!validOrderValues.includes(order)) {
      order = 'DESC';
    }

    return this.commentsService.getComments(page, limit, sort, order, {
      text,
      username,
      email,
    });
  }

  @ApiOperation({ summary: 'Create a comment or reply to a comment' })
  @ApiBody({ type: CreateCommentDTO })
  @ApiOkResponse({
    description: 'Comment successfully created',
    type: Comment,
  })
  @Post()
  async createComment(
    @Body() createCommentDto: CreateCommentDTO,
    @Req() req: Request & { current_user: { id: string } },
  ) {
    if (!req.current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.current_user.id;

    return this.commentsService.createComment(
      userId,
      createCommentDto.text,
      createCommentDto.parentId,
    );
  }

  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to update',
    example: 'comment-id-123',
  })
  @ApiBody({
    type: UpdateCommentDTO,
    description: 'Data for updating the comment',
  })
  @ApiOkResponse({
    description: 'Comment successfully updated',
    type: Comment,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authorized to edit this comment',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDTO,
    @Req() req: Request & { current_user: { id: string } },
  ) {
    if (!req.current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.current_user.id;

    return this.commentsService.updateComment(
      id,
      userId,
      updateCommentDto.text,
    );
  }

  @ApiOperation({ summary: 'Preview a comment before submitting' })
  @ApiBody({
    type: CreateCommentDTO,
    description: 'Comment data for preview',
  })
  @ApiOkResponse({
    description: 'Sanitized and validated comment preview',
    type: String,
  })
  @Post('preview')
  async previewComment(
    @Body() createCommentDto: CreateCommentDTO,
  ): Promise<{ preview: string }> {
    const sanitizedText = sanitizeComment(createCommentDto.text);
    return { preview: sanitizedText };
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to delete',
    example: 'comment-id-123',
  })
  @ApiOkResponse({
    description: 'Comment successfully deleted',
  })
  @ApiForbiddenResponse({
    description: 'User not authorized to delete this comment',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @Req() req: Request & { current_user: { id: string } },
  ) {
    if (!req.current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.current_user.id;

    await this.commentsService.deleteComment(id, userId);

    return { message: 'Comment successfully deleted' };
  }
}
