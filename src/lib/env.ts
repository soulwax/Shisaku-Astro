import { loadLocalEnv } from '../../scripts/load-local-env.mjs';

loadLocalEnv();

export const requireEnv = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required.`);
	}

	return value;
};

export const getEnv = (name: string, fallback: string): string => process.env[name] || fallback;
