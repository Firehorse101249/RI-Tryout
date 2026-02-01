import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function PersonPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const p = CASE.people.find((x) => x.id === id);

  useEffect(() => {
    if (!id) return;
    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "person", id })
    }).catch(() => {});
  }, [id]);

  if (!p) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        Not found. <Link href="/cadet/people">Back</Link>
      </main>
    );
  }

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
      <h1>
  {p.id}: {p.name}
</h1>

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
