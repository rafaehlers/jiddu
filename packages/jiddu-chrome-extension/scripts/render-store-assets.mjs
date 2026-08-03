import { GlobalFonts, createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(extensionRoot, "store-listing", "assets");
const colors = {
  cream: "#fbf8f1",
  paper: "#fdfaf2",
  ink: "#1c1a17",
  muted: "#6b665d",
  rule: "#e5dfd1",
  red: "#dc5038",
  redSoft: "#f7ddd6",
  indigo: "#4338ca",
  indigoSoft: "#e9e7ff",
  dark: "#3b3b3b",
  white: "#ffffff",
};
const logo = await loadImage(path.join(extensionRoot, "icons", "icon128.png"));

registerFonts();
await mkdir(outputRoot, { recursive: true });

await renderSelectionScreenshot();
await renderResultScreenshot();
await renderOnboardingScreenshot();
await renderPromo();

console.log(`Chrome Web Store assets: ${outputRoot}`);

function registerFonts() {
  const candidates = [
    ["/System/Library/Fonts/Supplemental/Georgia.ttf", "Jiddu Serif"],
    ["/System/Library/Fonts/Supplemental/Arial.ttf", "Jiddu Sans"],
  ];
  for (const [fontPath, family] of candidates) {
    GlobalFonts.registerFromPath(fontPath, family);
  }
}

async function renderPromo() {
  const canvas = createCanvas(440, 280);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, 440, 280);

  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, 440, 44);
  drawLogo(ctx, 20, 10, 24);
  text(ctx, "Jiddu", 54, 29, 18, "sans", 700, colors.white);
  text(ctx, "Critical Reading", 111, 28, 12, "sans", 500, "#dedede");

  text(ctx, "READ WITH", 28, 94, 13, "sans", 700, colors.red, 2.2);
  text(ctx, "a critical mind.", 28, 138, 35, "serif", 700, colors.ink);
  wrapText(
    ctx,
    "Select a passage. Check fallacies, facts, and bias — without leaving the page.",
    28,
    170,
    296,
    19,
    13,
    "sans",
    500,
    colors.muted,
  );

  roundRect(ctx, 28, 226, 132, 34, 6, colors.indigo);
  text(ctx, "Add to Chrome", 48, 248, 13, "sans", 700, colors.white);

  roundRect(ctx, 325, 78, 88, 150, 12, colors.dark);
  ctx.fillStyle = colors.white;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, 337, 90, 64, 22, 5, colors.white);
  ctx.globalAlpha = 1;
  text(ctx, "FALLACY", 337, 139, 8, "sans", 700, "#f07c66", 1.2);
  text(ctx, "Appeal to", 337, 163, 13, "serif", 700, colors.white);
  text(ctx, "popularity", 337, 181, 13, "serif", 700, colors.white);
  ctx.strokeStyle = "#757575";
  ctx.beginPath();
  ctx.moveTo(337, 197);
  ctx.lineTo(401, 197);
  ctx.stroke();
  text(ctx, "Reasoning", 337, 214, 8, "sans", 500, "#d1cec6");

  await save(canvas, "promo-440x280.png");
}

async function renderSelectionScreenshot() {
  const { canvas, ctx } = browserCanvas("How consensus can replace evidence");
  drawArticle(ctx, 72, 155, 760, {
    kicker: "ARGUMENTS",
    title: "When certainty arrives before the evidence",
    dek: "A short guide to noticing the moment a conclusion begins doing the work of its own proof.",
  });

  const selection = { x: 106, y: 445, w: 690, h: 98 };
  roundRect(ctx, selection.x, selection.y, selection.w, selection.h, 7, "#fffdf8", colors.indigo, 3);
  ctx.fillStyle = colors.indigoSoft;
  ctx.fillRect(selection.x + 5, selection.y + 6, selection.w - 10, 42);
  text(
    ctx,
    "Everyone knows this policy failed, so only a reckless person could still defend it.",
    124,
    477,
    19,
    "serif",
    500,
    colors.ink,
  );
  text(
    ctx,
    "The claim sounds decisive, but its confidence arrives before its supporting evidence.",
    124,
    518,
    17,
    "serif",
    400,
    colors.muted,
  );

  roundRect(ctx, 586, 558, 322, 174, 11, colors.dark);
  drawLogo(ctx, 606, 576, 28);
  text(ctx, "Analyze selected passage", 646, 597, 15, "sans", 700, colors.white);
  drawLensRow(ctx, 606, 619, "Fallacies", "Inspect the reasoning", colors.red);
  drawLensRow(ctx, 606, 658, "Facts", "Check verifiable claims", "#df9b36");
  drawLensRow(ctx, 606, 697, "Bias", "Surface framing and omissions", "#7b70e8");

  roundRect(ctx, 902, 180, 282, 476, 15, colors.paper, colors.rule, 1);
  text(ctx, "1", 927, 216, 12, "sans", 700, colors.red);
  text(ctx, "Click Jiddu", 955, 216, 16, "sans", 700, colors.ink);
  text(ctx, "2", 927, 282, 12, "sans", 700, colors.red);
  text(ctx, "Select a passage", 955, 282, 16, "sans", 700, colors.ink);
  text(ctx, "3", 927, 348, 12, "sans", 700, colors.red);
  text(ctx, "Choose a lens", 955, 348, 16, "sans", 700, colors.ink);
  ctx.strokeStyle = colors.rule;
  ctx.beginPath();
  ctx.moveTo(933, 229);
  ctx.lineTo(933, 267);
  ctx.moveTo(933, 295);
  ctx.lineTo(933, 333);
  ctx.stroke();
  wrapText(
    ctx,
    "Nothing is sent while you hover or select. The passage is submitted only after you choose an analysis.",
    927,
    424,
    218,
    24,
    15,
    "sans",
    500,
    colors.muted,
  );
  roundRect(ctx, 927, 550, 202, 48, 7, colors.indigo);
  text(ctx, "Deliberate by design", 948, 580, 14, "sans", 700, colors.white);

  await save(canvas, "01-select-a-passage-1280x800.png");
}

async function renderResultScreenshot() {
  const { canvas, ctx } = browserCanvas("Opinion: The shortcut from certainty to contempt");
  drawArticle(ctx, 54, 148, 700, {
    kicker: "OPINION",
    title: "The shortcut from certainty to contempt",
    dek: "What disappears when disagreement is treated as proof of bad character?",
  });
  roundRect(ctx, 84, 444, 620, 103, 7, colors.redSoft, colors.red, 2);
  wrapText(
    ctx,
    "“Everyone knows this policy failed, so only a reckless person could still defend it.”",
    108,
    480,
    570,
    30,
    21,
    "serif",
    500,
    colors.ink,
  );
  text(ctx, "Selected passage", 108, 531, 11, "sans", 700, colors.red, 1.1);

  ctx.fillStyle = colors.dark;
  ctx.fillRect(782, 112, 498, 688);
  drawLogo(ctx, 812, 139, 42);
  text(ctx, "Jiddu", 868, 168, 25, "serif", 700, colors.white);
  text(ctx, "Critical Reading", 938, 166, 14, "sans", 500, "#cbc7bf");
  ctx.strokeStyle = "#595959";
  ctx.beginPath();
  ctx.moveTo(812, 194);
  ctx.lineTo(1248, 194);
  ctx.stroke();

  text(ctx, "FALLACY", 812, 238, 11, "sans", 700, "#f07c66", 1.8);
  text(ctx, "Appeal to popularity", 812, 282, 30, "serif", 700, colors.white);
  roundRect(ctx, 812, 308, 120, 29, 15, "#51423f");
  text(ctx, "Reasoning", 835, 327, 11, "sans", 700, "#f5b1a4");
  wrapText(
    ctx,
    "“Everyone knows” replaces evidence with an assumed consensus. The sentence then labels disagreement as reckless before examining the opposing case.",
    812,
    378,
    410,
    27,
    17,
    "sans",
    400,
    "#d8d3ca",
  );

  roundRect(ctx, 812, 500, 405, 98, 9, "#302f2c", "#5a5751", 1);
  text(ctx, "WHY IT MATTERS", 832, 528, 10, "sans", 700, "#f07c66", 1.4);
  wrapText(
    ctx,
    "Consensus can support a claim, but it cannot substitute for the missing evidence.",
    832,
    558,
    360,
    22,
    14,
    "sans",
    500,
    "#ded9d0",
  );

  roundRect(ctx, 812, 635, 172, 46, 7, colors.white);
  text(ctx, "Select another passage", 832, 663, 12, "sans", 700, colors.ink);
  roundRect(ctx, 995, 635, 138, 46, 7, "#55534f", "#77736c", 1);
  text(ctx, "Print report", 1022, 663, 12, "sans", 700, colors.white);

  await save(canvas, "02-read-the-analysis-1280x800.png");
}

async function renderOnboardingScreenshot() {
  const canvas = createCanvas(1280, 800);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, 1280, 78);
  drawLogo(ctx, 34, 21, 36);
  text(ctx, "Jiddu", 84, 51, 25, "serif", 700, colors.white);
  text(ctx, "Critical Reading", 152, 49, 15, "sans", 500, "#d7d4ce");

  text(ctx, "WELCOME TO JIDDU", 92, 143, 12, "sans", 700, colors.red, 2.1);
  text(ctx, "Connect your account.", 92, 194, 40, "serif", 700, colors.ink);
  wrapText(
    ctx,
    "One personal API key connects the extension to your analyses, credits, and history.",
    92,
    226,
    530,
    26,
    17,
    "sans",
    400,
    colors.muted,
  );

  const steps = [
    ["1", "Sign in to Jiddu", "Open your account in a secure Jiddu tab."],
    ["2", "Create an API key", "Generate a dedicated key you can revoke at any time."],
    ["3", "Paste it here", "Choose your interface and explanation languages."],
  ];
  steps.forEach(([number, title, body], index) => {
    const y = 318 + index * 116;
    roundRect(ctx, 92, y, 510, 92, 10, colors.paper, colors.rule, 1);
    roundRect(ctx, 112, y + 22, 44, 44, 22, index === 2 ? colors.indigo : colors.ink);
    text(ctx, number, 130, y + 49, 14, "sans", 700, colors.white, 0, "center");
    text(ctx, title, 178, y + 38, 17, "sans", 700, colors.ink);
    text(ctx, body, 178, y + 63, 13, "sans", 400, colors.muted);
  });

  roundRect(ctx, 678, 126, 510, 574, 15, colors.paper, colors.rule, 1);
  text(ctx, "Extension settings", 714, 174, 25, "serif", 700, colors.ink);
  text(ctx, "Jiddu API key", 714, 223, 12, "sans", 700, colors.ink);
  roundRect(ctx, 714, 237, 438, 49, 7, colors.white, colors.rule, 1);
  text(ctx, "jiddu_live_••••••••••••••••••••", 731, 267, 14, "mono", 500, colors.muted);

  text(ctx, "Interface language", 714, 329, 12, "sans", 700, colors.ink);
  text(ctx, "Explanation language", 938, 329, 12, "sans", 700, colors.ink);
  drawSelect(ctx, 714, 344, 202, "English");
  drawSelect(ctx, 938, 344, 214, "English");

  roundRect(ctx, 714, 421, 438, 151, 9, colors.cream, colors.rule, 1);
  text(ctx, "PRIVACY AT A GLANCE", 736, 452, 10, "sans", 700, colors.red, 1.5);
  drawCheckLine(ctx, 736, 482, "Nothing is sent while you hover or select.");
  drawCheckLine(ctx, 736, 516, "Only the submitted passage leaves Chrome.");
  drawCheckLine(ctx, 736, 550, "The API key stays in this Chrome installation.");

  roundRect(ctx, 714, 610, 438, 52, 7, colors.indigo);
  text(ctx, "Save and start reading", 933, 642, 15, "sans", 700, colors.white, 0, "center");

  await save(canvas, "03-connect-your-account-1280x800.png");
}

function browserCanvas(title) {
  const canvas = createCanvas(1280, 800);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, 1280, 112);
  ctx.fillStyle = "#505050";
  ctx.fillRect(0, 0, 1280, 45);
  ["#ee6a5e", "#f2bd4c", "#61c454"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(22 + index * 20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  roundRect(ctx, 172, 58, 868, 38, 19, "#f4f2ed");
  text(ctx, title, 206, 82, 13, "sans", 500, "#54514b");
  drawLogo(ctx, 1211, 61, 30);
  return { canvas, ctx };
}

function drawArticle(ctx, x, y, width, { kicker, title, dek }) {
  text(ctx, kicker, x, y, 11, "sans", 700, colors.red, 1.8);
  wrapText(ctx, title, x, y + 34, width, 50, 38, "serif", 700, colors.ink);
  wrapText(ctx, dek, x, y + 143, width - 40, 27, 17, "sans", 400, colors.muted);
  ctx.strokeStyle = colors.rule;
  ctx.beginPath();
  ctx.moveTo(x, y + 218);
  ctx.lineTo(x + width, y + 218);
  ctx.stroke();
  text(ctx, "By Mara Ellis · 8 min read", x, y + 247, 12, "sans", 600, colors.muted);
}

function drawLensRow(ctx, x, y, title, subtitle, accent) {
  roundRect(ctx, x, y, 280, 32, 6, "#4a4a48");
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 14, y + 16, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, title, x + 28, y + 14, 11, "sans", 700, colors.white);
  text(ctx, subtitle, x + 94, y + 14, 9, "sans", 400, "#d4d0c9");
}

function drawSelect(ctx, x, y, width, value) {
  roundRect(ctx, x, y, width, 48, 7, colors.white, colors.rule, 1);
  text(ctx, value, x + 16, y + 29, 14, "sans", 600, colors.ink);
  text(ctx, "⌄", x + width - 25, y + 27, 18, "sans", 600, colors.muted);
}

function drawCheckLine(ctx, x, y, value) {
  ctx.strokeStyle = colors.indigo;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 5, y + 3);
  ctx.lineTo(x + 13, y - 7);
  ctx.stroke();
  text(ctx, value, x + 24, y, 13, "sans", 500, colors.ink);
}

function drawLogo(ctx, x, y, size) {
  ctx.drawImage(logo, x, y, size, size);
}

function text(
  ctx,
  value,
  x,
  y,
  size,
  family = "sans",
  weight = 400,
  color = colors.ink,
  spacing = 0,
  align = "left",
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${fontFamily(family)}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if (!spacing) {
    ctx.fillText(value, x, y);
    return;
  }
  let cursor = x;
  for (const character of value) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + spacing;
  }
}

function wrapText(ctx, value, x, y, maxWidth, lineHeight, size, family, weight, color) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${fontFamily(family)}`;
  ctx.textAlign = "left";
  const words = value.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
  return lineY;
}

function fontFamily(name) {
  if (name === "serif") return '"Jiddu Serif", Georgia, serif';
  if (name === "mono") return 'Menlo, monospace';
  return '"Jiddu Sans", Arial, sans-serif';
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke, strokeWidth = 1) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

async function save(canvas, filename) {
  await writeFile(path.join(outputRoot, filename), await canvas.encode("png"));
}
