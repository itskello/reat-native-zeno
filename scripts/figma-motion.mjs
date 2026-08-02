/**
 * Extracts prototype motion values from a Figma file.
 *
 * The Figma MCP server is paid; the REST API is not. This script reads the
 * prototype interactions (`transition` on each reaction) and prints the
 * duration, easing and spring values behind every screen-to-screen animation,
 * so ZENO's motion tokens can be matched to the design instead of guessed.
 *
 *   node scripts/figma-motion.mjs <fileKey> [nodeId]
 *
 * Requires FIGMA_TOKEN in .env — a free personal access token
 * (Figma → Settings → Security → Personal access tokens, "file content: read").
 *
 * IMPORTANT — the free Starter plan allows only a handful of file-content
 * requests PER MONTH. The raw response is therefore cached to
 * .figma-cache/<fileKey>.json and reused on every later run. Delete that file
 * only when the design has actually changed.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = join(ROOT, ".figma-cache");

function loadToken() {
  const fromEnv = process.env.FIGMA_TOKEN;
  if (fromEnv) return fromEnv;

  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, "utf8").match(/^FIGMA_TOKEN=(.+)$/m);
    if (match) return match[1].trim();
  }

  console.error(
    "Missing FIGMA_TOKEN.\n" +
      "Create a free personal access token at\n" +
      "  Figma → Settings → Security → Personal access tokens\n" +
      "with the 'file content: read' scope, then add it to .env:\n" +
      "  FIGMA_TOKEN=figd_...\n"
  );
  process.exit(1);
}

async function fetchFile(fileKey, token) {
  const cachePath = join(CACHE_DIR, `${fileKey}.json`);

  if (existsSync(cachePath)) {
    console.log(`Using cached ${cachePath} (delete it to re-fetch).\n`);
    return JSON.parse(readFileSync(cachePath, "utf8"));
  }

  console.log("Fetching from Figma — this consumes one of your monthly requests…\n");
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Figma API ${response.status}: ${body}`);
    if (response.status === 429) {
      console.error(
        "\nRate limited. The Starter plan allows very few file reads per month."
      );
    }
    process.exit(1);
  }

  const data = await response.json();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(data));
  console.log(`Cached to ${cachePath}\n`);
  return data;
}

/** Walks the document tree, collecting every node that declares interactions. */
function collectInteractions(node, path, out) {
  const here = node.name ? [...path, node.name] : path;

  for (const reaction of node.reactions ?? []) {
    const action = reaction.action ?? reaction.actions?.[0];
    const transition = action?.transition;
    if (!transition) continue;

    out.push({
      from: here.join(" › "),
      trigger: reaction.trigger?.type ?? "?",
      navigation: action?.navigation ?? "?",
      type: transition.type,
      direction: transition.direction,
      duration: transition.duration,
      easing: transition.easing,
    });
  }

  // Legacy fields — older files expose only these.
  if (node.transitionNodeID && !(node.reactions ?? []).length) {
    out.push({
      from: here.join(" › "),
      trigger: "legacy",
      navigation: "NAVIGATE",
      type: "(legacy transition)",
      duration: node.transitionDuration,
      easing: node.transitionEasing && { type: node.transitionEasing },
    });
  }

  for (const child of node.children ?? []) collectInteractions(child, here, out);
}

/** Figma expresses transition duration in seconds; motion.ts uses ms. */
function formatDuration(seconds) {
  if (typeof seconds !== "number") return "?";
  return `${Math.round(seconds * 1000)}ms`;
}

function formatEasing(easing) {
  if (!easing) return "?";
  if (easing.easingFunctionCubicBezier) {
    const { x1, y1, x2, y2 } = easing.easingFunctionCubicBezier;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }
  if (easing.easingFunctionSpring) {
    const s = easing.easingFunctionSpring;
    return `spring(mass ${s.mass}, stiffness ${s.stiffness}, damping ${s.damping})`;
  }
  return easing.type ?? "?";
}

const [fileKey, nodeId] = process.argv.slice(2);
if (!fileKey) {
  console.error("Usage: node scripts/figma-motion.mjs <fileKey> [nodeId]");
  console.error(
    "The fileKey is the segment after /design/ in the Figma URL."
  );
  process.exit(1);
}

const file = await fetchFile(fileKey, loadToken());
const interactions = [];
collectInteractions(file.document, [], interactions);

const wanted = nodeId
  ? interactions.filter((i) => i.from.includes(nodeId))
  : interactions;

if (!wanted.length) {
  console.log(
    "No prototype transitions found. The file may have no prototype wiring, " +
      "or the interactions live in a different page."
  );
  process.exit(0);
}

console.log(`Found ${wanted.length} prototype transition(s):\n`);
for (const i of wanted) {
  console.log(`  ${i.from}`);
  console.log(`    trigger    ${i.trigger} → ${i.navigation}`);
  console.log(
    `    animation  ${i.type}${i.direction ? ` (${i.direction})` : ""}`
  );
  console.log(`    duration   ${formatDuration(i.duration)}`);
  console.log(`    easing     ${formatEasing(i.easing)}\n`);
}
