import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function LocationPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const loc = CASE.locations.find((x) => x.id === id);

  useEffect(() => {
    if (!id) return;
    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "location", id })
    }).catch(() => {});
  }, [id]);

  if (!loc) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        Not found. <Link href="/cadet/locations">Back</Link>
      </main>
    );
  }

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {loc.id}: {loc.name}
        </h1>

        <p style={{ color: "#666" }}>{loc.summary}</p>

        <h2>Details</h2>
        <p style={{ lineHeight: 1.6 }}>{loc.details}</p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/locations">Back</Link> · <Link href="/cadet/case">Case</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    </EvidenceGuard>
  );
}
