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

export interface CompanyInfo {
  name: string;
  description: string;
  coFounders: string;
  details: string;
}

export interface PersonProfile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  profileImageUrl: string;
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  companies: CompanyInfo[];
  narrativeContext: string;
  linkedinUrl: string;
  sources: string[];
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function extractLikelyPersonName(text: string): string {
  if (!text) return "";
  const cleaned = stripMarkdownLinks(text).replace(/https?:\/\/\S+/g, " ").trim();
  const firstLine = cleaned.split(/\n/)[0].trim();
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(firstLine)) return firstLine;

  const afterIsMatch = cleaned.match(/(?:\bis\b|\bname is\b|:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
  if (afterIsMatch?.[1]) return afterIsMatch[1].trim();

  const sentenceStart = cleaned.split(/[.!?]/)[0].trim();
  const candidates = sentenceStart.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g) || [];
  const stopWords = new Set(["The", "This", "That", "Who", "What", "Return", "Only", "Full", "Name", "On", "Twitter"]);
  for (const candidate of candidates) {
    const firstToken = candidate.split(/\s+/)[0];
    if (!stopWords.has(firstToken)) return candidate.trim();
  }
  return "";
}

function extractLikelyCompanyName(text: string): string {
  if (!text) return "";
  const cleaned = stripMarkdownLinks(text).replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();

  const rolePattern = /(?:co-?founder|founder|ceo|cto|coo|general partner|partner|president|chair(?:man)?|head)\b(?:[^.!?\n]{0,90}?)\b(?:at|of)\s+([A-Z][A-Za-z0-9&.' -]{2,80}?)(?:\s*(?:\(|,|\.|;|$))/i;
  const roleMatch = cleaned.match(rolePattern);
  if (roleMatch?.[1]) {
    const value = roleMatch[1].trim();
    if (/^a16z$/i.test(value)) return "Andreessen Horowitz";
    return value;
  }

  const knownCompanyMatch = cleaned.match(/\b(Andreessen Horowitz|a16z|OpenAI|Anthropic|Google|Meta|Microsoft|Tesla|Nvidia)\b/i);
  if (knownCompanyMatch?.[1]) {
    return /^a16z$/i.test(knownCompanyMatch[1]) ? "Andreessen Horowitz" : knownCompanyMatch[1];
  }

  return "";
}

function personNameLikelyMatches(expectedName: string, title: string, text: string): boolean {
  if (!expectedName) return true;
  const titleLower = title.toLowerCase();
  const headerText = text.split("\n").slice(0, 5).join(" ").toLowerCase();
  const tokens = expectedName
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  const titleMatches = tokens.every((t) => titleLower.includes(t));
  if (titleMatches) return true;

  // Fallback only to very early profile text (header), not full body where other names may appear.
  return tokens.every((t) => headerText.includes(t));
}

function companyLikelyMatches(expectedCompany: string, title: string, text: string): boolean {
  if (!expectedCompany) return true;
  const haystack = `${title} ${text}`.toLowerCase();
  const normalized = expectedCompany.toLowerCase();
  const variants = new Set<string>([normalized]);
  if (normalized.includes("andreessen horowitz")) variants.add("a16z");
  if (normalized === "a16z") variants.add("andreessen horowitz");
  return Array.from(variants).some((v) => haystack.includes(v));
}

async function verifyLinkedInCandidate(
  apiKey: string,
  linkedinUrl: string,
  expectedName: string,
  expectedCompany: string
): Promise<boolean> {
  const verification = await exaGetContents(apiKey, [linkedinUrl]);
  const verifiedTitle = verification[0]?.title || "";
  const verifiedText = verification[0]?.text || "";
  return personNameLikelyMatches(expectedName, verifiedTitle, verifiedText) &&
    companyLikelyMatches(expectedCompany, verifiedTitle, verifiedText);
}

interface XProfileSnapshot {
  name: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  profileImageUrl: string;
  sourceUrl: string;
}

async function fetchXProfileSnapshot(handle: string): Promise<XProfileSnapshot | null> {
  const cleanHandle = handle.replace(/^@/, "").trim();
  if (!cleanHandle) return null;

  try {
    const res = await fetch(`https://r.jina.ai/http://x.com/${cleanHandle}`);
    if (!res.ok) return null;
    const rawMarkdown = await res.text();
    const markdown = rawMarkdown.replace(/\\n/g, "\n");
    if (!markdown || !markdown.includes(`@${cleanHandle}`)) return null;

    const bioMatch = markdown.match(new RegExp(`@${cleanHandle}\\s*\\n\\n([^\\n]+)`, "i"));
    const bio = (bioMatch?.[1] || "").trim();

    const nameMatch = markdown.match(new RegExp(`\\n([^\\n@][^\\n]{1,80})\\n\\n@${cleanHandle}\\b`, "i"));
    const parsedName = (nameMatch?.[1] || "").trim();

    const afterHandle = markdown.split(new RegExp(`@${cleanHandle}\\s*\\n\\n`, "i"))[1] || "";
    const lines = afterHandle
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let location = "";
    let website = "";
    for (const line of lines.slice(1, 8)) {
      const websiteMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (websiteMatch?.[1]) {
        const label = websiteMatch[1].trim();
        if (/\./.test(label)) {
          website = label.startsWith("http") ? label : `https://${label}`;
        }
      }

      if (!websiteMatch && (line.startsWith("[") || /following|followers|joined|posts|replies|highlights|media/i.test(line))) {
        continue;
      }

      if (!location && !line.startsWith("[")) {
        location = line.replace(/\[[^\]]+\]\([^)]+\)/g, "").trim();
      }
    }

    const imageMatch = markdown.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^\s)]+/i);
    const profileImageUrl = (imageMatch?.[0] || "").trim();

    return {
      name: parsedName || cleanHandle,
      handle: cleanHandle,
      bio,
      location,
      website,
      profileImageUrl,
      sourceUrl: `https://x.com/${cleanHandle}`,
    };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExaResult = { url?: string; title?: string; text?: string; summary?: string; entities?: any[]; image?: string };

async function exaSearch(apiKey: string, body: Record<string, unknown>): Promise<ExaResult[]> {
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error("Exa search error:", e);
    return [];
  }
}

async function exaGetContents(apiKey: string, urls: string[]): Promise<ExaResult[]> {
  try {
    const res = await fetch("https://api.exa.ai/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ urls, text: { maxCharacters: 3000 } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error("Exa getContents error:", e);
    return [];
  }
}

async function exaAnswer(apiKey: string, query: string): Promise<string> {
  try {
    const res = await fetch("https://api.exa.ai/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ query, text: true, model: "exa" }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.answer || "";
  } catch (e) {
    console.error("Exa answer error:", e);
    return "";
  }
}

export interface PersonCandidate {
  name: string;
  headline: string;
  location: string;
  profileImageUrl: string;
  linkedinUrl: string;
}

export async function findCandidates(linkedinUrl: string): Promise<PersonCandidate[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const cleanUrl = linkedinUrl.replace(/\/$/, "");
  const slug = cleanUrl.split("/in/")[1]?.replace(/\//g, "") || "";
  const nameFromUrl = slug
    .replace(/-/g, " ")
    .replace(/\d+/g, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Two parallel searches: exact URL + people category
  const [urlResults, peopleResults] = await Promise.all([
    exaSearch(apiKey, {
      query: cleanUrl,
      type: "auto",
      numResults: 10,
      contents: { text: { maxCharacters: 500 } },
    }),
    exaSearch(apiKey, {
      query: `${nameFromUrl} linkedin`,
      category: "people",
      type: "auto",
      numResults: 10,
      contents: { text: { maxCharacters: 500 } },
    }),
  ]);

  const seen = new Set<string>();
  const candidates: PersonCandidate[] = [];

  const addCandidate = (r: ExaResult) => {
    const url = r.url || "";
    // Only include LinkedIn profile URLs, not posts
    if (!url.includes("linkedin.com/in/")) return;
    const rSlug = url.split("/in/")[1]?.replace(/[/?#].*/g, "").replace(/\//g, "") || "";
    if (!rSlug || seen.has(rSlug.toLowerCase()) || !r.title) return;
    seen.add(rSlug.toLowerCase());

    const entity = r.entities?.[0];
    const props = entity?.properties || {};

    candidates.push({
      name: props.name || r.title?.split(/[|–-]/)[0]?.trim() || "",
      headline: r.title || "",
      location: props.location || "",
      profileImageUrl: r.image || props.imageUrl || props.image || "",
      linkedinUrl: url,
    });
  };

  // Priority 1: Exact slug match from either search
  const allResults = [...urlResults, ...peopleResults];
  const exactMatch = allResults.find((r) => {
    const rSlug = (r.url || "").split("/in/")[1]?.replace(/[/?#].*/g, "").replace(/\//g, "") || "";
    return rSlug.toLowerCase() === slug.toLowerCase();
  });
  if (exactMatch) addCandidate(exactMatch);

  // Priority 2: Other URL search results (LinkedIn profiles only)
  for (const r of urlResults) addCandidate(r);

  // Priority 3: People search results
  for (const r of peopleResults) addCandidate(r);

  return candidates.slice(0, 100);
}

export async function researchPerson(linkedinUrl: string): Promise<PersonProfile> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not set");

  const cleanUrl = linkedinUrl.replace(/\/$/, "");
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
  let profileImageUrl = "";
  let workHistory: WorkHistoryEntry[] = [];
  let education: EducationEntry[] = [];
  const companies: CompanyInfo[] = [];
  const sources: string[] = [];

  // ── Step 0: Direct URL fetch via getContents — most accurate ──────────
  let directResults: ExaResult[] = [];
  try {
    directResults = await exaGetContents(apiKey, [cleanUrl]);
  } catch (e) {
    console.error("[exa] getContents failed:", e);
  }
  const directProfile = directResults[0];
  if (directProfile?.text) {
    // Parse the direct profile text for name, headline, etc.
    // Title format: "Sky Yang - Stealth AI Startup | LinkedIn" or "Sky Yang | LinkedIn"
    const titleMatch = directProfile.title?.match(/^([^|–-]+?)(?:\s*[-|–])/);
    if (titleMatch) {
      resolvedName = titleMatch[1].trim();
    } else if (directProfile.title) {
      resolvedName = directProfile.title.replace(/\s*\|.*$/, "").trim();
    }
    
    // Also try extracting name from the markdown heading (# Name)
    const h1Match = directProfile.text.match(/^#\s+(.+?)$/m);
    if (h1Match && h1Match[1].trim().length < 50) {
      resolvedName = h1Match[1].trim();
    }

    // Try to extract headline from title or first lines
    if (directProfile.title) headline = directProfile.title;

    // Extract structured info from text
    const aboutMatch = directProfile.text.match(/## About\s*([\s\S]*?)(?=##|$)/);
    const summary = aboutMatch ? aboutMatch[1].trim().slice(0, 500) : "";

    // Location from text (pattern: "City, State, Country")
    const locMatch = directProfile.text.match(/([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*(?:,\s*United States|,\s*US|,\s*UK|,\s*Canada)?\s*\((?:US|UK|CA|AU)\))/);
    if (locMatch) location = locMatch[1].replace(/\s*\([A-Z]+\)/, "");

    // Education from text
    const eduMatch = directProfile.text.match(/## Education\s*([\s\S]*?)(?=##|$)/);
    if (eduMatch) {
      const eduText = eduMatch[1];
      const eduEntries = eduText.match(/###\s+(.+?)(?:\n|$)/g);
      if (eduEntries) {
        education = eduEntries.map((e) => ({
          degree: e.replace(/^###\s+/, "").trim(),
          institution: e.replace(/^###\s+/, "").trim(),
          from: null,
          to: null,
        }));
      }
    }

    if (directProfile.image) profileImageUrl = directProfile.image;
    if (directProfile.url) sources.push(directProfile.url);

    // Store the full text as narrative context
    const directNarrative = directProfile.text.slice(0, 3000);

    // Still do the people search for structured entity data (work history etc.)
    const peopleResults = await exaSearch(apiKey, {
      query: `${resolvedName} ${cleanUrl}`,
      category: "people",
      type: "auto",
      numResults: 3,
      contents: { text: { maxCharacters: 2000 } },
    });

    // Find the matching entity for structured work history
    const exactEntity = peopleResults.find((r) => {
      const rSlug = (r.url || "").split("/in/")[1]?.replace(/[/?#].*/g, "").replace(/\//g, "") || "";
      return rSlug.toLowerCase() === slug.toLowerCase();
    });
    const entity = exactEntity?.entities?.[0] || peopleResults[0]?.entities?.[0];
    if (entity?.properties) {
      const props = entity.properties;
      if (props.name) resolvedName = props.name;
      if (props.location) location = props.location;
      if (props.imageUrl && !profileImageUrl) profileImageUrl = props.imageUrl;
      if (props.workHistory) {
        workHistory = props.workHistory.map(
          (w: { title: string; company: { name: string }; location: string | null; dates: { from: string | null; to: string | null } }) => ({
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
          (e: { degree: string; institution: { name: string }; dates: { from: string | null; to: string | null } }) => ({
            degree: e.degree,
            institution: e.institution?.name || "Unknown",
            from: e.dates?.from,
            to: e.dates?.to,
          })
        );
      }
    }

    // Merge narratives
    const finalNarrative = directNarrative + (summary ? `\n\nAbout: ${summary}` : "");

    return {
      name: resolvedName,
      headline: headline || resolvedName,
      location,
      summary: summary || directProfile.text.slice(0, 300),
      profileImageUrl,
      workHistory,
      education,
      companies,
      narrativeContext: finalNarrative,
      linkedinUrl: cleanUrl,
      sources: [...new Set(sources)],
    };
  }

  // ── Fallback Step 1: Search-based approach ──────────
  const urlResults = await exaSearch(apiKey, {
    query: cleanUrl,
    type: "auto",
    numResults: 3,
    contents: { text: { maxCharacters: 2000 } },
  });

  // ── Fallback Step 2: People search — structured entity data ──────────
  const peopleResults = await exaSearch(apiKey, {
    query: `${nameFromUrl} ${cleanUrl}`,
    category: "people",
    type: "auto",
    numResults: 10,
    contents: { text: { maxCharacters: 2000 } },
  });

  // Prefer exact URL match, then slug match, then first result
  const allResults = [...urlResults, ...peopleResults];
  const exactMatch = allResults.find((r) => r.url?.includes(`/in/${slug}`));
  const match = exactMatch ||
    allResults.find((r) => r.url?.includes("linkedin.com") && r.url?.includes(slug)) ||
    peopleResults[0];

  if (match) {
    if (match.title) {
      headline = match.title;
      const titleMatch = match.title.match(/^([^|]+)\|/);
      if (titleMatch) {
        const parts = titleMatch[1].split(/[-–]/);
        if (parts[0]) {
          const extracted = parts[0].trim();
          if (extracted.length > 1 && extracted.length < 50) resolvedName = extracted;
        }
      }
    }

    // Extract profile image
    if (match.image) {
      profileImageUrl = match.image;
    }

    const entity = match.entities?.[0];
    if (entity?.properties) {
      const props = entity.properties;
      if (props.name) resolvedName = props.name;
      if (props.location) location = props.location;
      if (props.imageUrl && !profileImageUrl) profileImageUrl = props.imageUrl;
      if (props.image && !profileImageUrl) profileImageUrl = props.image;

      if (props.workHistory) {
        workHistory = props.workHistory.map(
          (w: { title: string; company: { name: string }; location: string | null; dates: { from: string | null; to: string | null } }) => ({
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
          (e: { degree: string; institution: { name: string }; dates: { from: string | null; to: string | null } }) => ({
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

  // ── Step 2: Deep company research (parallel) ──────────────────
  const recentCompanies = workHistory
    .filter((w) => !w.to || new Date(w.to) > new Date("2020-01-01"))
    .map((w) => w.company)
    .filter((name) => name !== "Unknown")
    .slice(0, 3);

  const companySearches = recentCompanies.map(async (companyName) => {
    const info: CompanyInfo = { name: companyName, description: "", coFounders: "", details: "" };

    // Use Exa answer for precise questions — avoids regex garbage
    const [aboutAnswer, founderAnswer] = await Promise.all([
      exaAnswer(apiKey, `What is ${companyName} where ${resolvedName} works? What does the company do? One paragraph.`),
      exaAnswer(apiKey, `Who are the co-founders and key team members of ${companyName} (the company where ${resolvedName} works)? List their names and roles.`),
    ]);

    info.description = aboutAnswer.slice(0, 500);
    info.coFounders = founderAnswer.slice(0, 500);

    return info;
  });

  const companyInfos = await Promise.all(companySearches);
  companies.push(...companyInfos.filter((c) => c.description || c.coFounders));

  // ── Step 3: Narrative context — articles, podcasts, interviews ──
  let narrativeContext = "";
  const contentResults = await exaSearch(apiKey, {
    query: `${resolvedName} career startup founder background interview`,
    type: "auto",
    numResults: 5,
    excludeDomains: ["linkedin.com"],
    contents: { text: { maxCharacters: 1500 }, summary: true },
  });

  for (const result of contentResults) {
    if (result.summary) {
      narrativeContext += `${result.summary}\n\n`;
    } else if (result.text) {
      narrativeContext += `[${result.title || "Source"}]: ${result.text.slice(0, 500)}\n\n`;
    }
    if (result.url) sources.push(result.url);
  }

  // ── Step 4: Recent news enrichment ──────────────────────────
  const enrichResults = await exaSearch(apiKey, {
    query: `"${resolvedName}" ${recentCompanies[0] || ""} 2024 2025`,
    type: "auto",
    numResults: 3,
    excludeDomains: ["linkedin.com"],
    contents: { summary: true },
  });

  for (const r of enrichResults) {
    if (r.summary) narrativeContext += `[Recent]: ${r.summary}\n\n`;
    if (r.url) sources.push(r.url);
  }

  // ── Build final profile ──────────────────────────────────────
  const workSummary = workHistory
    .slice(0, 5)
    .map((w) => {
      const dates = [w.from?.slice(0, 4), w.to?.slice(0, 4) || "Present"].filter(Boolean).join("–");
      return `${w.title} at ${w.company} (${dates})`;
    })
    .join("; ");

  const eduSummary = education.map((e) => `${e.degree} from ${e.institution}`).join("; ");

  const companySummary = companies
    .map((c) => {
      const parts = [`${c.name}`];
      if (c.description) parts.push(c.description.slice(0, 200));
      if (c.coFounders) parts.push(`Team/Founders: ${c.coFounders.slice(0, 200)}`);
      return parts.join(" — ");
    })
    .join("\n");

  const summary = [
    `${resolvedName}`,
    location ? `Based in ${location}` : "",
    workSummary ? `Career: ${workSummary}` : "",
    eduSummary ? `Education: ${eduSummary}` : "",
    companySummary ? `\nIMPORTANT - Company & team details (use these exact names, do NOT invent team members):\n${companySummary}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    name: resolvedName,
    headline: headline || `${resolvedName}`,
    location,
    summary,
    profileImageUrl,
    workHistory,
    education,
    companies,
    narrativeContext: narrativeContext.slice(0, 6000) || summary,
    linkedinUrl: cleanUrl,
    sources: [...new Set(sources)],
  };
}

/**
 * Find a person by handle/username/name — searches Exa for the person,
 * finds their LinkedIn profile, then does full research.
 */
export async function findPersonByHandle(handle: string): Promise<PersonProfile> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not set");

  // For username-style handles, try as LinkedIn slug first (many people use same handle on X and LinkedIn)
  const looksLikeUsername = !handle.includes(" ") && !handle.includes("-") && handle.length > 3 && /^[a-zA-Z0-9_]+$/.test(handle);
  
  if (looksLikeUsername && !handle.includes("x.com") && !handle.includes("twitter.com")) {
    const linkedinUrl = `https://www.linkedin.com/in/${handle.replace(/^@/, "")}`;
    console.log(`[exa] Trying handle as LinkedIn slug: ${linkedinUrl}`);
    try {
      const directResults = await exaGetContents(apiKey, [linkedinUrl]);
      const first = directResults[0];
      const title = first?.title?.toLowerCase() || "";
      const looksLikeAuthPage = /log in|sign in|join linkedin/.test(title);
      const hasExpectedSlug = (first?.url || "").toLowerCase().includes(`/in/${handle.replace(/^@/, "").toLowerCase()}`);
      if (first?.text && first?.title && hasExpectedSlug && !looksLikeAuthPage) {
        console.log(`[exa] LinkedIn profile found: ${directResults[0].title}`);
        return researchPerson(linkedinUrl);
      }
    } catch {
      // Not a LinkedIn slug, continue to X handle search
    }
  }

  // Detect X/Twitter handle or URL → use Exa Answer to find their LinkedIn
  // Also treat single-word handles that look like usernames (no spaces/hyphens) as potential X handles
  // Includes: camelCase (FarzaTV), all lowercase (preshdkumar), etc.
  const xHandleMatch = handle.match(/(?:x\.com|twitter\.com)\/([^/?]+)/) || 
    (handle.startsWith("@") ? [null, handle.slice(1)] : null) ||
    (looksLikeUsername ? [null, handle] : null);
  
  if (xHandleMatch) {
    const xHandle = xHandleMatch[1];
    console.log(`[exa] Detected X handle: @${xHandle}, using Exa Answer to find LinkedIn`);

    const [answer, nameOnlyAnswer, companyOnlyAnswer, xSnapshot] = await Promise.all([
      exaAnswer(apiKey, `Who is @${xHandle} on X/Twitter? What is their full name, current role/company, and LinkedIn profile URL?`),
      exaAnswer(apiKey, `What is the full name of @${xHandle} on X/Twitter? Return only the person name.`),
      exaAnswer(apiKey, `What company is @${xHandle} on X/Twitter best known for? Return only company/organization name.`),
      fetchXProfileSnapshot(xHandle),
    ]);

    const explicitName = extractLikelyPersonName(nameOnlyAnswer);
    const fallbackName = extractLikelyPersonName(answer);
    const personName = xSnapshot?.name || explicitName || fallbackName || xHandle;
    const companyName =
      extractLikelyCompanyName(companyOnlyAnswer) ||
      extractLikelyCompanyName(answer);
    const canTrustLinkedIn = Boolean(companyName);

    console.log(`[exa] Exa Answer identified: ${personName} (${companyName})`);

    // Extract LinkedIn URL from the answer
    const linkedinMatch = answer.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
    
    if (linkedinMatch && canTrustLinkedIn) {
      const linkedinUrl = `https://www.linkedin.com/in/${linkedinMatch[1]}`;

      // VERIFY the LinkedIn profile matches person/company — Exa Answer can hallucinate URLs.
      if (await verifyLinkedInCandidate(apiKey, linkedinUrl, personName, companyName)) {
        console.log(`[exa] LinkedIn verified: ${linkedinUrl}`);
        return researchPerson(linkedinUrl);
      } else {
        console.log(`[exa] LinkedIn mismatch for @${xHandle}, searching by inferred name/company instead`);
      }
    }
    
    // If Exa Answer didn't give us a name, try finding their profile on aggregator sites
    if (!personName) {
      console.log(`[exa] Exa Answer didn't identify anyone, trying web search for @${xHandle}`);
      const webResults = await exaSearch(apiKey, {
        query: `"${xHandle}" twitter profile`,
        type: "auto",
        numResults: 5,
        contents: { text: { maxCharacters: 500 } },
      });
      
      // Look for real name patterns in results (e.g. "Farza Majeed" from medium/@farzatv)
      for (const r of webResults) {
        const text = `${r.title || ""} ${r.text || ""}`;
        // Try to find LinkedIn URL in any result
        const liMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
        if (liMatch) {
          const liUrl = `https://www.linkedin.com/in/${liMatch[1]}`;
          console.log(`[exa] Found LinkedIn in web results: ${liUrl}`);
          return researchPerson(liUrl);
        }
      }
    }
    
    // LinkedIn URL missing or wrong — search by name + company
    if (personName && canTrustLinkedIn) {
      const searchQuery = companyName ? `${personName} ${companyName}` : personName;
      console.log(`[exa] Searching LinkedIn by name: ${searchQuery}`);
      
      // Search for LinkedIn profile with name + company for accuracy
      const nameResults = await exaSearch(apiKey, {
        query: `${searchQuery} site:linkedin.com/in/`,
        type: "auto",
        numResults: 5,
        contents: { text: { maxCharacters: 500 } },
      });
      
      for (const result of nameResults) {
        if (!result.url?.includes("linkedin.com/in/")) continue;
        if (await verifyLinkedInCandidate(apiKey, result.url, personName, companyName)) {
          console.log(`[exa] Found verified LinkedIn via name search: ${result.url}`);
          return researchPerson(result.url);
        }
      }
      
      // Try people category
      const peopleResults = await exaSearch(apiKey, {
        query: searchQuery,
        category: "people",
        type: "auto",
        numResults: 3,
        contents: { text: { maxCharacters: 2000 } },
      });
      
      for (const result of peopleResults) {
        if (!result.url?.includes("linkedin.com/in/")) continue;
        if (await verifyLinkedInCandidate(apiKey, result.url, personName, companyName)) {
          console.log(`[exa] Found verified LinkedIn via people search: ${result.url}`);
          return researchPerson(result.url);
        }
      }
    }

    // If we can't confidently map to LinkedIn, return an identity-safe X-enriched profile
    // rather than accidentally returning a different person with a similar name.
    const profileName = personName || xSnapshot?.name || xHandle;
    const profileLocation = xSnapshot?.location || "";
    const profileWebsite = xSnapshot?.website || "";
    const profileBio = xSnapshot?.bio || "";
    const profileSummaryParts = [
      profileBio,
      companyName ? `Known for: ${companyName}` : "",
      profileWebsite ? `Website: ${profileWebsite}` : "",
      !profileBio ? answer.slice(0, 320) : "",
    ].filter(Boolean);
    const profileSummary = profileSummaryParts.join(" ");

    return {
      name: profileName,
      headline: companyName
        ? `${profileName} | ${companyName}`
        : (profileBio ? `${profileName} | X profile` : `${profileName}`),
      location: profileLocation,
      summary: profileSummary.slice(0, 500),
      profileImageUrl: xSnapshot?.profileImageUrl || "",
      workHistory: [],
      education: [],
      companies: [],
      narrativeContext: [
        `X profile: @${xHandle}`,
        profileBio ? `Bio: ${profileBio}` : "",
        companyName ? `Known for: ${companyName}` : "",
        profileWebsite ? `Website: ${profileWebsite}` : "",
        !profileBio && answer ? `Exa context: ${answer}` : "",
      ].filter(Boolean).join("\n"),
      linkedinUrl: "",
      sources: [...new Set([xSnapshot?.sourceUrl, profileWebsite].filter(Boolean) as string[])],
    };
  }

  // Clean up the handle — could be "shaiunterslak", "shai-unterslak", "Shai Unterslak"
  const searchName = handle
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

  // Search for this person on LinkedIn via Exa
  const results = await exaSearch(apiKey, {
    query: `${searchName} site:linkedin.com/in/`,
    type: "auto",
    numResults: 5,
    contents: { text: { maxCharacters: 500 } },
  });

  // Find the best LinkedIn match
  const linkedinResult = results.find((r) => r.url?.includes("linkedin.com/in/"));

  if (linkedinResult?.url) {
    // Found their LinkedIn — do full research
    return researchPerson(linkedinResult.url);
  }

  // No LinkedIn found — try a broader people search
  const peopleResults = await exaSearch(apiKey, {
    query: searchName,
    category: "people",
    type: "auto",
    numResults: 3,
    contents: { text: { maxCharacters: 2000 } },
  });

  if (peopleResults.length > 0) {
    const best = peopleResults.find((r) => r.url?.includes("linkedin.com")) || peopleResults[0];
    if (best?.url?.includes("linkedin.com")) {
      return researchPerson(best.url);
    }

    // Build a basic profile from what we found
    return {
      name: best?.title?.split("|")[0]?.trim() || searchName,
      headline: best?.title || searchName,
      location: "",
      summary: best?.text?.slice(0, 500) || "",
      profileImageUrl: best?.image || "",
      workHistory: [],
      education: [],
      companies: [],
      narrativeContext: best?.text || "",
      linkedinUrl: best?.url || "",
      sources: peopleResults.filter((r) => r.url).map((r) => r.url!),
    };
  }

  // Last resort — return minimal profile with just the name
  return {
    name: searchName,
    headline: searchName,
    location: "",
    summary: "",
    profileImageUrl: "",
    workHistory: [],
    education: [],
    companies: [],
    narrativeContext: "",
    linkedinUrl: "",
    sources: [],
  };
}
