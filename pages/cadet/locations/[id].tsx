import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

type SliceResp = {
  bucketIndex: number;
  bucketCount: number;
  items: { id: string }[]; // returned items are the allowed slice
};


export default function LocationPage() {
  const router = useRouter();
  const id = String(router.query.id || "");

  const [slice, setSlice] = useState<SliceResp | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loc = useMemo(() => {
    return CASE.locations.find((x) => x.id === id) || null;
  }, [id]);

  // Load slice (MUST include kind=locations)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setMsg(null);
      const r = await fetch("/api/cadet/case-slice?kind=locations");
      const data = await r.json();
      if (!r.ok) return setMsg(data.error || "Failed to load access slice");
      setSlice(data);
    })();
  }, [id]);

  // With your current server response, if we got a slice, we consider it allowed.
  // (Server already bucket-filters what the user can see.)
 const allowed = useMemo(() => {
  if (!slice || !id) return false;
  return slice.items?.some((x) => x.id === id) ?? false;
}, [slice, id]);


  // Log view once slice loads
  useEffect(() => {
  if (!id) return;
  if (!slice) return;
  if (!allowed) return;

  fetch("/api/cadet/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "locations", id })
  }).catch(() => {});
}, [id, slice, allowed]);


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

  // If you really want “Access Restricted”, you must change the API to return allow lists.
  // With current API, we don't have allow[] to check.

  if (!allowed) {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Access Restricted</h1>
      <p>This location is not assigned to your slice.</p>

      <p style={{ color: "#666" }}>
        Your slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>
      </p>

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/locations">Back to Locations</Link> ·{" "}
        <Link href="/cadet/tryout">Back to Tryout</Link>
      </p>
    </main>
  );
}


  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {loc.id}: {loc.name}
        </h1>

        <p style={{ color: "#666" }}>
          Access slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>
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
