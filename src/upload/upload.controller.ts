import {
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { promises as fs } from 'fs';
import { join } from 'path';
import { resizeImage } from '../utils/resize-image';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  @Post()
  @ApiOperation({ summary: 'Upload a file (image or text)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      example: {
        message: 'Image uploaded and resized successfully',
        file: 'example.png',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
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
      throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
    }

    if (mimetype === 'text/plain' && size > 100 * 1024) {
      throw new HttpException(
        'Text file size exceeds 100 KB',
        HttpStatus.BAD_REQUEST,
      );
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
        throw new HttpException(
          `Failed to process image: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return {
      message: 'Text file uploaded successfully',
      file: originalname,
    };
  }
}
