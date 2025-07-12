export default function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD') // Normalize accented characters
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace whitespace with -
    .replace(/-+/g, '-') // Collapse multiple -
    .replace(/^-+|-+$/g, ''); // Trim - from start/end
}
