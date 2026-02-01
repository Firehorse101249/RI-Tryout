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
        <p style={{ color: "#666" }}>{p.details.slice(0, 140)}…</p>

        <h2>Profile</h2>
        <p style={{ lineHeight: 1.6 }}>{p.details}</p>

        {p.connections?.length ? (
          <>
            <h2>Connections</h2>
            <ul>
              {p.connections.map((c: any) => (
                <li key={c.kind + ":" + c.id}>
                  {c.kind === "person" ? (
                    <>Person: <Link href={`/cadet/people/${c.id}`}>{c.id}</Link></>
                  ) : c.kind === "location" ? (
                    <>Location: <Link href={`/cadet/locations/${c.id}`}>{c.id}</Link></>
                  ) : (
                    <>Evidence: <Link href={`/cadet/evidence/${c.id}`}>{c.id}</Link></>
                  )}
                  {c.note ? ` — ${c.note}` : ""}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p style={{ marginTop: 16 }}>
          <Link href="/cadet/people">Back</Link> · <Link href="/cadet/case">Case</Link> ·{" "}
          <Link href="/cadet/tryout">Tryout</Link>
        </p>
      </main>
    </EvidenceGuard>
  );
}
