import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

type Slice = {
  ok: true;
  attemptNumber: number;
  bucketIndex: number;
  bucketCount: number;
  allow: {
    peopleIds: string[];
    locationIds: string[];
    evidenceIds: string[];
  };
};

export default function LocationPage() {
  const router = useRouter();
  const id = String(router.query.id || "");

  const [slice, setSlice] = useState<Slice | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loc = useMemo(() => {
    return CASE.locations.find((x) => x.id === id) || null;
  }, [id]);

  // Load slice (who is allowed to see what)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setMsg(null);
      const r = await fetch("/api/cadet/case-slice");
      const data = await r.json();
      if (!r.ok) return setMsg(data.error || "Failed to load access slice");
      setSlice(data);
    })();
  }, [id]);

  const allowed = useMemo(() => {
    if (!slice?.allow?.locationIds || !id) return false;
    return slice.allow.locationIds.includes(id);
  }, [slice, id]);

  // Log view ONLY if allowed (so blocked users don't leak "I tried to view X")
  useEffect(() => {
    if (!id) return;
    if (!slice) return;
    if (!allowed) return;

    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "location", id })
    }).catch(() => {});
  }, [id, slice, allowed]);

  // Still handle invalid ids nicely
  if (!loc) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Location Not Found</h1>
        <p>That location ID doesn’t exist.</p>
        <p>
          <Link href="/cadet/locations">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Loading state
  if (!slice && !msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>
          {loc.id}: {loc.name}
        </h1>
        <p>Loading access…</p>
        <p>
          <Link href="/cadet/locations">Back</Link> ·{" "}
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
          {loc.id}: {loc.name}
        </h1>
        <p style={{ color: "crimson" }}>{msg}</p>
        <p>
          <Link href="/cadet/locations">Back</Link> ·{" "}
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
          This location is not assigned to your slice. Use team notes + voice to
          coordinate.
        </p>

        <p style={{ color: "#666" }}>
          Your slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/locations">Back to Locations</Link> ·{" "}
          <Link href="/cadet/tryout">Back to Tryout</Link>
        </p>
      </main>
    );
  }

  // Allowed → show content
  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {loc.id}: {loc.name}
        </h1>

        <p style={{ color: "#666" }}>
          Access slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

        <h2>Details</h2>
        <p style={{ lineHeight: 1.6 }}>{loc.details}</p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/locations">Back</Link> ·{" "}
          <Link href="/cadet/case">Case</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    </EvidenceGuard>
  );
}
