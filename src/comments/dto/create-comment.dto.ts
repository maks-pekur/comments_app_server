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
}
