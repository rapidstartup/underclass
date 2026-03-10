export const prompt = `
GAME OVER (showGameOver) — THE FINAL SCREEN:
After 10-12 chapters (or when risk reaches <=15 or >=85), END the game with showGameOver.
This is the final screen — make it impactful.
- outcome: "replaceProof" if risk < 20, "transitionInProgress" if 20-60, "highRisk" if > 60
- headline: one high-impact line about where they landed
- turningPoints: 3-4 concrete moments that shaped the outcome
- epitaph: a short, memorable closing line
- finalYear: The year the simulation ends
- DO NOT call any tools after showGameOver — it's the last tool call ever.
- Make the ending specific, coach-like, and screenshot-worthy.
`;
