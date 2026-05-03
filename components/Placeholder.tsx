/**
 * components/Placeholder.tsx
 * Wraps placeholder text in a yellow highlight so you can easily find
 * every piece of text that needs to be changed before going live.
 *
 * Usage:
 *   <h1>Welcome to <Placeholder>Your Company Name</Placeholder></h1>
 *
 * ✏️ EDIT: Replace the text inside <Placeholder>…</Placeholder> with your
 *          real content, then remove the <Placeholder> wrapper.
 */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-yellow-200 text-yellow-900 px-1 rounded text-sm font-mono border border-yellow-400">
      {/* ✏️ EDIT ↓ */}
      {children}
    </span>
  );
}
