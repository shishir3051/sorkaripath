import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { safeExternalHref } from "@/lib/api";
import { PwaInstallButton } from "@/components/layout/PwaInstallControl";

const OFFICIAL_PORTALS = [
  { name: "BPSC Official", url: "https://bpsc.gov.bd/" },
  { name: "BPSC Teletalk", url: "https://bpsc.teletalk.com.bd/" },
  { name: "BB e-Recruitment", url: "https://erecruitment.bb.org.bd/" },
  { name: "AllJobs Teletalk", url: "https://alljobs.teletalk.com.bd/" },
  { name: "MOPA Notices", url: "https://mopa.gov.bd/site/view/notices" },
  { name: "DPE Primary", url: "https://dpe.gov.bd/" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-base font-bold text-white">
              SorkariPath — BD Govt Job Portal
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              An A-to-Z Bangladesh government career learning academy and live
              official notice aggregator.
            </p>
            <p className="mt-3 text-xs text-emerald-400">
              Updated with 2026 Pay Scale, 32-Year Age Limit &amp; 93/7 Quota Rules.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Platform Modules
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-emerald-400 transition-colors">
                  Live Circulars &amp; Official Notices
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-emerald-400 transition-colors">
                  A-to-Z Learning Roadmap (26 Modules)
                </Link>
              </li>
              <li>
                <Link href="/practice" className="hover:text-emerald-400 transition-colors">
                  MCQ Practice &amp; Negative-Mark Simulator
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-emerald-400 transition-colors">
                  Age Calculator &amp; 2026 Pay Scale Estimator
                </Link>
              </li>
              <li>
                <Link href="/live-sync" className="hover:text-emerald-400 transition-colors">
                  Live Web Sync Console &amp; Admin Publisher
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Verified Official Portals
            </h4>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {OFFICIAL_PORTALS.map((portal) => (
                <li key={portal.url}>
                  <a
                    href={safeExternalHref(portal.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <span>{portal.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Educational &amp; Career Aggregator — always verify final deadlines and
            fees in the attached official PDF circular.
          </p>
          <PwaInstallButton variant="footer" />
        </div>
      </div>
    </footer>
  );
}
