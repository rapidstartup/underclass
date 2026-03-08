export interface WorkHistoryEntry {
  title: string;
  company: string;
  location: string | null;
  from: string | null;
  to: string | null;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  from: string | null;
  to: string | null;
}

export interface PersonProfile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  narrativeContext: string;
  linkedinUrl: string;
  sources: string[];
}

export async function researchPerson(linkedinUrl: string): Promise<PersonProfile> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not set");

  const cleanUrl = linkedinUrl.replace(/\/$/, "");

  // Extract name from LinkedIn URL slug as initial guess
  const slug = cleanUrl.split("/in/")[1]?.replace(/\//g, "") || "";
  const nameFromUrl = slug
    .replace(/-/g, " ")
    .replace(/\d+/g, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  let resolvedName = nameFromUrl;
  let headline = "";
  let location = "";
  let workHistory: WorkHistoryEntry[] = [];
  let education: EducationEntry[] = [];
  const sources: string[] = [];

  // Step 1: People search — gets structured entity data (work history, education, etc.)
  try {
    const peopleRes = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: `${nameFromUrl} ${cleanUrl}`,
        category: "people",
        type: "auto",
        numResults: 3,
        contents: {
          text: { maxCharacters: 2000 },
        },
      }),
    });

    if (peopleRes.ok) {
      const data = await peopleRes.json();
      const results = data.results || [];

      // Find the matching person (prefer LinkedIn URL match, then name match)
      const match =
        results.find(
          (r: { url: string }) =>
            r.url?.includes("linkedin.com") &&
            (r.url?.includes(slug) || cleanUrl.includes(slug))
        ) || results[0];

      if (match) {
        // Extract from title
        if (match.title) {
          headline = match.title;
          const titleMatch = match.title.match(/^([^|]+)\|/);
          if (titleMatch) {
            const parts = titleMatch[1].split(/[-–]/);
            if (parts[0]) {
              const extracted = parts[0].trim();
              if (extracted.length > 1 && extracted.length < 50) {
                resolvedName = extracted;
              }
            }
          }
        }

        // Extract structured entity data
        const entity = match.entities?.[0];
        if (entity?.properties) {
          const props = entity.properties;
          if (props.name) resolvedName = props.name;
          if (props.location) location = props.location;

          if (props.workHistory) {
            workHistory = props.workHistory.map(
              (w: {
                title: string;
                company: { name: string };
                location: string | null;
                dates: { from: string | null; to: string | null };
              }) => ({
                title: w.title,
                company: w.company?.name || "Unknown",
                location: w.location,
                from: w.dates?.from,
                to: w.dates?.to,
              })
            );
          }

          if (props.educationHistory) {
            education = props.educationHistory.map(
              (e: {
                degree: string;
                institution: { name: string };
                dates: { from: string | null; to: string | null };
              }) => ({
                degree: e.degree,
                institution: e.institution?.name || "Unknown",
                from: e.dates?.from,
                to: e.dates?.to,
              })
            );
          }
        }

        if (match.url) sources.push(match.url);
      }
    }
  } catch (e) {
    console.error("Exa people search error:", e);
  }

  // Step 2: Content search — get narrative context from articles, podcasts, etc.
  let narrativeContext = "";
  try {
    const contentRes = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: `${resolvedName} career startup founder background`,
        type: "auto",
        numResults: 5,
        excludeDomains: ["linkedin.com"],
        contents: {
          text: { maxCharacters: 1500 },
          summary: true,
        },
      }),
    });

    if (contentRes.ok) {
      const data = await contentRes.json();
      for (const result of data.results || []) {
        if (result.summary) {
          narrativeContext += `${result.summary}\n\n`;
        } else if (result.text) {
          narrativeContext += `[${result.title || "Source"}]: ${result.text.slice(0, 500)}\n\n`;
        }
        if (result.url) sources.push(result.url);
      }
    }
  } catch (e) {
    console.error("Exa content search error:", e);
  }

  // Build summary from structured data
  const workSummary = workHistory
    .slice(0, 5)
    .map((w) => {
      const dates = [w.from?.slice(0, 4), w.to?.slice(0, 4) || "Present"]
        .filter(Boolean)
        .join("–");
      return `${w.title} at ${w.company} (${dates})`;
    })
    .join("; ");

  const eduSummary = education
    .map((e) => `${e.degree} from ${e.institution}`)
    .join("; ");

  const summary = [
    `${resolvedName}`,
    location ? `Based in ${location}` : "",
    workSummary ? `Career: ${workSummary}` : "",
    eduSummary ? `Education: ${eduSummary}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    name: resolvedName,
    headline: headline || `${resolvedName}`,
    location,
    summary,
    workHistory,
    education,
    narrativeContext: narrativeContext.slice(0, 4000) || summary,
    linkedinUrl: cleanUrl,
    sources: [...new Set(sources)],
  };
}
