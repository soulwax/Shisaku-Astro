import { inArray } from 'drizzle-orm';
import matter from 'gray-matter';
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { loadLocalEnv } from './load-local-env.mjs';

const projectRoot = process.cwd();
loadLocalEnv({ root: projectRoot });

const { closeDatabase } = await import('../src/db/client');
const { db } = await import('../src/db/client');
const { posts } = await import('../src/db/schema');
const { upsertSeedPost } = await import('../src/lib/posts');
const contentDirectory = resolve(projectRoot, 'scripts/seed-content');
const files = (await readdir(contentDirectory)).filter((file) => /\.(md|mdx)$/.test(file));
const obsoleteStarterSlugs = [
	'first-post',
	'markdown-style-guide',
	'second-post',
	'third-post',
	'using-mdx',
];

try {
	await db.delete(posts).where(inArray(posts.slug, obsoleteStarterSlugs));

	for (const file of files) {
		const source = await readFile(resolve(contentDirectory, file), 'utf8');
		const parsed = matter(source);
		const slug = basename(file, extname(file));

		await upsertSeedPost({
			slug,
			title: String(parsed.data.title),
			description: String(parsed.data.description),
			bodyMarkdown: parsed.content.trim(),
			status: parsed.data.status === 'draft' ? 'draft' : 'published',
			pubDate: new Date(parsed.data.pubDate),
			heroImage: parsed.data.heroImage ? String(parsed.data.heroImage) : null,
			tags: Array.isArray(parsed.data.tags)
				? parsed.data.tags.map(String)
				: ['devlog', 'build-notes'],
		});

		console.log(`Seeded ${slug}`);
	}

	console.log(`Seeded ${files.length} posts.`);
} finally {
	await closeDatabase();
}
