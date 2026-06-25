import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { comments, posts, type Comment, type NewComment } from '../db/schema';

export interface CommentInput {
	postId: string;
	authorId: string;
	authorUsername: string;
	body: string;
}

const toNewComment = (input: CommentInput): NewComment => ({
	postId: input.postId,
	authorId: input.authorId,
	authorUsername: input.authorUsername.trim().toLowerCase(),
	body: input.body.trim(),
});

export const listCommentsForPost = async (postId: string): Promise<Comment[]> =>
	db
		.select()
		.from(comments)
		.where(eq(comments.postId, postId))
		.orderBy(asc(comments.createdAt));

export const createComment = async (input: CommentInput): Promise<Comment> => {
	const [post] = await db
		.select({ id: posts.id })
		.from(posts)
		.where(and(eq(posts.id, input.postId), eq(posts.status, 'published')))
		.limit(1);

	if (!post) {
		throw new Error('Post not found.');
	}

	const [comment] = await db.insert(comments).values(toNewComment(input)).returning();

	if (!comment) {
		throw new Error('Unable to create comment.');
	}

	return comment;
};
