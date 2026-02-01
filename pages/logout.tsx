import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/login"));
  }, [router]);
  return <main style={{ padding: 24, fontFamily: "system-ui" }}>Logging out…</main>;
}
