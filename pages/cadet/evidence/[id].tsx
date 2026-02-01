import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

type Slice = {
    bucketIndex: number;
    bucketCount: number;
    items: { id: string }[];
  };
  

export default function EvidencePage() {
  const router = useRouter();
  const id = String(router.query.id || "");

  const [slice, setSlice] = useState<Slice | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const e = useMemo(() => {
    return CASE.evidence.find((x) => x.id === id) || null;
  }, [id]);

  // Load slice (who can see what)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setMsg(null);
      const r = await fetch("/api/cadet/case-slice?kind=evidence");
      const data = await r.json();
      if (!r.ok) return setMsg(data.error || "Failed to load access slice");
      setSlice(data);
    })();
  }, [id]);

  const allowed = useMemo(() => {
    if (!slice?.items?.length || !id) return false;
    return slice.items.some((x) => x.id === id);
  }, [slice, id]);
  

  // Log view ONLY if allowed
  useEffect(() => {
    if (!id) return;
    if (!slice) return;
    if (!allowed) return;

    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "evidence", id })
    }).catch(() => {});
  }, [id, slice, allowed]);

  if (!e) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Evidence Not Found</h1>
        <p>That evidence ID doesn’t exist.</p>
        <p>
          <Link href="/cadet/evidence">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Loading slice
  if (!slice && !msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>
          {e.id}: {e.title}
        </h1>
        <p>Loading access…</p>
        <p>
          <Link href="/cadet/evidence">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Slice load error
  if (msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>
          {e.id}: {e.title}
        </h1>
        <p style={{ color: "crimson" }}>{msg}</p>
        <p>
          <Link href="/cadet/evidence">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Not allowed
  if (!allowed) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
        <h1>Access Restricted</h1>
        <p>
          This evidence file is not assigned to your slice. Use team notes + voice
          to coordinate.
        </p>

        <p style={{ color: "#666" }}>
          Your slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/evidence">Back to Evidence</Link> ·{" "}
          <Link href="/cadet/tryout">Back to Tryout</Link>
        </p>
      </main>
    );
  }

  // Allowed → show evidence
  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {e.id}: {e.title}
        </h1>

        <p style={{ color: "#666" }}>
          Access slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

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
