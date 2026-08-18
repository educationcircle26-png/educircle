export type ModerationResult = {
  flagged: boolean;
  categories: string[];
};

// Pre-screens text with OpenAI's Moderation API before it's stored.
// Runs server-side only (Server Actions), never in the browser.
export async function checkContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // No key configured yet — don't block publishing over a missing
  // optional feature; just skip the check.
  if (!apiKey) {
    return { flagged: false, categories: [] };
  }

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
  });

  if (!response.ok) {
    // Fail open — a moderation-service outage shouldn't take the whole
    // posting flow down with it.
    return { flagged: false, categories: [] };
  }

  const data = await response.json();
  const result = data.results?.[0];

  if (!result?.flagged) {
    return { flagged: false, categories: [] };
  }

  const categories = Object.entries(result.categories ?? {})
    .filter(([, value]) => value)
    .map(([key]) => key);

  return { flagged: true, categories };
}
