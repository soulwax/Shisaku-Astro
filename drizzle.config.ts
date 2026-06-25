import { defineConfig } from 'drizzle-kit';
import { loadLocalEnv } from './scripts/load-local-env.mjs';

loadLocalEnv();

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;

if (!migrationUrl) {
	throw new Error('DATABASE_URL_UNPOOLED is required to run Drizzle migrations.');
}

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: migrationUrl,
	},
});
