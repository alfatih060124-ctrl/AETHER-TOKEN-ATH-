const TIER1_COUNTRIES = new Set([
  "BR", "NG", "IN", "ID", "VN", "PH", "UA", "TH", "ZA", "TR",
  "US", "JP", "KR", "MX", "CA",
]);

function calculateCryptoScore(formData = {}, countryCode = "") {
  let score = 0;
  const interests = Array.isArray(formData.interests) ? formData.interests : [];

  if (interests.includes("airdrop")) score += 25;
  if (interests.includes("trading")) score += 20;
  if (interests.includes("staking")) score += 20;
  if (interests.includes("mining")) score += 15;
  if (formData.hasWallet) score += 20;

  if (formData.experience === "advanced") score += 15;
  else if (formData.experience === "intermediate") score += 10;

  if (countryCode && TIER1_COUNTRIES.has(String(countryCode).toUpperCase())) {
    score += 10;
  }

  return Math.min(score, 100);
}

function isEligible(score, minScore = 60) {
  return Number(score) >= Number(minScore);
}

module.exports = { calculateCryptoScore, isEligible, TIER1_COUNTRIES };
