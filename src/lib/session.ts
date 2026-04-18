export function getOrCreateSession(slug: string): string {
  const key = `gf_session_${slug}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
