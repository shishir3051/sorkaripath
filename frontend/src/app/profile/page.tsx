import { requireServerUser, serverApiFetch } from "@/lib/serverAuth";
import {
  ProfileClient,
  type ProfileData,
} from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireServerUser("/profile");

  let initialData: ProfileData | null = null;
  try {
    initialData = await serverApiFetch<ProfileData>("/auth/profile");
  } catch {
    initialData = null;
  }

  return (
    <div className="app-container py-4 sm:py-5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Learner Account
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              My Profile &amp; Study Dashboard
            </h1>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
            Manage your profile, target exam track, password security, saved circulars, and Gemini AI usage.
          </p>
        </div>
      </div>

      <ProfileClient initialData={initialData} />
    </div>
  );
}
