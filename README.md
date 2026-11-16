# Personal website

Plain HTML, CSS and JavaScript with no build step and no dependencies, so it runs as-is on GitHub Pages.

## Pages

- `index.html` is the home page: a short intro and three doors (Work, Games, Photos).
- `work.html` is the hand-drawn map of the fields I work between. Fields are circles; the things I've built sit on the lines between them. Dashed lines and circles are ones I haven't built yet.
- `games.html` is the shelf of strategy games. Each game is a card; a dashed card means not built yet.
- `photos.html` is the photo wall. Click a photo to see it large; arrow keys move between photos.

`style.css` holds the paper, ink and fonts for every page. `pages.css` adds the home, games and photos layouts.

## Editing

- **Map content**: everything on the map is in `data.js`. Add a project by adding an item to an edge, or add a new edge between two node ids.
- **Map layout**: node positions are fractions of the map in `data.js` under `layout` (`wide` for desktop, `tall` for phones). The solid lines form a strip of triangles, so keeping the zigzag rows avoids crossings.
- **Bends and short labels**: an edge can take `bend` (a number, or `{ wide, tall }`) and `short` (a shorter label used on phones).
- **The plain version** at the bottom of the work page is written directly in `work.html`.
- **Photos**: put the image in `photos/`, then add a line to `photos.js`:
  `{ src: "photos/river-park.jpg", caption: "Last light", place: "Riverside Park", when: "Nov 2026" },`
  Keep each file under about 500 KB (around 2000 px on the long side).

## To do

- Add `resume.pdf` to the repo root.
- Add photos.
- Build Blotto.

## Publish

Settings → Pages → Deploy from a branch → `main` / root. The site will be at `https://jiayi61.github.io/Personal-Website/`.
