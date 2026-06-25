import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { requireEnv } from '../../../../lib/env';

const OAUTH_STATE_COOKIE = 'shisaku_oauth_state';
const OAUTH_RETURN_COOKIE = 'shisaku_oauth_return_to';

const getSafeReturnTo = (url: URL): string => {
	const returnTo = url.searchParams.get('returnTo') ?? '/admin';

	if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
		return '/admin';
	}

	return returnTo;
};

export const GET: APIRoute = ({ cookies, redirect, url }) => {
	const state = randomBytes(24).toString('base64url');
	const returnTo = getSafeReturnTo(url);
	const callbackUrl = new URL('/admin/oauth/github/callback', url.origin);
	const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

	authorizeUrl.searchParams.set('client_id', requireEnv('GITHUB_CLIENT_ID'));
	authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString());
	authorizeUrl.searchParams.set('scope', 'read:user user:email');
	authorizeUrl.searchParams.set('state', state);

	cookies.set(OAUTH_STATE_COOKIE, state, {
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		path: '/',
		maxAge: 60 * 10,
	});
	cookies.set(OAUTH_RETURN_COOKIE, returnTo, {
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		path: '/',
		maxAge: 60 * 10,
	});

	return redirect(authorizeUrl.toString());
};
