export type CanonicalOutcome = "replaceProof" | "transitionInProgress" | "highRisk";
export type LegacyOutcome = "elite" | "survived" | "underclass";
export type AnyOutcome = CanonicalOutcome | LegacyOutcome | string;

const LEGACY_OUTCOME_MAP: Record<LegacyOutcome, CanonicalOutcome> = {
  elite: "replaceProof",
  survived: "transitionInProgress",
  underclass: "highRisk",
};

export function normalizeOutcome(outcome: AnyOutcome): CanonicalOutcome {
  if (outcome === "replaceProof" || outcome === "transitionInProgress" || outcome === "highRisk") {
    return outcome;
  }

  if (outcome in LEGACY_OUTCOME_MAP) {
    return LEGACY_OUTCOME_MAP[outcome as LegacyOutcome];
  }

  return "highRisk";
}

