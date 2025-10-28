import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Inject,
    UploadedFile,
    UseInterceptors,
    Req,
    HttpException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { lastValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

@Controller('providers')
export class ProvidersController {
    constructor(
        @Inject('PROVIDERS_SERVICE') private readonly providersClient: ClientProxy,
        @Inject('FILES_SERVICE') private filesClient: ClientProxy,
    ) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async create(
        @Body() body: any,
        @Req() req: any,
        @UploadedFile() file?: Express.Multer.File
    ) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            let uploadResult = { secure_url: null };

            if (file) {
                uploadResult = await lastValueFrom(this.filesClient
                    .send('files.upload', {
                        buffer: file.buffer,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        traceId,
                        serviceSecret: process.env.SERVICE_SECRET,
                    }).pipe(
                        timeout(8000),
                        retry(1),
                    ))
            }

            return lastValueFrom(this.providersClient.send('providers.create', {
                ...body,
                logoUrl: uploadResult.secure_url,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500
            );
        }
    }

    @Get()
    async findAll(@Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.providersClient.send('providers.findAll', {
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.providersClient.send('providers.findOne', {
                id,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500
            );
        }
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.providersClient.send('providers.update', {
                id,
                dto,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500
            );
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.providersClient.send('providers.remove', {
                id,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500
            );
        }
    }
}