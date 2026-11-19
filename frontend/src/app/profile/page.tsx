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
    <div className="app-container py-5 sm:py-6 space-y-4 sm:space-y-5">
      <div className="space-y-1">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
          Learner Account
        </span>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          My Profile &amp; Study Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Manage your profile, target exam track, password security, saved circulars, and Gemini AI usage.
        </p>
      </div>

      <ProfileClient initialData={initialData} />
    </div>
  );
}
