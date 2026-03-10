import {
  getJobCategoryById,
  getRiskTierByIndex,
  getTopPathsForCategory,
  JOB_CATEGORIES,
  type AssessmentDimension,
  type JobCategory,
  type JobCategoryId,
  type PathRecommendation,
  type RiskTierBand,
} from "@/content/replaceproof/assessment";

type ConfidenceLevel = "high" | "medium" | "low";

interface ProfileWorkEntry {
  title?: string;
  company?: string;
  from?: string | null;
  to?: string | null;
}

interface NormalizedProfile {
  name: string;
  headline: string;
  summary: string;
  narrativeContext: string;
  workHistory: ProfileWorkEntry[];
}

export interface DimensionScore {
  id: AssessmentDimension["id"];
  label: string;
  score: number;
  note: string;
}

export interface InferredAssessmentPack {
  mode: "hybrid";
  roleCategory: {
    id: JobCategoryId;
    label: string;
    confidence: ConfidenceLevel;
    evidence: string[];
  };
  risk: {
    index: number;
    range: { min: number; max: number };
    tier: RiskTierBand;
    displacementTimeline: string;
  };
  dimensions: DimensionScore[];
  topPaths: PathRecommendation[];
  confidence: {
    overall: ConfidenceLevel;
    roleCategory: ConfidenceLevel;
    dataCompleteness: number;
  };
  constraints: string[];
}

const HUMAN_ADVANTAGE_KEYWORDS = [
  "strategy",
  "leadership",
  "stakeholder",
  "negotiation",
  "relationship",
  "mentoring",
  "client management",
  "decision-making",
  "conflict resolution",
  "consulting",
];

const ADAPTABILITY_KEYWORDS = [
  "ai",
  "automation",
  "product",
  "analytics",
  "data",
  "systems",
  "operations",
  "transformation",
  "innovation",
  "certification",
  "course",
  "learning",
];

const ROUTINE_WORK_KEYWORDS = [
  "data entry",
  "template",
  "process-driven",
  "repetitive",
  "manual",
  "transactional",
  "back office",
];

const URGENCY_SIGNAL_KEYWORDS = [
  "layoff",
  "automated",
  "automation",
  "agent",
  "cost reduction",
  "headcount",
  "outsourced",
  "efficiency",
  "ai pilot",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeProfile(profileData: unknown): NormalizedProfile {
  const parsed = typeof profileData === "string" ? safeJsonParse(profileData) : profileData;
  const raw = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const rawWorkHistory = Array.isArray(raw.workHistory) ? raw.workHistory : [];

  const workHistory: ProfileWorkEntry[] = rawWorkHistory
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        title: typeof entry.title === "string" ? entry.title : "",
        company: typeof entry.company === "string" ? entry.company : "",
        from: typeof entry.from === "string" ? entry.from : null,
        to: typeof entry.to === "string" ? entry.to : null,
      };
    });

  return {
    name: typeof raw.name === "string" ? raw.name : "",
    headline: typeof raw.headline === "string" ? raw.headline : "",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    narrativeContext: typeof raw.narrativeContext === "string" ? raw.narrativeContext : "",
    workHistory,
  };
}

function textContains(text: string, keyword: string): boolean {
  return text.includes(keyword.toLowerCase());
}

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => (textContains(text, keyword) ? count + 1 : count), 0);
}

function getCombinedText(profile: NormalizedProfile): string {
  const roleText = profile.workHistory
    .map((entry) => [entry.title || "", entry.company || ""].join(" "))
    .join(" ");

  return [profile.headline, profile.summary, profile.narrativeContext, roleText].join(" ").toLowerCase();
}

function inferRoleCategory(profile: NormalizedProfile, text: string): {
  category: JobCategory;
  confidence: ConfidenceLevel;
  evidence: string[];
} {
  const ranked = JOB_CATEGORIES.map((category) => {
    const hits = countKeywordHits(text, category.keywords);
    return { category, hits };
  }).sort((a, b) => b.hits - a.hits);

  const best = ranked[0];
  const second = ranked[1];

  const evidence: string[] = [];
  for (const keyword of best.category.keywords) {
    if (textContains(text, keyword)) {
      evidence.push(`matched keyword: ${keyword}`);
    }
    if (evidence.length >= 3) break;
  }

  const confidence: ConfidenceLevel =
    best.hits >= 3 && best.hits - second.hits >= 2
      ? "high"
      : best.hits >= 1
        ? "medium"
        : "low";

  const category = best.hits > 0 ? best.category : getJobCategoryById("other");
  if (evidence.length === 0 && profile.headline) {
    evidence.push(`fallback from headline: ${profile.headline}`);
  }

  return { category, confidence, evidence };
}

function getExperienceYears(workHistory: ProfileWorkEntry[]): number {
  const years: number[] = [];
  for (const entry of workHistory) {
    if (!entry.from) continue;
    const match = entry.from.match(/\b(19|20)\d{2}\b/);
    if (match) years.push(Number(match[0]));
  }

  if (years.length === 0) return workHistory.length > 0 ? Math.min(12, workHistory.length * 2) : 3;
  const earliest = Math.min(...years);
  const now = new Date().getFullYear();
  return Math.max(1, now - earliest);
}

function inferDimensionScores(profile: NormalizedProfile, text: string, category: JobCategory): DimensionScore[] {
  const experienceYears = getExperienceYears(profile.workHistory);
  const humanAdvantageHits = countKeywordHits(text, HUMAN_ADVANTAGE_KEYWORDS);
  const adaptabilityHits = countKeywordHits(text, ADAPTABILITY_KEYWORDS);
  const routineHits = countKeywordHits(text, ROUTINE_WORK_KEYWORDS);
  const urgencyHits = countKeywordHits(text, URGENCY_SIGNAL_KEYWORDS);

  const roleRisk = clamp(category.baseRiskIndex + routineHits * 4 - Math.min(10, humanAdvantageHits * 2), 20, 98);
  const transferability = clamp(68 - humanAdvantageHits * 7 - adaptabilityHits * 3 + routineHits * 5, 10, 95);
  const readiness = clamp(
    62 - Math.min(20, adaptabilityHits * 4) - Math.min(12, Math.floor(experienceYears / 3)) + routineHits * 3,
    12,
    95
  );
  const urgency = clamp(
    category.baseRiskIndex * 0.55 + urgencyHits * 8 + routineHits * 5 + (experienceYears < 3 ? 8 : 0),
    15,
    99
  );

  return [
    {
      id: "roleRisk",
      label: "Role Risk",
      score: roleRisk,
      note: "How exposed the current role mix is to automation and AI substitution.",
    },
    {
      id: "transferability",
      label: "Transferability",
      score: transferability,
      note: "How hard it is to port current skills into adjacent AI-resistant roles.",
    },
    {
      id: "readiness",
      label: "Readiness",
      score: readiness,
      note: "How prepared this profile appears for a 90-day transition sprint.",
    },
    {
      id: "urgency",
      label: "Urgency",
      score: urgency,
      note: "How quickly action is needed based on role and market pressure signals.",
    },
  ];
}

function inferOverallConfidence(
  profile: NormalizedProfile,
  roleCategoryConfidence: ConfidenceLevel,
  text: string
): { overall: ConfidenceLevel; dataCompleteness: number } {
  const hasHeadline = profile.headline.trim().length > 0 ? 1 : 0;
  const hasSummary = profile.summary.trim().length > 0 ? 1 : 0;
  const hasNarrative = profile.narrativeContext.trim().length > 0 ? 1 : 0;
  const hasWorkHistory = profile.workHistory.length > 0 ? 1 : 0;
  const textSignal = text.length > 200 ? 1 : 0;

  const dataCompleteness = Math.round(((hasHeadline + hasSummary + hasNarrative + hasWorkHistory + textSignal) / 5) * 100);

  const overall: ConfidenceLevel =
    roleCategoryConfidence === "high" && dataCompleteness >= 80
      ? "high"
      : dataCompleteness >= 50
        ? "medium"
        : "low";

  return { overall, dataCompleteness };
}

export function inferAssessmentPack(profileData: unknown): InferredAssessmentPack {
  const profile = normalizeProfile(profileData);
  const text = getCombinedText(profile);
  const { category, confidence: roleConfidence, evidence } = inferRoleCategory(profile, text);
  const dimensions = inferDimensionScores(profile, text, category);

  const roleRisk = dimensions.find((d) => d.id === "roleRisk")?.score ?? category.baseRiskIndex;
  const transferability = dimensions.find((d) => d.id === "transferability")?.score ?? 60;
  const readiness = dimensions.find((d) => d.id === "readiness")?.score ?? 60;
  const urgency = dimensions.find((d) => d.id === "urgency")?.score ?? 60;

  const riskIndex = clamp(roleRisk * 0.4 + transferability * 0.2 + readiness * 0.2 + urgency * 0.2);
  const tier = getRiskTierByIndex(riskIndex);
  const confidence = inferOverallConfidence(profile, roleConfidence, text);

  const uncertaintyBand = confidence.overall === "high" ? 5 : confidence.overall === "medium" ? 10 : 15;
  const range = {
    min: clamp(riskIndex - uncertaintyBand),
    max: clamp(riskIndex + uncertaintyBand),
  };

  return {
    mode: "hybrid",
    roleCategory: {
      id: category.id,
      label: category.label,
      confidence: roleConfidence,
      evidence,
    },
    risk: {
      index: riskIndex,
      range,
      tier,
      displacementTimeline: tier.displacementWindow,
    },
    dimensions,
    topPaths: getTopPathsForCategory(category.id).slice(0, 3),
    confidence: {
      overall: confidence.overall,
      roleCategory: roleConfidence,
      dataCompleteness: confidence.dataCompleteness,
    },
    constraints: [
      "Primary recommendations must remain inside mapped top 3 paths.",
      "Outside-path options are only allowed as bridge steps toward mapped paths.",
      "Every 2-3 chapters must include an assessment checkpoint tied to one dimension.",
      "Each checkpoint must include one concrete next-week action.",
    ],
  };
}

export function buildAssessmentPackPromptBlock(pack: InferredAssessmentPack): string {
  return [
    "INFERRED REPLACEPROOF ASSESSMENT PACK (HYBRID MODE)",
    "Use this as a grounding contract, not optional context.",
    JSON.stringify(pack, null, 2),
    "MANDATORY APPLICATION RULES:",
    "- Keep recommendations within the mapped topPaths unless explicitly presented as bridge moves.",
    "- Every 2-3 chapters include one showPULUpdate checkpoint using dimension + checkpointType + nextWeekAction.",
    "- Tie risk shifts to the profile evidence and the selected path logic.",
    "- Keep the cinematic style, but never break assessment grounding.",
  ].join("\n\n");
}

export function getArchetypeFixtures(): Array<{ name: string; profile: Record<string, unknown> }> {
  return [
    {
      name: "copywriter",
      profile: {
        name: "Example Copywriter",
        headline: "Senior Copywriter at Marketing Agency",
        summary: "Writes campaign copy and landing pages, strong editorial planning.",
        workHistory: [{ title: "Senior Copywriter", company: "Acme Creative", from: "2019", to: null }],
      },
    },
    {
      name: "customer_service",
      profile: {
        name: "Example Support Rep",
        headline: "Customer Support Specialist",
        summary: "Handles inbound tickets and chat escalation for SaaS clients.",
        workHistory: [{ title: "Customer Service Representative", company: "HelpDeskly", from: "2022", to: null }],
      },
    },
    {
      name: "graphic_design",
      profile: {
        name: "Example Designer",
        headline: "Graphic Designer and Visual Storyteller",
        summary: "Builds social assets and campaign graphics for e-commerce brands.",
        workHistory: [{ title: "Graphic Designer", company: "North Studio", from: "2020", to: null }],
      },
    },
    {
      name: "software_development",
      profile: {
        name: "Example Developer",
        headline: "Junior Full Stack Developer",
        summary: "Builds web features, handles bug fixes, and ships UI components.",
        workHistory: [{ title: "Junior Software Engineer", company: "Blue Orbit", from: "2023", to: null }],
      },
    },
  ];
}

