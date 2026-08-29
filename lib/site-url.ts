export function nexoraSiteUrl(path = "") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const origin = configured || "https://www.nexorarank.tech";
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
