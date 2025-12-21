import { NestFactory } from "@nestjs/core";
import { SeederModule } from "./seeder/seeder.module";
import { SeederService } from "./seeder/seeder.service";
import { AppModule } from "./app.module";

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const seeder = appContext.get(SeederService);
  await seeder.seed();
  await appContext.close();
}

bootstrap();
