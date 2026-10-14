import { Fragment } from "react";

export function Highlight({ text, term }: { text: string; term: string }) {
  const q = term.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark key={k++}>{text.slice(idx, idx + needle.length)}</mark>);
    i = idx + needle.length;
  }
  return (
    <>
      {parts.map((p, idx) => (
        <Fragment key={idx}>{p}</Fragment>
      ))}
    </>
  );
}
