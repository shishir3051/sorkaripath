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
export async function parseNpfTable(html, source, limit = 15) {
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
  const itemsNeedingDetailPdf = items.filter(
    (item) => !item.pdfUrl && item.detailUrl && item.detailUrl !== source.url
  );
  if (itemsNeedingDetailPdf.length > 0) {
    await mapWithConcurrency(itemsNeedingDetailPdf, 5, async (item) => {
      try {
        const detailHtml = await fetchPublicHtml(item.detailUrl, {
          timeoutMs: 4500,
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

  return items;
}
