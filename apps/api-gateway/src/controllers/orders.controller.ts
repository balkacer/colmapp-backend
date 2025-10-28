import { Controller, Get, Post, Patch, Delete, Body, Param, Inject, Req, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

@Controller('orders')
export class OrdersController {
    constructor(
        @Inject('ORDERS_SERVICE') private ordersClient: ClientProxy,
        @Inject('PAYMENT_SERVICE') private paymentClient: ClientProxy,
    ) { }

    @Post()
    async create(@Body() dto: any, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.ordersClient.send('orders.create', {
                ...dto,
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
            return lastValueFrom(this.ordersClient.send('orders.findAll', {
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
            return lastValueFrom(this.ordersClient.send('orders.findOne', {
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

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: any,
        @Req() req: any
    ) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.ordersClient.send('orders.updateStatus', {
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
            return lastValueFrom(this.ordersClient.send('orders.remove', {
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

    @Post('pay')
    async pay(@Body() dto: any, @Req() req: any) {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.paymentClient.send('payment.create', {
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
}