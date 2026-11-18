import * as cheerio from "cheerio";
import {
  cleanText,
  classifyRecord,
  createSourceHash,
  extractPdfLinksFromHtml,
  fetchPublicHtml,
  formatReadableBdDate,
  makeSafeSlug,
  mapWithConcurrency,
  resolveUrl,
} from "../utils.js";

/**
 * Adapter for the "Alljobs by Teletalk" public JSON API
 * (alljobs.teletalk.com.bd/api/v1/govt-jobs/list).
 *
 * The portal is a client-rendered SPA - its HTML document is ~1.7 KB and holds
 * no listings - so there is nothing for an HTML adapter to read. Its own front
 * end reads this endpoint, which carries better data than any notice board: a
 * real English AND Bangla job title, the hiring organisation, vacancy count,
 * apply URL, publish date and deadline.
 *
 * The API ignores its own limit parameter and always answers with one page of
 * 20 rows, so the full list is walked via page. An empty govtJobs array is its
 * end-of-list signal.
 */
const PAGE_SIZE = 20;
const MAX_PAGES = 30; // ~600 rows; hard stop if the API ever stops terminating
const PAGE_DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toJson(payload) {
  if (payload && typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    throw new Error("Teletalk API did not return valid JSON");
  }
}

function pageUrl(baseUrl, page) {
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));
  return url.toString();
}

function mapRow(row, source) {
  const title = String(row?.job_title || "").trim();
  if (!title) return null;

  const titleBn = String(row?.job_title_bn || "").trim() || title;
  const org = row?.job_utilities_govtorganization || {};
  const organization = String(org.name || "Government of Bangladesh").trim();
  const organizationShort = String(
    org.short_name || source.organizationShort || "ALLJOBS"
  ).trim();

  // This endpoint only ever returns live government vacancies, so recordType is
  // known rather than guessed. classifyRecord still picks the category.
  const { category } = classifyRecord(
    `${title} ${organization}`,
    source.defaultCategory
  );

  const published = row?.published_date ? new Date(row.published_date) : null;
  const deadline = row?.deadline_date ? new Date(row.deadline_date) : null;
  const publishedDate =
    published && !Number.isNaN(published.valueOf()) ? published : new Date();
  const deadlineDate =
    deadline && !Number.isNaN(deadline.valueOf()) ? deadline : null;

  const readableDate = formatReadableBdDate(publishedDate) || "Recent";
  const readableDeadline = deadlineDate
    ? formatReadableBdDate(deadlineDate)
    : "See official portal";

  const applyUrl = String(row?.application_site || "").trim() || source.url;
  const detailUrl = String(org.website || "").trim() || applyUrl;
  const jobKey = String(row?.job_id || row?.id || title);
  const sourceHash = createSourceHash(source.key, jobKey, applyUrl);

  const vacancies = row?.vacancy_not_specific
    ? "Not specified"
    : String(row?.vacancy || "See circular").trim();

  return {
    title,
    titleBn,
    slug: makeSafeSlug(title, organizationShort || source.key, sourceHash),
    sourceHash,
    recordType: "circular",
    origin: "web_sync",
    category,
    organization,
    organizationShort,
    gradeRange: category === "BCS" ? "Grade 9 (Cadre)" : "As per Circular",
    payScale2026: "National Pay Scale 2026 (Check Official Circular)",
    vacancies,
    ageLimit: "21 - 32 years (Govt Rule; check circular)",
    educationRequired: "See the official circular for full eligibility",
    applicationFee: "As per circular (paid via Teletalk SMS)",
    publishedDate,
    publishedDateRaw: readableDate,
    deadlineDate,
    deadlineRaw: readableDeadline,
    applyUrl,
    pdfUrl: "",
    detailUrl,
    sourceId: source.key,
    sourceName: source.name,
    summary: `${title} (${titleBn}) at ${organization}. Vacancies: ${vacancies}. Published ${readableDate}, apply by ${readableDeadline} via the official Teletalk portal.`,
    highlights: [
      `Organisation: ${organization}`,
      `Vacancies: ${vacancies}`,
      `Deadline: ${readableDeadline}`,
    ],
    applicationSteps: [
      "Open the official Teletalk application site for this post.",
      "Check post-wise eligibility, grade, age limit and application fee.",
      "Complete the online form and pay the fee by Teletalk SMS before the deadline.",
    ],
    relatedLessonSlugs:
      category === "BCS"
        ? ["b-bcs-cadres-blueprint", "g-teletalk-application-mastery"]
        : ["f-age-quota-2026-rules", "g-teletalk-application-mastery"],
    tags: [organizationShort, category, "circular", "Teletalk Alljobs"],
    isFeatured: false,
    isActive: true,
  };
}

const UTILITY_LINK_REGEX =
  /(?:^|\/)(?:index|applicantcopy|payment|recover|admitcard|help|circulars)(?:\.php)?(?:$|[?#])|\.(?:css|js|ico|png|jpe?g|svg)$/i;

function extractTeletalkDriveLinks(html, portalUrl) {
  let baseObj;
  try {
    baseObj = new URL(portalUrl);
  } catch {
    return [];
  }

  const $ = cheerio.load(html);
  const drives = [];
  const seen = new Set();

  $("a[href]").each((_, el) => {
    const rawHref = ($(el).attr("href") || "").trim();
    if (!rawHref || rawHref.startsWith("#")) return;
    if (UTILITY_LINK_REGEX.test(rawHref)) return;

    const resolved = resolveUrl(portalUrl, rawHref);
    if (!resolved || resolved === portalUrl) return;

    try {
      const target = new URL(resolved);
      if (target.host !== baseObj.host) return;
      if (target.pathname === baseObj.pathname && !target.search) return;
    } catch {
      return;
    }

    if (seen.has(resolved)) return;
    seen.add(resolved);
    drives.push({
      url: resolved,
      hint: cleanText($(el).text()),
    });
  });

  return drives.slice(0, 3);
}

async function resolveTeletalkPortalPdfs(portalUrl) {
  try {
    const html = await fetchPublicHtml(portalUrl, { timeoutMs: 4500 });
    const directPdfs = extractPdfLinksFromHtml(html, portalUrl);
    if (directPdfs.length > 0) return directPdfs;

    const drives = extractTeletalkDriveLinks(html, portalUrl);
    if (drives.length === 0) return [];

    const collected = [];
    const seen = new Set();
    await mapWithConcurrency(drives, 2, async (drive) => {
      try {
        const subHtml = await fetchPublicHtml(drive.url, { timeoutMs: 4000 });
        for (const pdf of extractPdfLinksFromHtml(subHtml, drive.url)) {
          if (seen.has(pdf.url)) continue;
          seen.add(pdf.url);
          collected.push({
            url: pdf.url,
            hint: cleanText(`${drive.hint} ${pdf.hint} ${drive.url}`),
          });
        }
      } catch {
        // Ignore broken individual sub-drive pages cleanly.
      }
    });

    return collected;
  } catch {
    return [];
  }
}

function pickBestPdfForItem(candidates, item) {
  if (!candidates || candidates.length === 0) return "";
  if (candidates.length === 1) return candidates[0].url;

  const d =
    item.publishedDate instanceof Date ? item.publishedDate : new Date();
  const yyyymmdd = Number.isNaN(d.valueOf())
    ? ""
    : d.toISOString().slice(0, 10).replace(/-/g, "");
  const year = yyyymmdd ? yyyymmdd.slice(0, 4) : "";
  const titleWords = String(item.title || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);

  let bestUrl = candidates[0].url;
  let bestScore = -1;

  for (const cand of candidates) {
    const hay = `${cand.url} ${cand.hint}`.toLowerCase();
    let score = 0;
    if (yyyymmdd && hay.includes(yyyymmdd)) score += 10;
    if (year && hay.includes(year)) score += 3;
    for (const w of titleWords) {
      if (hay.includes(w)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestUrl = cand.url;
    }
  }

  return bestUrl;
}

export async function parseTeletalkJobs(payload, source, limit = 400) {
  const firstPage = toJson(payload);
  const rows = Array.isArray(firstPage?.govtJobs) ? [...firstPage.govtJobs] : [];
  if (!rows.length) return [];

  const reportedTotal = Number(firstPage?.count) || 0;

  for (let page = 2; page <= MAX_PAGES; page += 1) {
    if (rows.length >= limit) break;
    if (reportedTotal && rows.length >= reportedTotal) break;

    let batch;
    try {
      const next = toJson(await fetchPublicHtml(pageUrl(source.url, page)));
      batch = Array.isArray(next?.govtJobs) ? next.govtJobs : [];
    } catch {
      // Keep the pages already gathered rather than failing the whole sync.
      break;
    }
    if (!batch.length) break;
    rows.push(...batch);
    await sleep(PAGE_DELAY_MS);
  }

  const items = [];
  const seen = new Set();
  for (const row of rows) {
    if (items.length >= limit) break;
    const key = String(row?.job_id || row?.id || "");
    if (key && seen.has(key)) continue;
    const item = mapRow(row, source);
    if (!item) continue;
    if (key) seen.add(key);
    items.push(item);
  }

  // Batch-resolve PDF attachments once per unique Teletalk application portal URL.
  const uniquePortalUrls = Array.from(
    new Set(
      items
        .map((it) => it.applyUrl)
        .filter((u) => u && u !== source.url)
    )
  );
  const portalPdfMap = new Map();
  await mapWithConcurrency(uniquePortalUrls, 8, async (portalUrl) => {
    const pdfs = await resolveTeletalkPortalPdfs(portalUrl);
    if (pdfs.length > 0) {
      portalPdfMap.set(portalUrl, pdfs);
    }
  });

  for (const item of items) {
    const candidates = portalPdfMap.get(item.applyUrl);
    if (!candidates) continue;
    const matchedPdf = pickBestPdfForItem(candidates, item);
    if (matchedPdf) {
      item.pdfUrl = matchedPdf;
      item.highlights = [
        ...item.highlights,
        "Direct Official PDF Attached",
      ];
    }
  }

  return items;
}
