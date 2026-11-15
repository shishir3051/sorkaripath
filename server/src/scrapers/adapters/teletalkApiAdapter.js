import {
  classifyRecord,
  createSourceHash,
  fetchPublicHtml,
  formatReadableBdDate,
  makeSafeSlug,
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
  return items;
}
