import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  Logger,
  ValidationPipe,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { CamelCaseInterceptor } from "./interceptors/camel-case.interceptor";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new CamelCaseInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle("McomMallLoyalty API")
    .setDescription("API documentation for Mcomall Loyalty Service")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/api-docs", app, document, {
    customfavIcon:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/favicon-16x16.png",
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js",
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
