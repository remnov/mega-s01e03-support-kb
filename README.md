# S01E03 — what it shows

Review of the MEGA.dev support KB export dated 2026-10-04. This is fictional course material,
not data from an operating support service.

The 427 exported rows contain 412 distinct reports in #4471. Running the supplied classifier
with tenant configuration gives two causes: **379 parser reports** and **33 booking-v3 hint
reports**. Five unusual report bodies remain counted under parser by that rule and need
further investigation. Counts describe the export, not the live desk.

- [Parser issue](https://github.com/remnov/mega-s01e03-support-kb/issues/1)
- [Hint issue](https://github.com/remnov/mega-s01e03-support-kb/issues/2)
- [New signed KB page (.svx)](src/routes/kb/decisions/0002-split-4471-by-cause/+page.svx)
- [Rendered page (HTML)](rendered.html) — includes the real Svelte components and their computed output
- [Rendered preview](preview.png)
- [Recomputed audit](analysis.json)
- [Original export conventions](EXPORT-README.md)

The new page uses the course-issued signature in its frontmatter. Its desk ref is computed
by the original RenderStamp component. The accepted decision 0001 remains unchanged. The old incident and triage pages now point to
the signed replacement decision. Exported classifier, data, components, and layout remain unchanged.

## Reproduce

Use Node 22+ with TypeScript stripping support (built and checked with Node 25.7.0).

```sh
npm ci
npm run analyze
npm run build
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/rendered.html. The HTML contains the server-rendered page; its adjacent
`rendered-client.js` hydrates the duplicate explorer. Changing a channel changes the cause and
merge verdict. Keep both files together. The `/kb/...` links are canonical routes for reintegration
into the original KB; this export has no SvelteKit application shell.

`scripts/build.mjs` compiles mdsvex and Svelte for server and browser output. It resolves the
export's `#lib` alias and tenant-directory glob. Computed numbers, timeline, dedupe cases, stale
review indicator, and signature-derived desk ref come from the supplied components. No counts
or desk refs are pasted into the rendered page. The render uses the host date for review age.
