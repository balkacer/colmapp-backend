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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { lastValueFrom, retry, timeout } from 'rxjs';

@Controller('providers')
export class ProvidersController {
    constructor(
        @Inject('PROVIDERS_SERVICE') private readonly providersClient: ClientProxy,
        @Inject('FILES_SERVICE') private filesClient: ClientProxy,
    ) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async create(
        @Body() createDto: any,
        @UploadedFile() file?: Express.Multer.File
    ) {
        let uploadResult = { secure_url: null };

        if (file) {
            uploadResult = await lastValueFrom(this.filesClient
                .send('files.upload', {
                    buffer: file.buffer,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                }).pipe(
                    timeout(10000),
                    retry(3),
                ))
        }

        return lastValueFrom(this.providersClient.send('providers.create', {
            ...createDto,
            logoUrl: uploadResult.secure_url,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Get()
    async findAll() {
        return lastValueFrom(this.providersClient.send('providers.findAll', {}).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return lastValueFrom(this.providersClient.send('providers.findOne', id).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: any) {
        return lastValueFrom(this.providersClient.send('providers.update', { id, ...updateDto }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return lastValueFrom(this.providersClient.send('providers.remove', id).pipe(
            timeout(10000),
            retry(3),
        ));
    }
}