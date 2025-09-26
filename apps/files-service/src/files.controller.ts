import { Controller, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  @MessagePattern('files.upload')
  async uploadFile(@Payload() payload: any) {
    const { traceId, ...file } = payload;
    console.log(`[TraceId: ${traceId}] Uploading file: `, file.originalname);
    const buffer = Buffer.from(file.buffer.data);
    return this.cloudinaryService.uploadImage(buffer, file.originalname, file.mimetype);
  }
}
