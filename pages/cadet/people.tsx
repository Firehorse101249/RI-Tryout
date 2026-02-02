import Link from "next/link";
import { useEffect, useState } from "react";

export default function PeopleList() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      const r = await fetch("/api/cadet/case-slice?kind=people");
      const data = await r.json();
      if (!r.ok) return setErr(data.error || "Failed to load people");
      setItems(data.items || []);
    })().catch((e) => setErr(String(e)));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>People</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul>
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/cadet/people/${p.id}`}>{p.id}</Link>
            {" — "}
            {p.name}
            {p.role ? ` (${p.role})` : ""}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/case">Back to Case</Link> ·{" "}
        <Link href="/cadet/tryout">Back to Tryout</Link>
      </p>
    </main>
  );
}
