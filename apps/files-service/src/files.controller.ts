import { Controller } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  @MessagePattern('files.upload')
  async uploadFile(@Payload() file: any) {
    const buffer = Buffer.from(file.buffer.data);
    return this.cloudinaryService.uploadImage(buffer, file.originalname, file.mimetype);
  }
}
