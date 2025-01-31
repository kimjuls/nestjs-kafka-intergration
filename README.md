# nestjs-kafka-intergration

이 프로젝트는 NestJS와 Kafka를 통합하는 테스트 프로젝트이다. Producer과 Consumer 역할의 두 NestJS 마이크로서비스와 Kafka를 통합하기 위해 `kafkajs` 패키지를 사용하였다.

## Summary

- app에서는 Kafka 브로커를 통해 메시지를 보낼 수 있게 Client 객체를 준비한다. root path로 요청하면, Kafka 브로커로 메시지를 보낼 것이다.

  ```typescript
  // Module decorator in app.module.ts
  @Module({
    imports: [
      ClientsModule.register([
        {
          name: 'KAFKA_CLIENT',
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'app',
              brokers: ['kafka:9092'],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
            consumer: {
              groupId: 'app-consumer',
              allowAutoTopicCreation: true,
            },
          },
        },
      ]),
    ],
    ...
  })

  // app.controller.ts
  @Controller()
  export class AppController {
    constructor(
      ...
      @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka
    ) {}

    @Get()
    getHello(): Observable<RecordMetadata[]> {
      ...
      return this.kafkaClient.emit(<pattern>, <message>);
    }
    ...
  }
  ```

- app2에서는 Kafka 브로커로부터 메시지를 수신할 수 있도록 마이크로서비스를 생성하고 이벤트를 받을 준비를 한다. app에서 emit한 `<message>`를 받아 출력하게 될 것이다.

  ```typescript
  // bootstrap function in main.ts
  ...
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['kafka:9092'],
        },
        consumer: {
          groupId: 'app-consumer',
          allowAutoTopicCreation: true,
        },
      },
    });
    app.startAllMicroservices();
    await app.listen(3001);
  }
  ...

  // app.controller.ts
  @Controller()
  export class AppController {
    ...
    @EventPattern('logger')
    reply(@Payload() message: string) {
      console.log('consumed', message);
    }
    ...
  }
  ```

- kafka 서버를 생성하기 위해 docker compose 클러스터 내에 세팅한다.

  ```yaml
  ---
  kafka:
    image: docker.io/bitnami/kafka:3.8
    container_name: kafka
    hostname: kafka
    ports:
      - "9092:9092"
    environment:
      # KRaft settings
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      # Listeners
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://:9092
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_INTER_BROKER_LISTENER_NAME=PLAINTEXT
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true
  ```

- 테스트는 다음과 같이 수행한다.

  ```sh
  # Compose up apps with docker. If apps crushed, compose up again. It's because the partitions of Kafka were not ready.
  docker compose up -d

  # Curl it
  curl http://localhost:3000
  ```

- 결과 예시는 다음과 같다. app에서 emit한 뒤, app2에서 해당 메시지를 받아 그대로 출력하였다.
  ```sh
  % docker compose logs -n 2 app app2
  app  | [Nest] 1  - 01/31/2025, 1:47:52 AM    WARN [ClientKafka] WARN [RequestQueue] Response without match {"timestamp":"2025-01-31T01:47:52.359Z","logger":"kafkajs","clientId":"app-client","broker":"kafka:9092","correlationId":338}
  app   | Someone called getHello
  app2  | [Nest] 1  - 01/31/2025, 1:47:53 AM    WARN [ServerKafka] WARN [RequestQueue] Response without match {"timestamp":"2025-01-31T01:47:53.348Z","logger":"kafkajs","clientId":"nestjs-consumer-server","broker":"kafka:9092","correlationId":339}
  app2  | consumed Someone called getHelloin app
  ```
