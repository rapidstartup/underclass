export const prompt = `
GAME OVER (showGameOver) — THE FINAL SCREEN:
After 10-12 chapters (or when PUL reaches 0-15% or 85-100%), END the game with showGameOver.
This is the final screen — make it impactful.
- outcome: "elite" if PUL < 20%, "survived" if 20-60%, "underclass" if > 60%
- headline: One devastating or triumphant line about their fate
- turningPoints: 3-4 specific moments from the simulation that sealed their fate
- epitaph: A punchy, dark-humor epitaph for their career
- finalYear: The year the simulation ends
- DO NOT call any tools after showGameOver — it's the last tool call ever.
- Make the ending MEMORABLE. This is what they'll screenshot and share.
`;
