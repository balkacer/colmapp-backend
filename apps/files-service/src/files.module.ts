import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [FilesController],
  providers: [],
})
export class FilesModule {}
