import { Controller, Get, Post, Body, Param, Put, Delete, Inject, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { lastValueFrom, retry, timeout } from 'rxjs';

@Controller('products')
export class ProductsController {
    constructor(
        @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy,
        @Inject('FILES_SERVICE') private filesClient: ClientProxy,
    ) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async createProduct(
        @Body() body: any,
        @UploadedFile() file?: Express.Multer.File,
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

        return lastValueFrom(this.productsClient
            .send('products.create', {
                ...body,
                imageUrl: uploadResult.secure_url,
            }).pipe(
                timeout(10000),
                retry(3),
            ))
    }

    @Get()
    findAll() {
        return lastValueFrom(this.productsClient.send('products.findAll', {}).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return lastValueFrom(this.productsClient.send('products.findOne', id).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return lastValueFrom(this.productsClient.send('products.update', { id, dto }).pipe(
            timeout(10000),
            retry(3),
        ));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return lastValueFrom(this.productsClient.send('products.remove', id).pipe(
            timeout(10000),
            retry(3),
        ));
    }
}