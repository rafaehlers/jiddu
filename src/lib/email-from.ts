const DEFAULT_FROM_ADDRESS = "notifications@emails.jiddu.app";
const FROM_NAME = "Jiddu";

export function jidduFromEmail(configuredFrom?: string): string {
  const configured = configuredFrom?.trim();
  if (!configured) return `${FROM_NAME} <${DEFAULT_FROM_ADDRESS}>`;

  const address = configured.match(/<([^<>]+)>\s*$/)?.[1].trim() || configured;
  return `${FROM_NAME} <${address}>`;
}
