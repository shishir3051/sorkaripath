import { banglaTopics } from "./topics/banglaTopics.js";
import { englishTopics } from "./topics/englishTopics.js";
import { mathTopics } from "./topics/mathTopics.js";
import { bdAndIntlTopics } from "./topics/bdAndIntlTopics.js";
import { scienceIctTopics } from "./topics/scienceIctTopics.js";
import { ethicsGeoRulesTopics } from "./topics/ethicsGeoRulesTopics.js";
import { extraCoreTopics } from "./topics/extraCoreTopics.js";
import { nctbBanglaTopics } from "./topics/nctbBanglaTopics.js";
import { nctbEnglishTopics } from "./topics/nctbEnglishTopics.js";
import { nctbMathAndCoreTopics } from "./topics/nctbMathAndCoreTopics.js";
import { nctbMathDeepTopics } from "./topics/nctbMathDeepTopics.js";

export const studyTopicsData = [
  ...banglaTopics,
  ...englishTopics,
  ...mathTopics,
  ...bdAndIntlTopics,
  ...scienceIctTopics,
  ...ethicsGeoRulesTopics,
  ...extraCoreTopics,
  ...nctbBanglaTopics,
  ...nctbEnglishTopics,
  ...nctbMathAndCoreTopics,
  ...nctbMathDeepTopics,
];
