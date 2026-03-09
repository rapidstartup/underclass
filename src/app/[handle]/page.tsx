import { redirect } from "next/navigation";

// Catch-all for usernames: underclass.sh/shaiunterslak
// Works like X.com — any handle at root level starts a simulation
// The research API will search Exa for this person (not assume LinkedIn)
export default async function HandleRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  // Skip known routes and static files
  const reserved = ["simulate", "in", "s", "api", "_next", "favicon.ico", "favicon.svg", "sounds", "og-image.png", "hero-bg.jpg", "robots.txt", "sitemap.xml"];
  if (reserved.includes(handle) || handle.startsWith("_") || handle.includes(".")) {
    redirect("/");
  }

  // Pass as handle search — the research API will find their LinkedIn
  redirect(`/simulate?handle=${encodeURIComponent(handle)}`);
}
