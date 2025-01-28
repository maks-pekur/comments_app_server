import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../upload/file.entity';
import { UploadModule } from '../upload/upload.module';
import { Comment } from './comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, File]), UploadModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
