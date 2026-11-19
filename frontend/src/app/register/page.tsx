import { Suspense } from "react";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/api";
import { getServerSession } from "@/lib/serverAuth";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { RegisterClient } from "@/components/auth/RegisterClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
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
      badge="Create Learner Account"
      title="Join SorkariPath Academy"
      subtitle="Register with your Gmail / email and password, verify with a quick 6-digit code, and unlock all study resources, model tests, and personal notes."
    >
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-slate-500">
            Loading registration form...
          </div>
        }
      >
        <RegisterClient />
      </Suspense>
    </AuthFormShell>
  );
}
