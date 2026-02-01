import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function EvidencePage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const e = CASE.evidence.find((x) => x.id === id);

  // Log evidence view (audit)
  useEffect(() => {
    if (!id) return;
    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "evidence", id })
    }).catch(() => {});
  }, [id]);

  if (!e) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        Not found. <Link href="/cadet/evidence">Back</Link>
      </main>
    );
  }

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {e.id}: {e.title}
        </h1>
        <p>
          <b>Type:</b> {e.type}
        </p>
        <p>
          <b>Summary:</b> {e.summary}
        </p>

        <h2>Details</h2>
        <p style={{ lineHeight: 1.6 }}>{e.details}</p>

        <p>
          <b>Tags:</b> {e.tags.join(", ")}
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/evidence">Back</Link> · <Link href="/cadet/case">Case</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    </EvidenceGuard>
  );
}
