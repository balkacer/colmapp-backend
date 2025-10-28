import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Inject,
    Req,
    HttpException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

@Controller('customers')
export class CustomersController {
    constructor(@Inject('CUSTOMERS_SERVICE') private readonly customersClient: ClientProxy) { }

    @Post()
    async create(@Body() body: any, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return firstValueFrom(this.customersClient.send('customers.create', {
                ...body,
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
            return firstValueFrom(this.customersClient.send('customers.findAll', {
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
            return firstValueFrom(this.customersClient.send('customers.findOne', {
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
            return firstValueFrom(this.customersClient.send('customers.update', {
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
            return firstValueFrom(this.customersClient.send('customers.remove', {
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