import Link from "next/link";
import { useEffect, useState } from "react";

export default function EvidenceList() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      const r = await fetch("/api/cadet/case-slice?kind=locations");
      const data = await r.json();
      if (!r.ok) return setErr(data.error || "Failed to load evidence");
      setItems(data.items || []);
    })().catch((e) => setErr(String(e)));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Evidence Archive</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul>
        {items.map((e) => (
          <li key={e.id}>
            <Link href={`/cadet/evidence/${e.id}`}>{e.id}</Link> — {e.title} ({e.type})
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16 }}>
        <Link href="/cadet/case">Back to Case</Link> · <Link href="/cadet/tryout">Back to Tryout</Link>
      </p>
    </main>
  );
}
