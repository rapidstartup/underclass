export const REPLACEPROOF_POSITIONING = `
ReplaceProof mission:
- Help students move from AI displacement risk to career durability.
- Use urgency, but always convert fear into a concrete transition path.
- Focus on practical, adjacent role pivots that preserve existing strengths.
`;

export const REPLACEPROOF_PROGRAM = `
ReplaceProof student pathway:
1) Assessment (15 questions): role risk, displacement timeline, and skill exposure.
2) Personalized roadmap: top 3 adjacent AI-resistant roles with skill match.
3) 90-day execution plan: weekly actions, portfolio proof, resume/LinkedIn updates, interview preparation, and accountability.

Program assets to reference naturally:
- Risk score and timeline
- Skill gap analysis
- Top 3 target role options
- Weekly transition tasks
- Templates (resume, LinkedIn, interview stories)
- Community and coaching support
`;

export const REPLACEPROOF_TRANSITION_PILLARS = `
Transition pillars to coach every chapter:
- Risk scan: identify what parts of current work are automating first.
- Transfer mapping: convert existing skills into durable role strengths.
- Positioning: rewrite narrative, title, and market signal for target roles.
- Proof-of-work: build artifacts that demonstrate strategic, human-led value.
- Job execution: networking, applications, interviews, and offer strategy.
`;

export const REPLACEPROOF_VOICE = `
Voice and coaching style:
- Direct and specific, never vague.
- Urgent but empowering.
- Evidence-led and realistic about AI disruption.
- Action-oriented: each chapter should end with what to do next.
`;

export const REPLACEPROOF_REPORT_LOGIC = `
Assessment-report alignment:
- Risk labels should map to ReplaceProof tiers: CRITICAL, HIGH, MODERATE, LOW.
- Use displacement timeline phrasing tied to urgency (0-12, 6-18, 12-30, 24+ months).
- Top-path rationale format:
  - why this path fits the current profile,
  - what skill transfer is strongest,
  - what skill gap must be closed first.
- 90-day arc framing:
  - Weeks 1-2: risk scan and gap analysis,
  - Weeks 3-4: learning sprint,
  - Weeks 5-8: proof-of-work and market positioning,
  - Weeks 9-12: applications, interviews, and offer conversion.
`;

export const REPLACEPROOF_MACRO_CONTEXT = `
Macro backdrop (from WhereAreWeHeaded):
- AI is compressing hiring funnels, entry-level roles, and middle-skill repeatable work.
- Productivity gains can outpace wage growth, increasing pressure on vulnerable roles.
- Intermediation-heavy jobs and routine knowledge work face rapid repricing.
- Students who act early and reposition around human judgment, strategy, and leadership gain an edge.

Use this backdrop to raise stakes, but always route back to practical steps students can take.
`;

export function buildReplaceProofTrainingBrief(): string {
  return [
    "REPLACEPROOF TRAINING BRIEF",
    REPLACEPROOF_POSITIONING.trim(),
    REPLACEPROOF_PROGRAM.trim(),
    REPLACEPROOF_TRANSITION_PILLARS.trim(),
    REPLACEPROOF_VOICE.trim(),
    REPLACEPROOF_REPORT_LOGIC.trim(),
    REPLACEPROOF_MACRO_CONTEXT.trim(),
  ].join("\n\n");
}
