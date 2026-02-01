import Link from "next/link";
import { useRouter } from "next/router";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function LocationPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const loc = CASE.locations.find(l => l.id === id);

  if (!loc) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Not found.</main>;

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>{loc.name}</h1>
        <p><b>Type:</b> {loc.type}</p>
        <p>{loc.details}</p>

        <h2>Relevance</h2>
        <ul>{loc.relevance.map(x => <li key={x}>{x}</li>)}</ul>

        <p><Link href="/cadet/locations">Back</Link> · <Link href="/cadet/case">Case</Link></p>
      </main>
    </EvidenceGuard>
  );
}
