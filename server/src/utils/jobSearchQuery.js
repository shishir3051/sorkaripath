import { capSearchQuery, escapeRegex } from "./security.js";

const SEARCH_NOISE_WORDS = new Set([
  "job",
  "jobs",
  "circular",
  "circulars",
  "notice",
  "notices",
  "recruitment",
  "vacancy",
  "vacancies",
  "career",
  "bdjobs",
  "bd",
  "govt",
  "government",
  "bangladesh",
  "of",
  "for",
  "and",
  "the",
  "in",
  "to",
  "on",
  "at",
  "by",
  "from",
  "with",
  "about",
  "what",
  "which",
  "who",
  "when",
  "where",
  "how",
  "are",
  "is",
  "was",
  "can",
  "tell",
  "give",
  "show",
  "find",
  "get",
  "me",
  "info",
  "infos",
  "details",
  "latest",
  "recent",
  "new",
  "open",
  "active",
  "current",
  "today",
  "this",
  "week",
  "month",
  "all",
]);

const BILINGUAL_SEARCH_ALIASES = new Map([
  [
    "post",
    "(?:\\bposts?\\b|postal|postmaster|bdpost|\\bpost\\s+office\\b|ডাক)",
  ],
  ["postal", "(?:postal|bdpost|\\bpost\\s+office\\b|postmaster|ডাক)"],
  [
    "bdpost",
    "(?:bdpost|\\bpost\\s+office\\b|postal\\s+(?:directorate|department)|postmaster|ডাক\\s*অধিদপ্তর|ডাক\\s*বিভাগ|ডাক)",
  ],
  ["dak", "(?:bdpost|\\bpost\\s+office\\b|postal|ডাক)"],
  [
    "office",
    "(?:\\boffices?\\b|অফিস|বিভাগ|অধিদপ্তর|দপ্তর|division|directorate)",
  ],
  ["ministry", "(?:\\bministr(?:y|ies)\\b|মন্ত্রণালয়)"],
  ["directorate", "(?:\\bdirectorates?\\b|অধিদপ্তর|পরিদপ্তর)"],
  ["telecom", "(?:telecom|telecommunications|টেলিযোগাযোগ|\\bptd\\b|btcl|টেলিটক)"],
  ["telecommunications", "(?:telecom|telecommunications|টেলিযোগাযোগ|\\bptd\\b|btcl)"],
  ["ptd", "(?:\\bptd\\b|telecommunications|টেলিযোগাযোগ|ডাক)"],
  ["railway", "(?:railway|\\brail\\b|রেলওয়ে|রেল)"],
  ["rail", "(?:railway|\\brail\\b|রেলওয়ে|রেল)"],
  ["bank", "(?:bank|ব্যাংক|\\bbsc\\b|আর্থিক)"],
  ["bsc", "(?:\\bbsc\\b|ব্যাংক|bankers)"],
  ["health", "(?:health|স্বাস্থ্য|dghs|মেডিকেল|চিকিৎসা)"],
  ["dghs", "(?:health|স্বাস্থ্য|dghs)"],
  ["primary", "(?:primary|প্রাথমিক|\\bdpe\\b)"],
  ["dpe", "(?:\\bdpe\\b|প্রাথমিক\\s*শিক্ষা|primary\\s+education|প্রাথমিক)"],
  ["teacher", "(?:teacher|ntrca|শিক্ষক|শিক্ষা)"],
  ["ntrca", "(?:\\bntrca\\b|বেসরকারি\\s*শিক্ষক|শিক্ষক\\s*নিবন্ধন)"],
  ["education", "(?:education|শিক্ষা|moedu|dshe|shed|primary|প্রাথমিক|\\bdpe\\b)"],
  ["police", "(?:police|পুলিশ|স্বরাষ্ট্র|moha|আনসার|bgb)"],
  ["home", "(?:\\bhome\\b|স্বরাষ্ট্র|moha|পুলিশ)"],
  ["defense", "(?:defen[cs]e|প্রতিরক্ষা|\\bmod\\b|সেনা|নৌ|বিমান)"],
  ["defence", "(?:defen[cs]e|প্রতিরক্ষা|\\bmod\\b|সেনা|নৌ|বিমান)"],
  ["finance", "(?:finance|অর্থ|\\bmof\\b|বেতন|ভাতা|বাজেট)"],
  ["food", "(?:\\bfoods?\\b|খাদ্য|mofood|dgfood)"],
  ["dgfood", "(?:dgfood|খাদ্য\\s*অধিদপ্তর)"],
  ["social", "(?:social|welfare|সমাজকল্যাণ|\\bmsw\\b|\\bdss\\b)"],
  ["welfare", "(?:social|welfare|সমাজকল্যাণ|\\bmsw\\b|\\bdss\\b)"],
  ["dss", "(?:\\bdss\\b|সমাজসেবা|social\\s*services)"],
  ["agriculture", "(?:agriculture|কৃষি|\\bmoa\\b|\\bdae\\b)"],
  ["land", "(?:\\blands?\\b|ভূমি|minland)"],
  ["local", "(?:local|স্থানীয়|\\blgd\\b|lged)"],
  ["lged", "(?:\\blged\\b|স্থানীয়\\s*সরকার\\s*প্রকৌশল)"],
  ["pwd", "(?:\\bpwd\\b|গণপূর্ত|public\\s*works)"],
  ["water", "(?:water|পানি|mowr|bwdb)"],
  ["shipping", "(?:shipping|নৌ|\\bmos\\b|\\bports?\\b|বন্দর)"],
  ["environment", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["forest", "(?:environment|forest|পরিবেশ|বন|moef)"],
  ["aviation", "(?:aviation|tourism|বিমান|পর্যটন|mocat)"],
  ["information", "(?:information|তথ্য|সম্প্রচার|\\bmoi\\b|moib)"],
  ["women", "(?:women|children|মহিলা|শিশু|mowca)"],
  ["ict", "(?:\\bict\\b|computer|কম্পিউটার|তথ্য ও যোগাযোগ|ictd)"],
  ["bcs", "(?:\\bbcs\\b|বিসিএস|cadre|ক্যাডার|bpsc)"],
  ["recruitment", "(?:recruit|নিয়োগ|circular|বিজ্ঞপ্তি|শূন্য)"],
  ["circular", "(?:circular|বিজ্ঞপ্তি|নিয়োগ)"],
  ["result", "(?:result|ফলাফল|ফল|উত্তীর্ণ|সুপারিশ)"],
  ["viva", "(?:viva|মৌখিক|schedule|সময়সূচি)"],
  ["exam", "(?:exam|পরীক্ষা|written|লিখিত|preliminary|mcq)"],
  ["admit", "(?:admit|প্রবেশপত্র)"],
]);

/**
 * Expands both precomposed (য়/ড়/ঢ়/ো/ৌ) and decomposed (য+় / ড+় / ঢ+় / ে+া / ে+ৗ)
 * Bengali codepoint forms so standard keyboard input matches National Portal HTML.
 */
export function expandBengaliUnicodeVariants(pattern) {
  return String(pattern || "")
    .replace(/\u09AF\u09BC|\u09DF/g, "(?:\u09DF|\u09AF\u09BC)")
    .replace(/\u09A1\u09BC|\u09DC/g, "(?:\u09DC|\u09A1\u09BC)")
    .replace(/\u09A2\u09BC|\u09DD/g, "(?:\u09DD|\u09A2\u09BC)")
    .replace(/\u09C7\u09BE|\u09CB/g, "(?:\u09CB|\u09C7\u09BE)")
    .replace(/\u09C7\u09D7|\u09CC/g, "(?:\u09CC|\u09C7\u09D7)");
}

export function canonicalizeSearchPhrases(query) {
  return String(query || "")
    .normalize("NFKC")
    .replace(
      /\b(?:bangladesh\s+)?post\s+office\b|\bpostal\s+(?:directorate|department)\b|\bbangladesh\s+post\b/gi,
      " bdpost "
    )
    .replace(
      /\bdirectorate\s+of\s+primary\s+education\b|\bprimary\s+education\b/gi,
      " dpe "
    )
    .replace(/\bdg\s+food\b|\bfood\s+directorate\b/gi, " dgfood ")
    .replace(/\bpublic\s+works\b/gi, " pwd ")
    .replace(/\bsocial\s+services\b/gi, " dss ");
}

export function buildTokenCondition(token) {
  const alias = BILINGUAL_SEARCH_ALIASES.get(token.toLowerCase());
  const rawPattern = alias || escapeRegex(token);
  const regex = new RegExp(expandBengaliUnicodeVariants(rawPattern), "i");
  return {
    $or: [
      { title: regex },
      { titleBn: regex },
      { organization: regex },
      { organizationShort: regex },
      { summary: regex },
      { tags: regex },
    ],
  };
}

export function buildJobSearchTokenSets(rawQuery, maxLen = 100) {
  const search = capSearchQuery(rawQuery, maxLen);
  if (!search) return [];
  const normalized = canonicalizeSearchPhrases(search);
  const rawTokens = normalized
    .split(/[\s,+/|?]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 18);

  if (rawTokens.length === 0) return [search.normalize("NFKC")];
  const coreTokens = rawTokens.filter(
    (t) => !SEARCH_NOISE_WORDS.has(t.toLowerCase())
  );
  return (coreTokens.length > 0 ? coreTokens : rawTokens).slice(0, 5);
}
