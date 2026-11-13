import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { JobCircular } from "../models/JobCircular.js";
import { LearningModule } from "../models/LearningModule.js";
import { McqQuestion } from "../models/McqQuestion.js";
import { StudyResource } from "../models/StudyResource.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { WebSource } from "../models/WebSource.js";
import { webSourcesData } from "./data/webSources.js";
import { curatedJobTracksData } from "./data/jobCirculars.js";
import { learningModulesData } from "./data/learningModules.js";
import { mcqQuestionsData } from "./data/mcqQuestions.js";
import { studyResourcesData } from "./data/studyResources.js";
import { studyTopicsData } from "./data/studyTopics.js";
import { runLiveWebSync } from "../scrapers/index.js";

async function seed() {
  await connectDatabase();

  console.log("[Seed] Upserting WebSources...");
  for (const src of webSourcesData) {
    await WebSource.updateOne(
      { key: src.key },
      {
        $set: {
          name: src.name,
          organization: src.organization,
          organizationShort: src.organizationShort,
          url: src.url,
          adapterType: src.adapterType,
          targetType: src.targetType || "job",
          defaultCategory: src.defaultCategory,
          enabled: src.enabled ?? true,
        },
      },
      { upsert: true }
    );
  }

  console.log("[Seed] Upserting Curated Job Tracks...");
  for (const job of curatedJobTracksData) {
    await JobCircular.updateOne(
      { slug: job.slug },
      { $set: job },
      { upsert: true }
    );
  }

  console.log("[Seed] Upserting A-to-Z Learning Modules (26 Modules)...");
  for (const mod of learningModulesData) {
    await LearningModule.updateOne(
      { slug: mod.slug },
      { $set: mod },
      { upsert: true }
    );
  }

  console.log("[Seed] Upserting Practice MCQ Question Bank...");
  for (const q of mcqQuestionsData) {
    await McqQuestion.updateOne(
      { question: q.question },
      { $set: { examSeries: q.examSeries || "Topic Practice Bank", ...q } },
      { upsert: true }
    );
  }

  console.log("[Seed] Upserting Curated Study Resources & Books...");
  for (const resItem of studyResourcesData) {
    await StudyResource.updateOne(
      { slug: resItem.slug },
      { $set: resItem },
      { upsert: true }
    );
  }

  console.log("[Seed] Upserting Subject Study Topics (Topic Guru Lecture Sheets)...");
  for (const topicItem of studyTopicsData) {
    await StudyTopic.updateOne(
      { slug: topicItem.slug },
      { $set: topicItem },
      { upsert: true }
    );
  }

  await Promise.all([
    McqQuestion.syncIndexes(),
    StudyTopic.syncIndexes(),
  ]);

  console.log(
    "[Seed] Running initial Live Web Sync (official BD govt portals + live Current Affairs RSS)..."
  );
  const syncResult = await runLiveWebSync({ triggeredBy: "seed" });
  console.log("[Seed] Live Web Sync result:", {
    status: syncResult.status,
    sourcesChecked: syncResult.log?.sourcesChecked,
    totalFetched: syncResult.log?.totalFetched,
    newInserted: syncResult.log?.newInserted,
    errors: syncResult.errors?.length || 0,
  });

  if (syncResult.errors?.length) {
    console.warn("[Seed] Source warnings:", syncResult.errors);
  }

  await disconnectDatabase();
  console.log("[Seed] Completed successfully.");
}

seed().catch(async (err) => {
  console.error("[Seed] Fatal error:", err);
  await disconnectDatabase();
  process.exit(1);
});
