import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLocalEnv } from '../scripts/load-local-env.mjs';

loadLocalEnv();

test(
	'Redis sessions can be created, read, and deleted',
	{ skip: !process.env.REDIS_URL },
	async () => {
		const {
			closeRedis,
			createSession,
			deleteSession,
			getRedis,
			getSessionUserId,
			SESSION_TTL_SECONDS,
		} = await import('../src/lib/auth/session');
		const userId = '00000000-0000-4000-8000-000000000001';
		const token = await createSession(userId);

		try {
			assert.equal(await getSessionUserId(token), userId);
			const ttl = await getRedis().ttl(`shisaku:session:${token}`);
			assert.ok(ttl > 0 && ttl <= SESSION_TTL_SECONDS);
			await deleteSession(token);
			assert.equal(await getSessionUserId(token), null);
		} finally {
			await deleteSession(token);
			closeRedis();
		}
	},
);
