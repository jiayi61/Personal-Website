# Personal website

A hand-drawn map of the fields I work between. Fields are circles; the things I've built sit on the lines between them. Dashed lines and circles are ones I haven't built yet.

Plain HTML, CSS and JavaScript with no build step and no dependencies, so it runs as-is on GitHub Pages.

## Editing

- **Content**: everything on the map is in `data.js`. Add a project by adding an item to an edge, or add a new edge between two node ids.
- **Layout**: node positions are fractions of the map in `data.js` under `layout` (`wide` for desktop, `tall` for phones). The solid lines form a strip of triangles, so keeping the zigzag rows avoids crossings.
- **Bends and short labels**: an edge can take `bend` (a number, or `{ wide, tall }`) and `short` (a shorter label used on phones).
- **The plain version** at the bottom of the page is written directly in `index.html`.

## To do

- Add `resume.pdf` to the repo root.
- Put the real LinkedIn URL in `index.html`.

## Publish

Settings → Pages → Deploy from a branch → `main` / root. The site will be at `https://jiayi61.github.io/personal-website/`.
