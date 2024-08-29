import {
  Controller,
  Get,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClientKafka } from '@nestjs/microservices';
import { RecordMetadata } from 'kafkajs';
import axios from 'axios';
import { Observable } from 'rxjs';

@Controller()
export class AppController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly appService: AppService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    const topics = ['logger'];
    topics.forEach((topic) => this.kafkaClient.subscribeToResponseOf(topic));
    await this.kafkaClient.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  @Get()
  getHello(): Observable<RecordMetadata[]> {
    console.log('Someone called getHello');
    return this.kafkaClient.emit(
      'logger',
      'Someone called getHello' + 'in app',
    );
  }

  @Get('2')
  async getHello2() {
    console.log('Someone called getHello2');
    console.log('send hello to app2');
    const res = await axios.get('http://app2:3001');
    console.log('sent');
    console.log('HTTP status', res.status, ': ', res.data);
    return await this.appService.getHello();
  }
}
