export const ADMIN_GITHUB_USERNAME = 'soulwax';

export interface GitHubIdentity {
	id: number;
	login: string;
	email: string | null;
}

export interface GitHubEmail {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
}

export const isAllowedGitHubIdentity = (identity: Pick<GitHubIdentity, 'login'>): boolean =>
	identity.login.trim().length > 0;

export const roleForGitHubLogin = (login: string): 'admin' | 'commenter' =>
	login.toLowerCase() === ADMIN_GITHUB_USERNAME ? 'admin' : 'commenter';

export const isAuthenticatedGitHubUser = (user: {
	username: string;
	email: string;
	role: string;
}): boolean =>
	(user.role === 'admin' || user.role === 'commenter') &&
	isAllowedGitHubIdentity({ login: user.username });

export const isAuthorizedAdminUser = (user: {
	username: string;
	email: string;
	role: string;
}): boolean =>
	user.role === 'admin' && user.username.toLowerCase() === ADMIN_GITHUB_USERNAME;

export const selectVerifiedGitHubEmail = (
	emails: GitHubEmail[],
	profileEmail: string | null,
): string | null => {
	const verified = emails.filter((email) => email.verified);

	return verified.find((email) => email.primary)?.email ?? verified[0]?.email ?? profileEmail;
};
