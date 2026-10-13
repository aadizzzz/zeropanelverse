import { redirect } from "next/navigation";

export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string") next.set(key, val);
    else if (Array.isArray(val) && val[0]) next.set(key, val[0]);
  }
  const queryStr = next.toString();
  redirect(queryStr ? `/library?${queryStr}` : "/library");
}
