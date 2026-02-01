import Link from "next/link";
import { useRouter } from "next/router";
import { CASE } from "../../../lib/caseData";
import EvidenceGuard from "../../../ui/EvidenceGuard";

export default function EvidencePage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const e = CASE.evidence.find(x => x.id === id);

  if (!e) return <main style={{ padding: 24, fontFamily: "system-ui" }}>Not found.</main>;

  return (
    <EvidenceGuard>
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1000 }}>
        <h1>{e.id}: {e.title}</h1>
        <p><b>Type:</b> {e.type}</p>
        <p><b>Summary:</b> {e.summary}</p>

        <h2>Details</h2>
        <p style={{ lineHeight: 1.6 }}>{e.details}</p>

        <p><b>Tags:</b> {e.tags.join(", ")}</p>

        <p><Link href="/cadet/evidence">Back</Link> · <Link href="/cadet/case">Case</Link></p>
      </main>
    </EvidenceGuard>
  );
  useEffect(() => {
    if (!id) return;
    fetch("/api/cadet/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "evidence", id })
    }).catch(() => {});
  }, [id]);
  
}
