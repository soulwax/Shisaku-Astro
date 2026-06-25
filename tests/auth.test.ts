import assert from 'node:assert/strict';
import test from 'node:test';
import {
	isAllowedGitHubIdentity,
	isAuthorizedAdminUser,
	selectVerifiedGitHubEmail,
} from '../src/lib/auth/github';

test('only the soulwax GitHub account is authorized', () => {
	assert.equal(isAllowedGitHubIdentity({ login: 'soulwax' }), true);
	assert.equal(isAllowedGitHubIdentity({ login: 'SoulWax' }), true);
	assert.equal(isAllowedGitHubIdentity({ login: 'someone-else' }), false);
});

test('stored admin users are checked again by username and role', () => {
	assert.equal(
		isAuthorizedAdminUser({
			username: 'soulwax',
			email: 'soulwax@example.com',
			role: 'admin',
		}),
		true,
	);
	assert.equal(
		isAuthorizedAdminUser({
			username: 'someone-else',
			email: 'someone@example.com',
			role: 'admin',
		}),
		false,
	);
	assert.equal(
		isAuthorizedAdminUser({
			username: 'soulwax',
			email: 'soulwax@example.com',
			role: 'editor',
		}),
		false,
	);
});

test('the primary verified GitHub email is selected', () => {
	assert.equal(
		selectVerifiedGitHubEmail(
			[
				{
					email: 'secondary@example.com',
					primary: false,
					verified: true,
					visibility: null,
				},
				{
					email: 'soulwax@example.com',
					primary: true,
					verified: true,
					visibility: 'private',
				},
			],
			null,
		),
		'soulwax@example.com',
	);
});

test('profile email is used when no verified email is returned', () => {
	assert.equal(selectVerifiedGitHubEmail([], 'soulwax@example.com'), 'soulwax@example.com');
});
