import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		githubId: text('github_id').notNull(),
		username: text('username').notNull(),
		email: text('email').notNull(),
		role: text('role').notNull().default('commenter'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		lastLoginAt: timestamp('last_login_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('users_github_id_idx').on(table.githubId),
		uniqueIndex('users_username_idx').on(table.username),
	],
);

export const posts = pgTable(
	'posts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		bodyMarkdown: text('body_markdown').notNull(),
		heroImage: text('hero_image'),
		tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
		status: text('status').notNull().default('draft'),
		pubDate: timestamp('pub_date', { withTimezone: true }).notNull().defaultNow(),
		updatedDate: timestamp('updated_date', { withTimezone: true }),
		readTimeMinutes: integer('read_time_minutes').notNull().default(1),
		authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('posts_slug_idx').on(table.slug),
		index('posts_status_pub_date_idx').on(table.status, table.pubDate),
	],
);

export const comments = pgTable(
	'comments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		postId: uuid('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
		authorUsername: text('author_username').notNull(),
		body: text('body').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('comments_post_created_at_idx').on(table.postId, table.createdAt),
		index('comments_author_id_idx').on(table.authorId),
	],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
