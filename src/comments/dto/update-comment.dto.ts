import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateCommentDTO {
  @ApiProperty({
    description: 'Updated text for the comment',
    example: 'This is the updated comment text.',
  })
  @IsString()
  @Length(1, 1000, {
    message: 'Comment text must be between 1 and 1000 characters',
  })
  public readonly text!: string;
}
