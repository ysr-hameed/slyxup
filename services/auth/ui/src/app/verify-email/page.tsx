"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent } from "@slyxup/ui";
import { AuthLayout } from "@/components/auth-layout";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  if (status === "success") {
    return (
      <>
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Thank you for verifying your email address.
        </p>
        <Link href="/sign-in">
          <Button className="mt-2">Sign in</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <XCircle className="h-12 w-12 text-[var(--color-destructive)]" />
      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        The verification link may have expired or is invalid.
      </p>
      <Link href="/sign-in">
        <Button variant="outline" className="mt-2">
          Back to sign in
        </Button>
      </Link>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageInner />
    </Suspense>
  );
}

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

  return (
    <AuthLayout
      title={isSuccess ? "Email verified" : "Verification failed"}
      subtitle={
        isSuccess
          ? "Your email has been verified successfully"
          : "We couldn't verify your email"
      }
    >
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <VerifyEmailContent />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
