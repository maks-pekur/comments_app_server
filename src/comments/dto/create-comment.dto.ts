import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDTO {
  @ApiProperty({
    description: 'Text of the comment',
    example: 'This is a comment',
  })
  @IsString()
  public text!: string;

  @ApiProperty({
    description: 'ID of the parent comment (if replying to a comment)',
    example: 'parent-comment-id-123',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  public parentId?: string;

  @ApiProperty({
    description: 'CAPTCHA token from Google reCAPTCHA',
    example: '03AFcWeA5B4c..._TOKEN_...q6J2',
  })
  @IsString()
  public captcha!: string;
}
