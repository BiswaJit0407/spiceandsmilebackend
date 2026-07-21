const axios = require("axios");

async function validateRecipeContent({ title, ingredients, method }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY missing — skipping AI validation");
    return { isValid: true, reason: "AI validation skipped (no key)" };
  }
  const ingText = Array.isArray(ingredients)
    ? ingredients.map((i) => `${i.quantity || ""} ${i.unit || ""} ${i.item || ""}`).join(", ")
    : String(ingredients || "");
  const methodText = Array.isArray(method)
    ? method.map((s) => `${s.step}. ${s.instruction}`).join(" ")
    : String(method || "");

  try {
    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `You are a food recipe validator. Check if this is a REAL cooking recipe.
Title: "${title}"
Ingredients: "${ingText.slice(0, 300)}"
Method: "${methodText.slice(0, 300)}"

Respond ONLY with JSON: {"is_valid": true|false, "reason": "brief reason if rejected"}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );
    const text = res.data.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return { isValid: !!parsed.is_valid, reason: parsed.reason || "" };
  } catch (err) {
    console.error("AI validation failed", err.message);
    // Fail-open: don't block user if the AI service is down; admin still reviews.
    return { isValid: true, reason: "AI validation unavailable" };
  }
}

module.exports = validateRecipeContent;
