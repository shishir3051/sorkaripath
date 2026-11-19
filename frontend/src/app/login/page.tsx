import { Suspense } from "react";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/api";
import { getServerSession } from "@/lib/serverAuth";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { LoginClient } from "@/components/auth/LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const sessionUser = await getServerSession();
  if (sessionUser) {
    redirect(sanitizeNextPath(sp.next, "/study"));
  }

  return (
    <AuthFormShell
      badge="Study Access Gate"
      title="Unlock Your BD Govt Job Study Workspace"
      subtitle="Sign in with your Gmail / email and password to unlock Study Hub lecture sheets, A–Z Academy modules, MCQ Practice Arena, and synced study progress."
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-slate-500">
            Loading sign-in form...
          </div>
        }
      >
        <LoginClient />
      </Suspense>
    </AuthFormShell>
  );
}
