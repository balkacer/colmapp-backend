import { AuthGuard } from "@colmapp/guards";
import { Body, Controller, HttpException, Inject, Post, Req, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { randomUUID } from "crypto";
import { Public } from "libs/decorators/public.decorator";
import { lastValueFrom, retry, timeout } from "rxjs";

// @UseGuards(AuthGuard)
@Controller('business')
export class BusinessController {
    constructor(
        @Inject('BUSINESS_SERVICE') private businessClient: ClientProxy
    ) { }

    @Public()
    @Post()
    async create(
        @Body() body: any,
        @Req() req: any,
    ): Promise<void> {
        try {
            const traceId = req.headers['x-trace-id'] || randomUUID();
            return lastValueFrom(this.businessClient.send('business.create', {
                ...body,
                traceId,
                serviceSecret: process.env.SERVICE_SECRET
            }).pipe(
                timeout(8000),
                retry(1),
            ));
        } catch (err) {
            throw new HttpException(
                err?.message || 'Error desconocido',
                err?.statusCode || 500,
            );
        }
    }
}