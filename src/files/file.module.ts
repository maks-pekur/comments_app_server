import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './file.entity';
import { FileWorker } from './file.worker';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  providers: [FileWorker],
  exports: [FileWorker],
})
export class FileModule {}
