import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { loadRuntimeConfig } from './app/core/config/runtime-config';
import { App } from './app/app';

async function bootstrap(): Promise<void> {
  const runtimeConfig = await loadRuntimeConfig();
  await bootstrapApplication(App, createAppConfig(runtimeConfig));
}

void bootstrap().catch((err) => console.error(err));
