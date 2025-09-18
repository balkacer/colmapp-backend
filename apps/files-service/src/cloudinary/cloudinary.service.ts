import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(buffer: Buffer, filename: string, mimetype: string): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
  return new Promise((resolve, reject) => {
    const _filename = filename.split('.')[0];
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: _filename, folder: 'colmapp', format: mimetype.split('/')[1] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}
}