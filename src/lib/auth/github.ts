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

export const isAllowedGitHubIdentity = (
	identity: Pick<GitHubIdentity, 'login'>,
): boolean => {
	return identity.login.toLowerCase() === ADMIN_GITHUB_USERNAME;
};

export const isAuthorizedAdminUser = (user: {
	username: string;
	email: string;
	role: string;
}): boolean =>
	user.role === 'admin' &&
	isAllowedGitHubIdentity({ login: user.username });

export const selectVerifiedGitHubEmail = (
	emails: GitHubEmail[],
	profileEmail: string | null,
): string | null => {
	const verified = emails.filter((email) => email.verified);

	return verified.find((email) => email.primary)?.email ?? verified[0]?.email ?? profileEmail;
};
