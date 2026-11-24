import * as cheerio from "cheerio";
import {
  bnToEnDigits,
  cleanText,
  classifyRecord,
  createSourceHash,
  extractPdfLinksFromHtml,
  fetchPublicHtml,
  formatReadableBdDate,
  makeSafeSlug,
  mapWithConcurrency,
  parseBdDate,
  resolveUrl,
} from "../utils.js";

/**
 * Adapter for Bangladesh National Portal Framework v2 notice/exam tables
 * (bpsc.gov.bd, mopa.gov.bd, cabinet.gov.bd, railway.gov.bd, dghs.gov.bd, moedu.gov.bd)
 */
export async function parseNpfTable(html, source, limit = 15, context = {}) {
  const $ = cheerio.load(html);
  const items = [];

  $("table tbody tr, table tr.table-tr").each((_, row) => {
    if (items.length >= limit) return false;

    const $row = $(row);
    if ($row.hasClass("toggle-hidden") || $row.find("th").length > 0) return;

    const title = cleanText($row.find('td[data-column="title"]').text());
    if (!title) return;

    const pdfHref =
      $row.find('td[data-column="files"] a').first().attr("href") || "";
    const detailHref =
      $row.find('td.centered a, td a[href^="/pages/"]').last().attr("href") || "";

    const pdfUrl = resolveUrl(source.url, pdfHref);
    const detailUrl = resolveUrl(source.url, detailHref) || source.url;

    const dateRaw = cleanText(
      $row.find('td[data-column="publish_date"]').text()
    );
    const parsedDate = parseBdDate(dateRaw, "dmy");
    const publishedDate = parsedDate || new Date();
    const readableDate =
      (parsedDate ? formatReadableBdDate(parsedDate) : "") ||
      bnToEnDigits(dateRaw) ||
      "Recent";

    const sourceHash = createSourceHash(
      source.key,
      title,
      pdfUrl || detailUrl
    );
    const { recordType, category } = classifyRecord(
      title,
      source.defaultCategory
    );

    items.push({
      title,
      titleBn: title,
      slug: makeSafeSlug(title, source.organizationShort || source.key, sourceHash),
      sourceHash,
      recordType,
      origin: "web_sync",
      category,
      organization: source.organization,
      organizationShort: source.organizationShort,
      gradeRange: category === "BCS" ? "Grade 9 (Cadre)" : "As per Notice",
      payScale2026: "National Pay Scale 2026 (Check Official PDF)",
      vacancies: "See Official PDF",
      ageLimit: "21 - 32 years (Govt Rule; check circular PDF)",
      educationRequired: "See official PDF attachment for full eligibility",
      applicationFee: "As per circular",
      publishedDate,
      publishedDateRaw: readableDate,
      deadlineDate: null,
      deadlineRaw: "Check official attachment",
      applyUrl: detailUrl,
      pdfUrl,
      detailUrl,
      sourceId: source.key,
      sourceName: source.name,
      summary: `Live official update grabbed from ${source.organization} (${source.name}). Published: ${readableDate}. Open the attached official PDF or portal page for complete instructions.`,
      highlights: [
        `Official Source: ${source.organization}`,
        `Published Date: ${readableDate}`,
        pdfUrl ? "Direct Official PDF Attached" : "View on Official Portal",
      ],
      applicationSteps: [
        "Open and carefully read the attached official PDF notice.",
        "Verify post-wise eligibility, grade, age limit (up to 32 yrs), and fee.",
        "Follow the application link mentioned inside the official notice (e.g., Teletalk / portal).",
      ],
      relatedLessonSlugs:
        category === "BCS"
          ? ["b-bcs-cadres-blueprint", "g-teletalk-application-mastery"]
          : ["f-age-quota-2026-rules", "g-teletalk-application-mastery"],
      tags: [source.organizationShort, category, recordType, "Live Web Sync"],
      isFeatured: false,
      isActive: true,
    });
  });

  // Several NPF v2 portals (e.g. MOPA go-ultimates, BPSC Non-Cadre/BCS) leave
  // td[data-column="files"] blank in the index table and embed the real PDF on detailUrl.
  // Reuse already-stored PDFs and avoid re-scraping HTML-only detail pages on every sync.
  const missingTablePdfItems = items.filter((item) => !item.pdfUrl);
  if (missingTablePdfItems.length > 0) {
    const existingMap =
      typeof context.getExistingJobDocs === "function"
        ? await context.getExistingJobDocs(
            missingTablePdfItems.map((it) => it.sourceHash)
          )
        : new Map();

    const newItemsToFetch = [];
    for (const item of missingTablePdfItems) {
      const existing = existingMap.get(item.sourceHash);
      if (existing?.pdfUrl) {
        item.pdfUrl = existing.pdfUrl;
        item.highlights = [
          `Official Source: ${source.organization}`,
          `Published Date: ${item.publishedDateRaw}`,
          "Direct Official PDF Attached",
        ];
        continue;
      }
      // Only fetch detail pages for brand-new notices (skip already-checked HTML-only notices).
      if (!existing && item.detailUrl && item.detailUrl !== source.url) {
        newItemsToFetch.push(item);
      }
    }

    const maxDetailLookups =
      context.maxDetailPdfLookups ?? (process.env.VERCEL ? 6 : 15);
    const detailBudgetMs =
      context.detailBudgetMs ?? (process.env.VERCEL ? 4500 : 10000);
    const detailDeadlineMs = Date.now() + detailBudgetMs;
    const batch = newItemsToFetch.slice(0, maxDetailLookups);

    if (batch.length > 0) {
      await mapWithConcurrency(batch, 5, async (item) => {
        const remainingMs = detailDeadlineMs - Date.now();
        if (remainingMs <= 500) return;
        try {
          const detailHtml = await fetchPublicHtml(item.detailUrl, {
            timeoutMs: Math.min(3500, remainingMs),
          });
          const [firstPdf] = extractPdfLinksFromHtml(detailHtml, item.detailUrl);
          if (firstPdf?.url) {
            item.pdfUrl = firstPdf.url;
            item.highlights = [
              `Official Source: ${source.organization}`,
              `Published Date: ${item.publishedDateRaw}`,
              "Direct Official PDF Attached",
            ];
          }
        } catch {
          // Detail page is HTML-only or unreachable; keep portal link fallback.
        }
      });
    }
  }

  return items;
}
