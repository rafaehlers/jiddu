export const PRODUCTION_API_ORIGIN = "https://jiddu.app";

export function productionManifest(sourceManifest, version) {
  if (!sourceManifest || sourceManifest.manifest_version !== 3) {
    throw new TypeError("A valid Manifest V3 source is required.");
  }
  if (!/^\d+(?:\.\d+){0,3}$/.test(String(version || ""))) {
    throw new TypeError("A valid Chrome extension version is required.");
  }
  return {
    ...sourceManifest,
    version,
    host_permissions: [`${PRODUCTION_API_ORIGIN}/*`],
  };
}

export function productionSidepanelHtml(sourceHtml) {
  return String(sourceHtml).replace(
    /\s*<option\b[^>]*\bdata-development-only\b[^>]*>[\s\S]*?<\/option>/g,
    "",
  );
}

export function productionRuntimeConfig() {
  return `export const API_BASES = Object.freeze([\n  "${PRODUCTION_API_ORIGIN}",\n]);\n\nexport const DEFAULT_API_BASE = API_BASES[0];\n`;
}
