import { ApiProperty } from '@nestjs/swagger';

export class CommentResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the comment',
    example: 'a123b456-c789-0def-ghij-klmn123opqr',
  })
  id!: string;

  @ApiProperty({
    description: 'Text of the comment',
    example: 'This is a sample comment',
  })
  text!: string;

  @ApiProperty({
    description: 'Unique identifier of the user who created the comment',
    example: 'user1234-abcd-5678-efgh-ijklmnopqrst',
  })
  userId!: string;

  @ApiProperty({
    description: 'Unique identifier of the parent comment (if reply)',
    example: 'a123b456-c789-0def-ghij-klmn123opqr',
    required: false,
  })
  parentId?: string;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    example: '2025-01-25T10:20:30.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the comment was last updated',
    example: '2025-01-25T10:30:45.000Z',
  })
  updatedAt!: Date;
}
