import * as cheerio from "cheerio";
import {
  cleanText,
  classifyRecord,
  createSourceHash,
  formatReadableBdDate,
  makeSafeSlug,
  parseBdDate,
  resolveUrl,
} from "../utils.js";

/**
 * Adapter for Bangladesh Bank & Bankers' Selection Committee career tables
 * (erecruitment.bb.org.bd/career/jobopportunity.php & jobopportunity_bscs.php)
 */
export function parseBbErecruitment(html, source, limit = 15) {
  const $ = cheerio.load(html);
  const items = [];

  $("table tr").each((_, row) => {
    if (items.length >= limit) return false;
    const $row = $(row);
    if ($row.find("th").length > 0) return;

    const jobId = cleanText($row.find('td[data-label="Job Id"]').text());
    const circularFor = cleanText(
      $row.find('td[data-label="Circular For"]').text()
    );
    const title = cleanText(
      $row.find('td[data-label="Circular Title"]').text()
    );
    if (!title) return;

    const pdfHref =
      $row.find("a.btn-download").first().attr("href") ||
      $row.find('a[href$=".pdf"]').first().attr("href") ||
      "";
    const pdfUrl = resolveUrl(source.url, pdfHref);

    const publishRaw = cleanText(
      $row.find('td[data-label="Publish Date"]').text()
    );
    const closeRaw = cleanText(
      $row.find('td[data-label="Close Date"]').text()
    );

    const parsedPublish = parseBdDate(publishRaw, "dmy");
    const publishedDate = parsedPublish || new Date();
    const deadlineDate = parseBdDate(closeRaw, "dmy");
    const readablePublish =
      (parsedPublish ? formatReadableBdDate(parsedPublish) : "") ||
      publishRaw ||
      "Recent";
    const readableClose =
      (deadlineDate ? formatReadableBdDate(deadlineDate) : "") ||
      closeRaw ||
      "Check PDF";

    const sourceHash = createSourceHash(
      source.key,
      `${jobId}-${title}`,
      pdfUrl || source.url
    );
    const { recordType, category } = classifyRecord(
      title,
      "Bank & Financial",
      circularFor
    );

    items.push({
      title,
      titleBn: "",
      slug: makeSafeSlug(
        `${jobId ? `job-${jobId}-` : ""}${title}`,
        source.organizationShort || "bb",
        sourceHash
      ),
      sourceHash,
      recordType,
      origin: "web_sync",
      category,
      organization: source.organization,
      organizationShort: source.organizationShort,
      gradeRange: /3rd Grade|Grade[- ]?3/i.test(title)
        ? "3rd Grade (Bank)"
        : /Senior Officer|9th Grade/i.test(title)
        ? "Grade 9 (Bank Officer)"
        : "Grade 9-10 (Bank)",
      payScale2026: "National Pay Scale 2026 (Bank / Financial Track)",
      vacancies: "See Official BB PDF",
      ageLimit: "21 - 32 years (Check specific Bank Circular PDF)",
      educationRequired: "Graduation / Masters as specified in BB Circular",
      applicationFee: "৳200 (via Rocket / BB e-Recruitment where applicable)",
      publishedDate,
      publishedDateRaw: readablePublish,
      deadlineDate,
      deadlineRaw: readableClose,
      applyUrl: "https://erecruitment.bb.org.bd/",
      pdfUrl,
      detailUrl: source.url,
      sourceId: source.key,
      sourceName: source.name,
      summary: `Live recruitment update from ${source.organization} (Job ID: ${jobId || "N/A"}, Type: ${circularFor || "Notice"}). Published: ${readablePublish}, Close Date: ${readableClose}.`,
      highlights: [
        `Job ID: ${jobId || "N/A"}`,
        `Circular Type: ${circularFor || "Recruitment Update"}`,
        `Published: ${readablePublish} | Close Date: ${readableClose}`,
      ],
      applicationSteps: [
        "Download the official PDF from Bangladesh Bank e-Recruitment.",
        "Log in or register a CV ID at erecruitment.bb.org.bd if applying.",
        "Check seat plan / admit card / viva instructions carefully before the close date.",
      ],
      relatedLessonSlugs: [
        "h-bangladesh-bank-erecruitment",
        "q-bank-combined-exam-strategy",
      ],
      tags: [
        source.organizationShort,
        "Bank & Financial",
        circularFor || recordType,
        "Live Web Sync",
      ],
      isFeatured: recordType === "circular",
      isActive: true,
    });
  });

  return items;
}
