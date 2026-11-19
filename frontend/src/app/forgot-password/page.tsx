import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverAuth";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const sessionUser = await getServerSession();
  if (sessionUser) {
    redirect("/study");
  }

  return (
    <AuthFormShell
      badge="Account Recovery"
      title="Recover Your Study Account"
      subtitle="Verify your inbox with a 6-digit email code to set a new password and regain access to your saved study sheets and mock attempt history."
    >
      <ForgotPasswordClient />
    </AuthFormShell>
  );
}
