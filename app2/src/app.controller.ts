import {
  Controller,
  Get,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly appService: AppService) {}

  async onModuleInit(): Promise<void> {}

  async onModuleDestroy(): Promise<void> {}

  @EventPattern('logger')
  replySum(@Payload() message: string) {
    console.log('consumed', message);
  }

  @Get()
  async getHello() {
    console.log('Someone called getHello to app2');
    return this.appService.getHello();
  }
}
