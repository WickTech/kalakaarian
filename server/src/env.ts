import dotenv from 'dotenv';
import path from 'path';

// Must be imported FIRST in app.ts so env is available before Supabase client initializes.
// Load root .env (local dev from workspace root), then server/.env for local overrides.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
