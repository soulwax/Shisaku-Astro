import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const loadLocalEnv = ({ root = process.cwd() } = {}) => {
	const localEnvPath = resolve(root, '.env.local');
	const envPath = resolve(root, '.env');

	if (existsSync(localEnvPath)) {
		config({ path: localEnvPath, quiet: true, override: false });
	}

	if (existsSync(envPath)) {
		config({ path: envPath, quiet: true, override: false });
	}
};
