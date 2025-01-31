import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptchaModule } from '../captcha/captcha.module';
import { File } from '../files/file.entity';
import { RedisModule } from '../redis/redis.module';
import { UploadModule } from '../upload/upload.module';
import { User } from '../user/user.entity';
import { Comment } from './comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, File, User]),
    UploadModule,
    RedisModule,
    CaptchaModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
