export interface RuntimeConfig {
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  apiBaseUrl: string;
}

// Using `satisfies` ensures REQUIRED_KEYS stays in sync with RuntimeConfig at compile time.
const REQUIRED_KEYS = Object.keys({
  keycloakUrl: true,
  keycloakRealm: true,
  keycloakClientId: true,
  apiBaseUrl: true,
} satisfies Record<keyof RuntimeConfig, true>) as (keyof RuntimeConfig)[];

export function isRuntimeConfig(config: unknown): config is RuntimeConfig {
  if (typeof config !== 'object' || config === null) return false;
  return REQUIRED_KEYS.every((key) => {
    const value = (config as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() !== '';
  });
}

function validateRuntimeConfig(config: unknown): RuntimeConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Invalid app runtime config: expected an object');
  }

  const missing = REQUIRED_KEYS.filter((key) => {
    const value = (config as Record<string, unknown>)[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Invalid app runtime config: missing or empty fields: ${missing.join(', ')}`);
  }

  return config as RuntimeConfig;
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const candidateUrls = ['app-config.json', '/app-config.json'];

  for (const candidateUrl of candidateUrls) {
    let response: Response;
    try {
      response = await fetch(candidateUrl);
    } catch {
      // Network error (e.g. offline, CORS), try the next candidate URL.
      continue;
    }

    if (!response.ok) continue;

    // The file was found — a parse or validation failure is a hard error.
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new Error(`Failed to parse app runtime config from "${candidateUrl}": invalid JSON`);
    }

    return validateRuntimeConfig(raw);
  }

  throw new Error(
    `Failed to load app runtime config: file not found at any of: ${candidateUrls.join(', ')}`
  );
}
