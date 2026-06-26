import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateReadMinutes, renderMarkdown } from '../src/lib/markdown';

test('markdown output is sanitized', async () => {
	const html = await renderMarkdown(
		'# Safe\n\n<script>alert("no")</script>\n\n[link](javascript:alert(1))',
	);

	assert.match(html, /<h1>Safe<\/h1>/);
	assert.doesNotMatch(html, /<script/);
	assert.doesNotMatch(html, /href="javascript:/);
});

test('renders fenced code in unsupported languages without throwing', async () => {
	// `zig` is intentionally not in the loaded grammar set; it must degrade, not 500.
	const html = await renderMarkdown('```zig\nconst x = 0;\n```\n');

	assert.match(html, /const x/);
});

test('highlights C and C++ fenced code blocks', async () => {
	const c = await renderMarkdown('```c\nint x = 0;\n```\n');
	const cpp = await renderMarkdown('```cpp\nauto y = 0;\n```\n');

	assert.match(c, /class="language-c"/);
	assert.match(cpp, /class="language-cpp"/);
});

test('read time is at least one minute', () => {
	assert.equal(estimateReadMinutes('short post'), 1);
});
