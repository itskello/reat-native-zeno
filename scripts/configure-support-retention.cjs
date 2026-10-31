const fs = require("node:fs");
const path = require("node:path");
const { StreamChat } = require("stream-chat");

function loadLocalStreamCredentials() {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?(EXPO_PUBLIC_STREAM_API_KEY|STREAM_API_SECRET)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;

      const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
      process.env[match[1]] = value;
    }
  }
}

async function main() {
  loadLocalStreamCredentials();
  const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY?.trim();
  const apiSecret = process.env.STREAM_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    throw new Error("EXPO_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET are required.");
  }

  const stream = StreamChat.getInstance(apiKey, apiSecret);
  const existing = await stream.getRetentionPolicy();
  const policies = existing.policies ?? [];
  console.log("Current Stream retention policies:", policies.map(({ policy, max_age_hours }) => ({ policy, max_age_hours })));

  const result = await stream.setRetentionPolicy("inactive-channels", 72);
  console.log("Configured inactive-channel retention for 72 hours.");
  console.log("Stream response:", JSON.stringify(result));
  console.log("Stream applies a 24-hour grace period; cleanup runs asynchronously.");
}

main().catch((error) => {
  console.error("Could not configure Stream retention:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
