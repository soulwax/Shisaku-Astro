import assert from 'node:assert/strict';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import { loadLocalEnv } from '../scripts/load-local-env.mjs';

loadLocalEnv();

test(
	'comments can be created for published posts only',
	{ skip: !process.env.DATABASE_URL },
	async () => {
		const { closeDatabase, db } = await import('../src/db/client');
		const { posts, users } = await import('../src/db/schema');
		const { createComment, listCommentsForPost } = await import('../src/lib/comments');
		const suffix = Date.now();
		let userId: string | undefined;
		let publishedPostId: string | undefined;
		let draftPostId: string | undefined;

		try {
			const [user] = await db
				.insert(users)
				.values({
					githubId: `comment-test-${suffix}`,
					username: `commenter-${suffix}`,
					email: `commenter-${suffix}@example.com`,
					role: 'commenter',
				})
				.returning();
			userId = user.id;

			const [publishedPost] = await db
				.insert(posts)
				.values({
					slug: `comment-published-${suffix}`,
					title: 'Published comment target',
					description: 'Temporary published post for comments.',
					bodyMarkdown: '# Published',
					status: 'published',
					pubDate: new Date(),
				})
				.returning();
			publishedPostId = publishedPost.id;

			const [draftPost] = await db
				.insert(posts)
				.values({
					slug: `comment-draft-${suffix}`,
					title: 'Draft comment target',
					description: 'Temporary draft post for comments.',
					bodyMarkdown: '# Draft',
					status: 'draft',
					pubDate: new Date(),
				})
				.returning();
			draftPostId = draftPost.id;

			const comment = await createComment({
				postId: publishedPost.id,
				authorId: user.id,
				authorUsername: user.username,
				body: 'A useful note.',
			});

			assert.equal(comment.authorUsername, user.username);
			assert.equal((await listCommentsForPost(publishedPost.id)).length, 1);

			await assert.rejects(() =>
				createComment({
					postId: draftPost.id,
					authorId: user.id,
					authorUsername: user.username,
					body: 'Should not land.',
				}),
			);
		} finally {
			if (publishedPostId) {
				await db.delete(posts).where(eq(posts.id, publishedPostId));
			}
			if (draftPostId) {
				await db.delete(posts).where(eq(posts.id, draftPostId));
			}
			if (userId) {
				await db.delete(users).where(eq(users.id, userId));
			}
			await closeDatabase();
		}
	},
);
