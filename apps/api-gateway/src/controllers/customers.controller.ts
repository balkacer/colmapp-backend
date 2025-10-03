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
        const traceId = req.headers['x-trace-id'] || randomUUID();

        try {
            return firstValueFrom(this.customersClient.send('customers.create', {
                ...body,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
                err?.traceId || traceId
            );
        }
    }

    @Get()
    async findAll(@Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();

        try {
            return firstValueFrom(this.customersClient.send('customers.findAll', {
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
                err?.traceId || traceId
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();

        try {
            return firstValueFrom(this.customersClient.send('customers.findOne', {
                id,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
                err?.traceId || traceId
            );
        }
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();

        try {
            return firstValueFrom(this.customersClient.send('customers.update', {
                id,
                dto,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
                err?.traceId || traceId
            );
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const traceId = req.headers['x-trace-id'] || randomUUID();

        try {
            return firstValueFrom(this.customersClient.send('customers.remove', {
                id,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(
                timeout(10000),
                retry(3),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
                err?.traceId || traceId
            );
        }
    }
}