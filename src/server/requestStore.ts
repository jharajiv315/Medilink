import { AsyncLocalStorage } from 'node:async_hooks';
import type { MediLinkDatabase } from './mockDb.ts';

export interface RequestStore {
  data: MediLinkDatabase;
  dirty: boolean;
}

export const requestStore = new AsyncLocalStorage<RequestStore>();
export const usesSupabase = () => Boolean(process.env.SUPABASE_DATABASE_URL);
