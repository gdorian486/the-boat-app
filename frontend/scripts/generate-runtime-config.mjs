import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const repoRoot = resolve(frontendRoot, '..');
const envFile = join(repoRoot, '.env');
const envExampleFile = join(repoRoot, '.env.example');
const outputFile = join(frontendRoot, 'public', 'app-config.json');

const env = {
  ...parseEnvFile(envExampleFile),
  ...parseEnvFile(envFile)
};

const keycloakPort = env.KEYCLOAK_PORT ?? '8081';
const backendPort = env.BACKEND_PORT ?? '8080';

const runtimeConfig = {
  keycloakUrl: env.KEYCLOAK_URL ?? `http://localhost:${keycloakPort}`,
  keycloakRealm: env.KEYCLOAK_REALM ?? 'boat',
  keycloakClientId: env.KEYCLOAK_CLIENT_ID ?? 'boat-frontend',
  apiBaseUrl: env.API_BASE_URL ?? `http://localhost:${backendPort}`
};

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(runtimeConfig, null, 2)}\n`, 'utf8');

function parseEnvFile(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
      .split(/\r?\n/u)
      .reduce((accumulator, line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return accumulator;
        }

        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex < 0) {
          return accumulator;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim();
        accumulator[key] = value;
        return accumulator;
      }, {});
  } catch {
    return {};
  }
}
