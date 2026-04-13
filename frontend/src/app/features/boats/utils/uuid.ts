import { UUID } from '../models/boat.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toUUID(value: string): UUID {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`Invalid UUID format: "${value}"`);
  }
  return value as UUID;
}

