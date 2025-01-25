import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDTO } from './comment-response.dto';

export class PaginatedCommentsResponseDTO {
  @ApiProperty({
    description: 'Array of comments for the current page',
    type: [CommentResponseDTO],
  })
  items!: CommentResponseDTO[];

  @ApiProperty({
    description: 'Total number of comments available',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of comments per page',
    example: 10,
  })
  limit!: number;
}
