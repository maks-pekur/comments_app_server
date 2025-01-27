import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { resizeImage } from '../utils/resize-image';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const { originalname, mimetype, path: tempPath, size } = file;

    const allowedFileTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];

    if (!allowedFileTypes.includes(mimetype)) {
      throw new Error('Invalid file type');
    }

    if (mimetype === 'text/plain' && size > 100 * 1024) {
      throw new Error('Text file size exceeds 100 KB');
    }

    if (mimetype.startsWith('image/')) {
      const outputDir = './uploads';
      const outputPath = join(outputDir, originalname);

      try {
        await fs.mkdir(outputDir, { recursive: true });

        await resizeImage(tempPath, outputPath);

        await fs.unlink(tempPath);

        return {
          message: 'Image uploaded and resized successfully',
          file: originalname,
        };
      } catch (error: any) {
        throw new Error(`Failed to process image: ${error.message}`);
      }
    }

    return {
      message: 'Text file uploaded successfully',
      file: originalname,
    };
  }
}
