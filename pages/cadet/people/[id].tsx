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

export default function PersonPage() {
  const router = useRouter();
  const id = String(router.query.id || "");

  const [slice, setSlice] = useState<Slice | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const p = useMemo(() => {
    return CASE.people.find((x) => x.id === id) || null;
  }, [id]);

  // Load slice (who can see what)
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
    if (!slice?.allow?.peopleIds || !id) return false;
    return slice.allow.peopleIds.includes(id);
  }, [slice, id]);

  // Log view ONLY if allowed
  useEffect(() => {
    if (!id) return;
    if (!slice) return;
    if (!allowed) return;

    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "person", id })
    }).catch(() => {});
  }, [id, slice, allowed]);

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

  // Loading slice
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

  // Slice load error
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

  // Not allowed
  if (!allowed) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
        <h1>Access Restricted</h1>
        <p>
          This person profile is not assigned to your slice. Use team notes +
          voice to coordinate.
        </p>

        <p style={{ color: "#666" }}>
          Your slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/people">Back to People</Link> ·{" "}
          <Link href="/cadet/tryout">Back to Tryout</Link>
        </p>
      </main>
    );
  }

  // Allowed → show profile
  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>
          {p.id}: {p.name}
        </h1>

        <p style={{ color: "#666" }}>
          Access slice: <b>{slice!.bucketIndex + 1}</b> / <b>{slice!.bucketCount}</b>{" "}
          (attempt {slice!.attemptNumber})
        </p>

        <p>
          <b>Role:</b> {p.role}
        </p>

        {p.alias.length > 0 && (
          <p>
            <b>Aliases:</b> {p.alias.join(", ")}
          </p>
        )}

        <h2>Profile</h2>
        <p style={{ lineHeight: 1.6 }}>{p.bio}</p>

        {p.redFlags.length > 0 && (
          <>
            <h2>Red Flags</h2>
            <ul>
              {p.redFlags.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}

        {p.credibleInfo.length > 0 && (
          <>
            <h2>Credible Intelligence</h2>
            <ul>
              {p.credibleInfo.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}

        {p.knownConnections.length > 0 && (
          <>
            <h2>Known Connections</h2>
            <ul>
              {p.knownConnections.map((cid) => (
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
