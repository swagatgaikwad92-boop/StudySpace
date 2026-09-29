/** Generate unique IDs */
export function uid(prefix = '') {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 9);
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`;
}

export function shortId() {
  return Math.random().toString(36).slice(2, 8);
}
