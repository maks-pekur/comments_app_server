import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { RabbitMQSubscribe } from '../rabbitmq/rabbitmq.decorator';

@Injectable()
export class FileWorker {
  @RabbitMQSubscribe({
    exchange: 'file_exchange',
    routingKey: 'file.delete',
    queue: 'file_delete_queue',
  })
  async deleteFiles(msg: { files: string[] }) {
    const files = msg.files || [];

    for (const filePath of files) {
      try {
        await fs.unlink(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
    }
  }
}
