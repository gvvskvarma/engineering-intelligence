"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AuthErrorToast() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("error")) return;

    const params = new URLSearchParams(hash.slice(1));
    const code = params.get("error_code");
    const description = params.get("error_description");
    if (description) {
      toast.error(description.replace(/\+/g, " "), {
        description: code ?? undefined,
        duration: 8000,
      });
    }
    history.replaceState(null, "", window.location.pathname + window.location.search);
    router.refresh();
  }, [router]);

  return null;
}
