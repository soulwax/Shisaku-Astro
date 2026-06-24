# shisaku devlog

An Astro-powered devlog for experiments, notes, and shipped little ideas.

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `astro dev --background` | Start the local dev server in background mode |
| `astro dev status` | Check the background dev server |
| `astro dev logs` | View dev-server logs |
| `astro dev stop` | Stop the background dev server |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the build locally |

## Project Structure

```text
public/
src/
  assets/
  components/
  content/
  layouts/
  pages/
astro.config.mjs
package.json
```

Static assets live in `public/`. Blog content lives in `src/content/blog/`.

## Credit

This theme began from Astro's blog starter and Bear Blog's default CSS.
