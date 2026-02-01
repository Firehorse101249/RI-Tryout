import { useEffect } from "react";

export default function EvidenceGuard({ children }: { children: any }) {
  useEffect(() => {
    const block = (e: any) => {
      // Allow copy/paste inside inputs/textarea so they can write notes & answers elsewhere
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);

    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);

  return (
    <div style={{ userSelect: "none" as any }}>
      {children}
    </div>
  );
}
