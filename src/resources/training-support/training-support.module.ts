import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainingVideo } from "./entities/training-video.entity";
import { HelpCenterArticle } from "./entities/help-center-article.entity";
import { TrainingGuide } from "./entities/training-guide.entity";
import { Tier } from "../tier/entities/tier.entity";
import { TrainingVideoService } from "./services/training-video.service";
import { HelpCenterArticleService } from "./services/help-center-article.service";
import { TrainingGuideService } from "./services/training-guide.service";
import { TrainingVideoController } from "./controllers/training-video.controller";
import { HelpCenterArticleController } from "./controllers/help-center-article.controller";
import { TrainingGuideController } from "./controllers/training-guide.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingVideo,
      HelpCenterArticle,
      TrainingGuide,
      Tier,
    ]),
  ],
  controllers: [
    TrainingVideoController,
    HelpCenterArticleController,
    TrainingGuideController,
  ],
  providers: [
    TrainingVideoService,
    HelpCenterArticleService,
    TrainingGuideService,
  ],
  exports: [
    TrainingVideoService,
    HelpCenterArticleService,
    TrainingGuideService,
  ],
})
export class TrainingSupportModule {}
