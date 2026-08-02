const demoScripts = [
  "./seed-demo.mjs",
  "./seed-factcheck-demo.mjs",
  "./seed-neutrality-demo.mjs",
  "./seed-explain-demo.mjs",
  "./seed-slop-demo.mjs",
  "./seed-review-demo.mjs",
];

for (const script of demoScripts) {
  await import(script);
}

console.log("\n✓ All curated demos are ready.");
