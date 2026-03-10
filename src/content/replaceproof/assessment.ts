export type RiskTierId = "critical" | "high" | "moderate" | "low";

export type JobCategoryId =
  | "customer_service"
  | "copywriting"
  | "graphic_design"
  | "data_admin"
  | "software_development"
  | "translation"
  | "bookkeeping_accounting"
  | "recruiting_hr"
  | "sales_business_dev"
  | "management_strategy"
  | "other";

export interface RiskTierBand {
  id: RiskTierId;
  label: string;
  min: number;
  max: number;
  displacementWindow: string;
  recommendedAction: string;
}

export interface AssessmentDimension {
  id: "roleRisk" | "transferability" | "readiness" | "urgency";
  label: string;
  description: string;
  higherIsWorse: boolean;
}

export interface JobCategory {
  id: JobCategoryId;
  label: string;
  q1RiskPoints: number;
  baseRiskIndex: number;
  keywords: string[];
}

export interface PathRecommendation {
  roleTitle: string;
  skillMatch: number;
  transitionTime: string;
  salaryRange: string;
  keySkills: string[];
}

export const ASSESSMENT_SCORE_MAX = 75;

export const RISK_TIER_BANDS: RiskTierBand[] = [
  {
    id: "critical",
    label: "CRITICAL",
    min: 80,
    max: 100,
    displacementWindow: "0-12 months",
    recommendedAction: "Immediate transition strategy and high-accountability support",
  },
  {
    id: "high",
    label: "HIGH",
    min: 60,
    max: 79,
    displacementWindow: "6-18 months",
    recommendedAction: "Active transition plan with clear weekly execution",
  },
  {
    id: "moderate",
    label: "MODERATE",
    min: 40,
    max: 59,
    displacementWindow: "12-30 months",
    recommendedAction: "Proactive upskilling and positioning before pressure spikes",
  },
  {
    id: "low",
    label: "LOW",
    min: 0,
    max: 39,
    displacementWindow: "24+ months",
    recommendedAction: "Maintain edge with future-proofing and strategic optionality",
  },
];

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: "roleRisk",
    label: "Role Risk",
    description: "Exposure of current work mix to automation and AI substitution",
    higherIsWorse: true,
  },
  {
    id: "transferability",
    label: "Transferability",
    description: "How easily current skills port into AI-resistant adjacent roles",
    higherIsWorse: true,
  },
  {
    id: "readiness",
    label: "Readiness",
    description: "Current preparedness to execute a fast career pivot",
    higherIsWorse: true,
  },
  {
    id: "urgency",
    label: "Urgency",
    description: "How quickly action is required based on market and role signals",
    higherIsWorse: true,
  },
];

export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: "customer_service",
    label: "Customer Service / Call Center / Support",
    q1RiskPoints: 5,
    baseRiskIndex: 84,
    keywords: ["customer service", "support", "call center", "help desk", "csr", "chat support"],
  },
  {
    id: "copywriting",
    label: "Writing / Copywriting / Content Creation",
    q1RiskPoints: 5,
    baseRiskIndex: 82,
    keywords: ["copywriter", "content writer", "writer", "content", "seo writer", "editorial"],
  },
  {
    id: "graphic_design",
    label: "Graphic Design / Visual Design / Illustration",
    q1RiskPoints: 4,
    baseRiskIndex: 72,
    keywords: ["graphic designer", "visual designer", "illustrator", "brand designer", "creative designer"],
  },
  {
    id: "data_admin",
    label: "Data Entry / Administrative / Office Support",
    q1RiskPoints: 5,
    baseRiskIndex: 86,
    keywords: ["data entry", "administrative", "admin assistant", "office support", "operations assistant"],
  },
  {
    id: "software_development",
    label: "Software Development / Programming",
    q1RiskPoints: 3,
    baseRiskIndex: 62,
    keywords: ["software engineer", "developer", "programmer", "frontend", "backend", "full stack"],
  },
  {
    id: "translation",
    label: "Translation / Interpretation",
    q1RiskPoints: 4,
    baseRiskIndex: 74,
    keywords: ["translator", "translation", "interpreter", "localization"],
  },
  {
    id: "bookkeeping_accounting",
    label: "Accounting / Bookkeeping",
    q1RiskPoints: 4,
    baseRiskIndex: 68,
    keywords: ["bookkeeper", "bookkeeping", "accounting", "accounts payable", "accounts receivable"],
  },
  {
    id: "recruiting_hr",
    label: "Recruiting / HR Sourcing",
    q1RiskPoints: 3,
    baseRiskIndex: 56,
    keywords: ["recruiter", "talent", "hr", "sourcing", "people operations"],
  },
  {
    id: "sales_business_dev",
    label: "Sales / Business Development",
    q1RiskPoints: 2,
    baseRiskIndex: 44,
    keywords: ["sales", "account executive", "business development", "partnerships", "revenue"],
  },
  {
    id: "management_strategy",
    label: "Management / Leadership / Strategy",
    q1RiskPoints: 1,
    baseRiskIndex: 32,
    keywords: ["manager", "director", "vp", "head of", "strategy", "leadership", "chief"],
  },
  {
    id: "other",
    label: "Other",
    q1RiskPoints: 2,
    baseRiskIndex: 50,
    keywords: [],
  },
];

const FALLBACK_PATHS: PathRecommendation[] = [
  {
    roleTitle: "Operations Strategist",
    skillMatch: 68,
    transitionTime: "60-120 days",
    salaryRange: "$80K-$120K",
    keySkills: ["process design", "cross-functional execution", "AI workflow orchestration"],
  },
  {
    roleTitle: "Customer Success Manager",
    skillMatch: 66,
    transitionTime: "45-90 days",
    salaryRange: "$75K-$130K",
    keySkills: ["relationship management", "renewals", "outcome-based communication"],
  },
  {
    roleTitle: "AI Program Coordinator",
    skillMatch: 63,
    transitionTime: "60-120 days",
    salaryRange: "$70K-$115K",
    keySkills: ["project planning", "stakeholder alignment", "tool adoption enablement"],
  },
];

export const ROLE_PATH_MATRIX: Record<JobCategoryId, PathRecommendation[]> = {
  copywriting: [
    {
      roleTitle: "Content Strategist",
      skillMatch: 90,
      transitionTime: "45-90 days",
      salaryRange: "$95K-$130K",
      keySkills: ["content ops", "analytics", "editorial planning", "AI prompt management"],
    },
    {
      roleTitle: "Brand Messaging Lead",
      skillMatch: 82,
      transitionTime: "60-120 days",
      salaryRange: "$105K-$145K",
      keySkills: ["brand strategy", "positioning frameworks", "stakeholder management"],
    },
    {
      roleTitle: "AI Content Director",
      skillMatch: 75,
      transitionTime: "75-120 days",
      salaryRange: "$85K-$140K",
      keySkills: ["AI tool management", "quality control", "editorial governance"],
    },
  ],
  customer_service: [
    {
      roleTitle: "Customer Success Manager",
      skillMatch: 85,
      transitionTime: "38-90 days",
      salaryRange: "$80K-$130K",
      keySkills: ["account management", "retention strategy", "QBR execution", "upselling"],
    },
    {
      roleTitle: "Account Manager",
      skillMatch: 78,
      transitionTime: "45-90 days",
      salaryRange: "$75K-$125K",
      keySkills: ["revenue management", "relationship selling", "strategic planning"],
    },
    {
      roleTitle: "Operations Coordinator",
      skillMatch: 72,
      transitionTime: "60-120 days",
      salaryRange: "$65K-$105K",
      keySkills: ["process design", "workflow management", "cross-functional communication"],
    },
  ],
  graphic_design: [
    {
      roleTitle: "Art Director",
      skillMatch: 88,
      transitionTime: "60-120 days",
      salaryRange: "$95K-$145K",
      keySkills: ["creative leadership", "AI art direction", "team management"],
    },
    {
      roleTitle: "Brand Strategist",
      skillMatch: 75,
      transitionTime: "60-120 days",
      salaryRange: "$90K-$140K",
      keySkills: ["brand architecture", "market positioning", "competitive analysis"],
    },
    {
      roleTitle: "UX/Product Designer",
      skillMatch: 80,
      transitionTime: "60-120 days",
      salaryRange: "$95K-$150K",
      keySkills: ["user research", "prototyping", "design systems", "product thinking"],
    },
  ],
  software_development: [
    {
      roleTitle: "Product Manager",
      skillMatch: 70,
      transitionTime: "60-120 days",
      salaryRange: "$110K-$170K",
      keySkills: ["product strategy", "user stories", "stakeholder management", "roadmapping"],
    },
    {
      roleTitle: "Solutions Architect",
      skillMatch: 75,
      transitionTime: "60-120 days",
      salaryRange: "$120K-$190K",
      keySkills: ["system design", "client consulting", "technical pre-sales"],
    },
    {
      roleTitle: "Developer Relations",
      skillMatch: 72,
      transitionTime: "75-150 days",
      salaryRange: "$110K-$180K",
      keySkills: ["technical writing", "community building", "public speaking"],
    },
  ],
  data_admin: [
    {
      roleTitle: "Operations Manager",
      skillMatch: 68,
      transitionTime: "60-120 days",
      salaryRange: "$80K-$125K",
      keySkills: ["process optimization", "project management", "team coordination"],
    },
    {
      roleTitle: "Executive Assistant (Strategic)",
      skillMatch: 82,
      transitionTime: "45-90 days",
      salaryRange: "$75K-$120K",
      keySkills: ["executive communication", "board prep", "strategic planning support"],
    },
    {
      roleTitle: "Project Coordinator",
      skillMatch: 74,
      transitionTime: "45-90 days",
      salaryRange: "$70K-$110K",
      keySkills: ["agile fundamentals", "stakeholder communication", "timeline management"],
    },
  ],
  translation: [
    {
      roleTitle: "Localization Manager",
      skillMatch: 88,
      transitionTime: "45-90 days",
      salaryRange: "$85K-$130K",
      keySkills: ["cultural consulting", "vendor management", "quality assurance"],
    },
    {
      roleTitle: "International Business Development",
      skillMatch: 70,
      transitionTime: "60-120 days",
      salaryRange: "$90K-$150K",
      keySkills: ["cross-cultural negotiation", "market entry", "partnerships"],
    },
    {
      roleTitle: "Global Content Operations Lead",
      skillMatch: 72,
      transitionTime: "60-120 days",
      salaryRange: "$85K-$140K",
      keySkills: ["content governance", "workflow design", "stakeholder alignment"],
    },
  ],
  bookkeeping_accounting: [
    {
      roleTitle: "Financial Analyst",
      skillMatch: 72,
      transitionTime: "60-120 days",
      salaryRange: "$85K-$130K",
      keySkills: ["financial modeling", "forecasting", "data visualization"],
    },
    {
      roleTitle: "Business Intelligence Analyst",
      skillMatch: 65,
      transitionTime: "75-150 days",
      salaryRange: "$90K-$140K",
      keySkills: ["SQL", "dashboarding", "data storytelling", "BI tooling"],
    },
    {
      roleTitle: "Finance Operations Manager",
      skillMatch: 68,
      transitionTime: "60-120 days",
      salaryRange: "$95K-$150K",
      keySkills: ["process automation oversight", "controls", "cross-functional planning"],
    },
  ],
  recruiting_hr: [
    {
      roleTitle: "Talent Strategy Manager",
      skillMatch: 74,
      transitionTime: "60-120 days",
      salaryRange: "$95K-$145K",
      keySkills: ["workforce planning", "talent analytics", "stakeholder advising"],
    },
    {
      roleTitle: "People Operations Partner",
      skillMatch: 72,
      transitionTime: "60-120 days",
      salaryRange: "$90K-$140K",
      keySkills: ["employee lifecycle design", "manager enablement", "change management"],
    },
    {
      roleTitle: "Employer Brand Lead",
      skillMatch: 67,
      transitionTime: "75-150 days",
      salaryRange: "$85K-$130K",
      keySkills: ["narrative building", "content strategy", "community programs"],
    },
  ],
  sales_business_dev: [
    {
      roleTitle: "Strategic Account Director",
      skillMatch: 76,
      transitionTime: "45-90 days",
      salaryRange: "$120K-$220K",
      keySkills: ["complex deal strategy", "exec relationships", "commercial planning"],
    },
    {
      roleTitle: "Partnerships Manager",
      skillMatch: 74,
      transitionTime: "60-120 days",
      salaryRange: "$100K-$170K",
      keySkills: ["alliances", "joint go-to-market", "negotiation"],
    },
    {
      roleTitle: "Revenue Operations Lead",
      skillMatch: 69,
      transitionTime: "75-150 days",
      salaryRange: "$95K-$150K",
      keySkills: ["funnel analytics", "systems orchestration", "forecasting"],
    },
  ],
  management_strategy: [
    {
      roleTitle: "AI Transformation Lead",
      skillMatch: 82,
      transitionTime: "45-90 days",
      salaryRange: "$130K-$220K",
      keySkills: ["change leadership", "AI adoption strategy", "operating model redesign"],
    },
    {
      roleTitle: "Chief of Staff",
      skillMatch: 78,
      transitionTime: "45-90 days",
      salaryRange: "$120K-$200K",
      keySkills: ["strategic planning", "cross-functional execution", "executive communication"],
    },
    {
      roleTitle: "Business Strategy Director",
      skillMatch: 75,
      transitionTime: "60-120 days",
      salaryRange: "$130K-$210K",
      keySkills: ["scenario planning", "resource allocation", "portfolio strategy"],
    },
  ],
  other: FALLBACK_PATHS,
};

export function getRiskTierByIndex(score: number): RiskTierBand {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    RISK_TIER_BANDS.find((band) => clamped >= band.min && clamped <= band.max) ||
    RISK_TIER_BANDS[RISK_TIER_BANDS.length - 1]
  );
}

export function getJobCategoryById(id: JobCategoryId): JobCategory {
  return JOB_CATEGORIES.find((cat) => cat.id === id) || JOB_CATEGORIES[JOB_CATEGORIES.length - 1];
}

export function getTopPathsForCategory(id: JobCategoryId): PathRecommendation[] {
  return ROLE_PATH_MATRIX[id] || FALLBACK_PATHS;
}

export function normalizeAssessmentScoreToRiskIndex(totalScore: number): number {
  const clamped = Math.max(0, Math.min(ASSESSMENT_SCORE_MAX, totalScore));
  return Math.round((clamped / ASSESSMENT_SCORE_MAX) * 100);
}

