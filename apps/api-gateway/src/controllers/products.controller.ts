import { Controller, Get, Post, Body, Param, Put, Delete, Inject, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { lastValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

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

        return lastValueFrom(this.productsClient
            .send('products.create', {
                ...body,
                imageUrl: uploadResult.secure_url,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ))
    }

    @Get()
    async findAll(@Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();
        return lastValueFrom(this.productsClient.send('products.findAll', {
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
        return lastValueFrom(this.productsClient.send('products.findOne', {
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
        return lastValueFrom(this.productsClient.send('products.update', {
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
        return lastValueFrom(this.productsClient.send('products.remove', {
            id, 
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
            timeout(10000),
            retry(3),
        ));
    }
}