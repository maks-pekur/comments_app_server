import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { resizeImage } from '../utils/resize-image';

@Injectable()
export class UploadService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ filename: string; path: string; mimetype: string }> {
    const { originalname, mimetype, path: tempPath, size } = file;

    if (!file) {
      throw new HttpException('File not provided', HttpStatus.BAD_REQUEST);
    }

    if (mimetype === 'text/plain' && size > 100 * 1024) {
      throw new HttpException(
        'Text file size exceeds 100 KB',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (mimetype.startsWith('image/')) {
      const outputDir = './uploads/resized';
      const outputPath = join(outputDir, originalname);

      try {
        await fs.mkdir(outputDir, { recursive: true });

        await resizeImage(tempPath, outputPath);

        await fs.unlink(tempPath);

        return {
          filename: originalname,
          path: outputPath,
          mimetype,
        };
      } catch (error: any) {
        throw new HttpException(
          `Failed to process image: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return {
      filename: originalname,
      path: tempPath,
      mimetype,
    };
  }
}
