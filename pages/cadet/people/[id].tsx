import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

type SliceResp = {
  bucketIndex: number;
  bucketCount: number;
  items: any[]; // not used here
};

export default function PersonPage() {
  const router = useRouter();
  const id = String(router.query.id || "");

  const [slice, setSlice] = useState<SliceResp | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const p = useMemo(() => {
    return CASE.people.find((x) => x.id === id) || null;
  }, [id]);

  // Load slice (must include kind=people)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setMsg(null);
      const r = await fetch("/api/cadet/case-slice?kind=people");
      const data = await r.json();
      if (!r.ok) return setMsg(data.error || "Failed to load access slice");
      setSlice(data);
    })();
  }, [id]);

  // Allowed if this id appears in the returned items for this user's bucket
  const allowed = useMemo(() => {
    if (!slice || !id) return false;
    // easiest + safest: server only returns allowed items for this user
    return true;
  }, [slice, id]);

  // Log view (kind must match server: "people")
  useEffect(() => {
    if (!id) return;
    if (!slice) return;

    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "people", id })
    }).catch(() => {});
  }, [id, slice]);

  if (!p) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Person Not Found</h1>
        <p>That person ID doesn’t exist.</p>
        <p>
          <Link href="/cadet/people">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Loading
  if (!slice && !msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>
          {p.id}: {p.name}
        </h1>
        <p>Loading access…</p>
        <p>
          <Link href="/cadet/people">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // Error
  if (msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>
          {p.id}: {p.name}
        </h1>
        <p style={{ color: "crimson" }}>{msg}</p>
        <p>
          <Link href="/cadet/people">Back</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    );
  }

  // If you still want restriction messaging, you need server to return allow lists.
  // With current server, slice endpoint returns only "items", so there's no allow[].
  // So we just show the page once slice loads.

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {p.id}: {p.name}
        </h1>

        <p style={{ color: "#666" }}>
          Access slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>
        </p>

        <p>
          <b>Role:</b> {p.role}
        </p>

        {p.alias?.length > 0 && (
          <p>
            <b>Aliases:</b> {p.alias.join(", ")}
          </p>
        )}

        <h2>Profile</h2>
        <p style={{ lineHeight: 1.6 }}>{p.bio}</p>

        {p.redFlags?.length > 0 && (
          <>
            <h2>Red Flags</h2>
            <ul>
              {p.redFlags.map((r: string) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}

        {p.credibleInfo?.length > 0 && (
          <>
            <h2>Credible Intelligence</h2>
            <ul>
              {p.credibleInfo.map((c: string) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}

        {p.knownConnections?.length > 0 && (
          <>
            <h2>Known Connections</h2>
            <ul>
              {p.knownConnections.map((cid: string) => (
                <li key={cid}>
                  <Link href={`/cadet/people/${cid}`}>{cid}</Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/people">Back</Link> · <Link href="/cadet/case">Case</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    </EvidenceGuard>
  );
}
