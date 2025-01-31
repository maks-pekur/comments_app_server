import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RestCurrentUser } from '../auth/auth.decorator';
import { CaptchaService } from '../captcha/captcha.service';
import { IJwtPayload } from '../user/user.entity';
import { sanitizeComment } from '../utils/sanitize';
import { CommentsService } from './comments.service';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { UpdateCommentDTO } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly captchaService: CaptchaService,
  ) {}

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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '25',
    @Query('sort') sort: 'created_at' | 'username' | 'email' = 'created_at',
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('text') text?: string,
    @Query('username') username?: string,
    @Query('email') email?: string,
  ) {
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 25;

    return this.commentsService.getComments(
      pageNumber,
      limitNumber,
      sort,
      order,
      {
        text,
        username,
        email,
      },
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a comment with optional files and CAPTCHA' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Comment data with optional files and CAPTCHA',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'This is a comment' },
        parentId: {
          type: 'string',
          example: 'parent-comment-id',
          nullable: true,
        },
        captcha: {
          type: 'string',
          example: '03AFcWeA5B4c..._TOKEN_...q6J2',
          description: 'CAPTCHA token from Google reCAPTCHA',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Comment successfully created',
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  async createComment(
    @Body() createCommentDto: CreateCommentDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @RestCurrentUser() current_user: IJwtPayload,
  ) {
    if (!current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = current_user.id;

    await this.captchaService.verifyCaptcha(createCommentDto.captcha);

    return this.commentsService.createComment(
      userId,
      createCommentDto.text,
      files,
      createCommentDto.parentId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment with optional files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Data for updating the comment with optional files',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Updated comment text' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comment successfully updated',
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @RestCurrentUser() current_user: IJwtPayload,
  ) {
    if (!current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = current_user.id;

    return this.commentsService.updateComment(
      id,
      userId,
      updateCommentDto.text,
      files,
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

  @Delete(':id')
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
  async deleteComment(
    @Param('id') id: string,
    @RestCurrentUser() current_user: IJwtPayload,
  ) {
    if (!current_user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = current_user.id;

    await this.commentsService.deleteComment(id, userId);

    return { message: 'Comment successfully deleted' };
  }
}
