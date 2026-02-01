import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";


export default function EvidenceList() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Evidence Archive</h1>
      <ul>
        {CASE.evidence.map(e => (
          <li key={e.id}>
            <Link href={`/cadet/evidence/${e.id}`}>{e.id}</Link> — {e.title} ({e.type})
          </li>
        ))}
      </ul>
      <p><Link href="/cadet/case">Back to Case</Link></p>
    </main>
  );
}
