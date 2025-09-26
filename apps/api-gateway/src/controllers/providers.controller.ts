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
                    timeout(10000),
                    retry(3),
                ))
        }

        return lastValueFrom(this.providersClient.send('providers.create', {
            ...body,
            logoUrl: uploadResult.secure_url,
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Get()
    async findAll(@Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();
        return lastValueFrom(this.providersClient.send('providers.findAll', {
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();
        return lastValueFrom(this.providersClient.send('providers.findOne', {
            id, 
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();
        return lastValueFrom(this.providersClient.send('providers.update', {
            id, 
            dto, 
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();
        return lastValueFrom(this.providersClient.send('providers.remove', {
            id, 
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }
}