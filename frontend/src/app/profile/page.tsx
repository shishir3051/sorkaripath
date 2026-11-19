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
    <div className="app-container py-8 space-y-6">
      <div>
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Learner Account &amp; Progress
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          My Profile &amp; Study Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Manage your account profile, target exam track, password security,
          saved circulars, mock attempts, and personal Gemini AI token usage.
        </p>
      </div>

      <ProfileClient initialData={initialData} />
    </div>
  );
}
