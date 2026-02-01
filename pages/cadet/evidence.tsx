import Link from "next/link";
import { CASE } from "../../lib/caseData";

export default function EvidenceList() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Evidence Archive</h1>

      <ul>
        {CASE.evidence.map((e) => (
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
