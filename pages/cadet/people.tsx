import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CASE } from "../../lib/caseData";

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

export default function PeopleList() {
  const [slice, setSlice] = useState<Slice | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const r = await fetch("/api/cadet/case-slice");
      const data = await r.json();
      if (!r.ok) return setMsg(data.error || "Failed to load access slice");
      setSlice(data);
    })();
  }, []);

  const allowedPeople = useMemo(() => {
    const allow = slice?.allow?.peopleIds || [];
    const allowSet = new Set(allow);
    return CASE.people.filter((p) => allowSet.has(p.id));
  }, [slice]);

  if (msg) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>People Profiles</h1>
        <p style={{ color: "crimson" }}>{msg}</p>
        <p><Link href="/cadet/tryout">Back to Tryout</Link></p>
      </main>
    );
  }

  if (!slice) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>People Profiles</h1>
        <p>Loading…</p>
        <p><Link href="/cadet/tryout">Back to Tryout</Link></p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>People Profiles</h1>

      <p style={{ color: "#666" }}>
        Access slice: <b>{slice.bucketIndex + 1}</b> / <b>{slice.bucketCount}</b> (attempt {slice.attemptNumber})
      </p>

      {allowedPeople.length === 0 ? (
        <p>No profiles assigned to you in this slice. Coordinate via team notes.</p>
      ) : (
        <ul>
          {allowedPeople.map((p) => (
            <li key={p.id}>
              <Link href={`/cadet/people/${p.id}`}>{p.name}</Link> — {p.role}
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/case">Back to Case</Link> · <Link href="/cadet/tryout">Back to Tryout</Link>
      </p>
    </main>
  );
}
