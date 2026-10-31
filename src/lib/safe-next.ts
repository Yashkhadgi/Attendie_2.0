export function safeNext(next?: string | null): string {
  const n = next ?? "/";
  return n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/";
}
