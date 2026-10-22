# Writing for this site

The blog posts (`content/blog/*.md`) and project pages (`content/projects/*.md`) are written in Alex's own voice. See `README.md` for where content lives and how to verify changes.

## Voice

- Get to the point in the first sentence. No warm-up, no thesis statement.
- Write the way Alex talks: sentences can run long, joined with commas, instead of being chopped into short punchy lines.
- Tell experiences in order. "So" and "Then" are fine for moving a story along.
- Be blunt about opinions and plain about failures ("it didn't work", "I shelved it").
- Use the real numbers and details instead of adjectives.
- Use everyday words. An occasional ":)" or emoji is fine, at most one per post.
- End when the point is made. No recap section.

Never use:

- em-dashes
- "it's not X, it's Y" or "not X but Y" setups
- punchy one-line wrap-ups at the end of a paragraph or post
- groups of three for rhythm
- signposting like "Here's what I learned" or "The short version:"
- filler words like "genuinely", "seamless", "night and day", "leverage", "game-changer"
- bold labels on list items, or `---` rules between sections

Keep lists only for things that really are lists (steps, features, checks). Don't invent experiences, numbers or claims, and keep every existing fact, link, image, table and code block when editing.

## Project page structure

Every project page uses the same sections in this order, as plain paragraphs without headings:

1. What it is. One or two sentences on what it is and who it's for.
2. Why it exists. The problem it solves, the client's goal, or how it started. Leave this out if there's nothing true to say.
3. How it works. One or two paragraphs on the interesting part.
4. Features. Only if the project really has a list of them, introduced with "What's in it:" as a short lowercase list.
5. Stack. One paragraph that starts "It's built with…" and ends with a sentence saying where it runs.
6. Links. Only when they exist, each on its own line at the end: `Related post: [Post title](/blog/<slug>/)` first, then `Source: [github.com/...](https://github.com/...)`. Use the post title from `content/blog.json`.
