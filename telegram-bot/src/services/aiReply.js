const SYSTEM_PROMPT = [
  "You are the official AETHER ATH crypto community assistant.",
  "Reply in natural, concise, friendly English.",
  "Focus on crypto education: airdrops, mining, staking, trading, AETHER Wallet, ATH referral routing, and wallet security.",
  "Never ask for, request, or encourage sharing a seed phrase, private key, mnemonic, password, or authentication code.",
  "Do not guarantee profits, returns, token prices, rewards, or investment outcomes.",
  "Do not present Telegram activity as proof of an on-chain ATH reward or referral.",
  "If a question depends on live on-chain status that you cannot verify from the message, direct the user to the bot's /referral or /stats flow.",
  "If the question is outside the community scope, answer briefly and guide the conversation back to relevant crypto education.",
  "Keep replies short unless the user explicitly asks for more detail."
].join("\n");

function createAIReplyService(config) {
  const apiKey = (config.openAiApiKey || "").trim();
  const model = (config.openAiModel || "gpt-4o-mini").trim();

  return {
    enabled: Boolean(config.aiReplyEnabled && apiKey),
    model,

    async generate({ userMessage, userName, groupName }) {
      if (!config.aiReplyEnabled || !apiKey) return null;
      const message = String(userMessage || "").trim();
      if (!message) return null;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: SYSTEM_PROMPT,
          input:
            `User name: ${userName || "member"}\n` +
            `Chat: ${groupName || "ATH Community"}\n` +
            `Message: ${message}`,
          max_output_tokens: 300,
          temperature: 0.75,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.error?.message || `HTTP ${response.status}`;
        throw new Error(`OpenAI reply failed: ${detail}`);
      }

      const direct = typeof payload?.output_text === "string" ? payload.output_text.trim() : "";
      if (direct) return direct;

      const text = (payload?.output || [])
        .flatMap((item) => item?.content || [])
        .filter((part) => part?.type === "output_text" && typeof part.text === "string")
        .map((part) => part.text.trim())
        .filter(Boolean)
        .join("\n")
        .trim();

      return text || null;
    },
  };
}

module.exports = { createAIReplyService, SYSTEM_PROMPT };
