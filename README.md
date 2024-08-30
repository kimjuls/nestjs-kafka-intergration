# nestjs-kafka-intergration

This is a playground for test to integrating Kafka and NestJS project.

## Test

### Run through docker compose

After `git clone`, just execute the following.

```bash
docker compose up -d
# Or
docker-compose up -d
```

### Curl it

```bash
curl http://localhost:3000
```

### If apps crushed, compose up again. It's because the partitions of Kafka were not ready.

```bash
docker compose up -d
# Or
docker-compose up -d
```
