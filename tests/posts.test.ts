import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLocalEnv } from '../scripts/load-local-env.mjs';

loadLocalEnv();

test(
	'post CRUD works against the configured database',
	{ skip: !process.env.DATABASE_URL },
	async () => {
		const { closeDatabase } = await import('../src/db/client');
		const {
			createPost,
			deletePost,
			getPostById,
			getPublishedPostBySlug,
			updatePost,
		} = await import('../src/lib/posts');
		const slug = `test-${Date.now()}`;
		let createdId: string | undefined;

		try {
			const created = await createPost({
				slug,
				title: 'Integration test',
				description: 'Temporary post created by the test suite.',
				bodyMarkdown: '# Draft',
				status: 'draft',
				pubDate: new Date(),
				tags: ['test'],
			});
			createdId = created.id;

			assert.equal(created.status, 'draft');
			assert.equal((await getPostById(created.id))?.slug, slug);
			assert.equal(await getPublishedPostBySlug(slug), null);

			const updated = await updatePost(created.id, {
				slug,
				title: 'Integration test',
				description: 'Temporary post created by the test suite.',
				bodyMarkdown: '# Published',
				status: 'published',
				pubDate: new Date(),
				tags: ['test'],
			});

			assert.equal(updated.status, 'published');
			assert.equal((await getPublishedPostBySlug(slug))?.id, created.id);

			await deletePost(created.id);
			createdId = undefined;
			assert.equal(await getPostById(created.id), null);
		} finally {
			if (createdId) {
				await deletePost(createdId);
			}
			await closeDatabase();
		}
	},
);
