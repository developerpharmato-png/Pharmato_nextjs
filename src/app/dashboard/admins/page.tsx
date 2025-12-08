"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminsPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect away from admins page since admin list is removed from UI
    router.replace("/dashboard");
  }, [router]);
  return null;
}
