import * as cheerio from "cheerio";
import { cleanText, createSourceHash } from "../utils.js";

function stripHtmlTags(raw = "") {
  if (!raw) return "";
  const $ = cheerio.load(`<div>${raw}</div>`);
  return cleanText($("div").text());
}

function parseRssDate(raw = "") {
  const cleaned = cleanText(raw).replace(/(\d{4}),\s+/, "$1 ");
  if (!cleaned) return new Date();
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function classifyAffairsTopic(title, summary, defaultCategory) {
  const text = `${title} ${summary}`.toLowerCase();
  if (/[\u0980-\u09FF]/.test(title) && defaultCategory === "Bangla Digest") {
    return "Bangla Digest";
  }
  if (
    /bank|inflation|gdp|remittance|export|import|budget|imf|world bank|tax|revenue|tariff|bond|reserve|economy|তথ্য|অর্থনীতি|ব্যাংক|বাজেট/.test(
      text
    )
  ) {
    return "Economy & Banking";
  }
  if (
    /un\b|united nations|summit|treaty|bilateral|diplomat|saarc|bimstec|brics|asean|g20|eu\b|china|india|usa|ukraine|gaza|climate/.test(
      text
    )
  ) {
    return "International Affairs";
  }
  if (
    /ai\b|artificial intelligence|cyber|satellite|digital|tech|software|science|climate|renewable|solar/.test(
      text
    )
  ) {
    return "Science & ICT";
  }
  if (
    /gazette|commission|ministry|constitution|reform|parliament|cabinet|court|policy|ordinance|circular|নির্বাচন|সংবিধান|মন্ত্রণালয়/.test(
      text
    )
  ) {
    return "Governance & Policy";
  }
  return defaultCategory || "Bangladesh Affairs";
}

function getExamRelevanceNote(topic) {
  switch (topic) {
    case "Economy & Banking":
      return "High-yield for Bank Written Focus Writing, BCS BD Affairs & Economic Review data.";
    case "International Affairs":
      return "Useful for BCS International Affairs, Diplomacy & Geopolitics Viva questions.";
    case "Governance & Policy":
      return "Relevant for BCS Constitution, Public Administration & Ethics/Good Governance.";
    case "Science & ICT":
      return "Relevant for BCS General Science & IT and Essay/Focus Writing.";
    case "Bangla Digest":
      return "Great for Bangla Editorial Translation, Precis & Recent Affairs MCQ.";
    default:
      return "Useful for BCS Bangladesh Affairs, Primary/NTRCA GK & Viva Voce.";
  }
}

export function parseRssCurrentAffairs(xml, source, limit = 12) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $("item").each((_, el) => {
    if (items.length >= limit) return false;

    const $item = $(el);
    const rawTitle = $item.find("title").first().text();
    const title = stripHtmlTags(rawTitle).replace(/^BSS-\d+\s+/i, "");
    const link = cleanText($item.find("link").first().text());
    if (!title || !link) return;

    const rawDesc = $item.find("description").first().text();
    let summary = stripHtmlTags(rawDesc).replace(/^ZCZC\s+BSS-\d+[^-]*-\s*/i, "");
    if (summary.length > 340) {
      summary = `${summary.slice(0, 337)}...`;
    }

    const pubRaw = $item.find("pubDate").first().text();
    const publishedDate = parseRssDate(pubRaw);
    const language = /[\u0980-\u09FF]/.test(title) ? "bn" : "en";
    const topic = classifyAffairsTopic(title, summary, source.defaultCategory);
    const sourceHash = createSourceHash(source.key, title, link);

    items.push({
      title,
      sourceHash,
      topic,
      language,
      sourceKey: source.key,
      sourceName: source.name,
      url: link,
      summary: summary || `Read full report at ${source.name}.`,
      publishedDate,
      examRelevanceNote: getExamRelevanceNote(topic),
    });
  });

  return items;
}
