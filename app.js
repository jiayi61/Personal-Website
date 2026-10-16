(() => {
  "use strict";

  const SITE = window.SITE;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("map");
  const wrap = document.getElementById("mapWrap");
  const note = document.getElementById("note");
  const noteEls = {
    pair: document.getElementById("notePair"),
    title: document.getElementById("noteTitle"),
    intro: document.getElementById("noteIntro"),
    items: document.getElementById("noteItems"),
    close: document.getElementById("noteClose")
  };
  const pencilBtn = document.getElementById("pencil");
  const pencilHint = document.getElementById("pencilHint");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nodeById = Object.fromEntries(SITE.nodes.map(n => [n.id, n]));
  const state = {
    W: 0, H: 0, mode: "wide", s: 1,
    pos: { wide: {}, tall: {} },   // dragged positions, as fractions
    userEdges: [],                 // lines visitors draw
    active: null,                  // "edge:<id>" or "node:<id>"
    lit: new Set(),
    pencil: false,
    opener: null,
    firstRender: true
  };

  /* ---------- seeded randomness, so every wobble is stable ---------- */

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const jit = (r, amt) => (r() * 2 - 1) * amt;
  const f = n => n.toFixed(1);

  /* ---------- hand-drawn shapes ---------- */

  // A quadratic curve, stroked twice with a little drift, like a pen going over a line.
  function sketchQuad(p0, c, p1, r) {
    let d = "";
    for (let pass = 0; pass < 2; pass++) {
      const k = pass ? 2.2 : 1.2;
      const s = [p0[0] + jit(r, k), p0[1] + jit(r, k)];
      const e = [p1[0] + jit(r, k), p1[1] + jit(r, k)];
      const cc = [c[0] + jit(r, k * 4), c[1] + jit(r, k * 4)];
      d += `M${f(s[0])},${f(s[1])} Q${f(cc[0])},${f(cc[1])} ${f(e[0])},${f(e[1])} `;
    }
    return d;
  }

  // Catmull-Rom through points, as cubic beziers.
  function smooth(pts) {
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
  }

  // An ellipse that doesn't quite close, drawn one and a bit times round.
  function sketchEllipse(cx, cy, rx, ry, r) {
    let d = "";
    for (let pass = 0; pass < 2; pass++) {
      const start = r() * Math.PI * 2;
      const sweep = Math.PI * 2 + (pass ? 0.25 + r() * 0.3 : 0.45 + r() * 0.35);
      const n = 14, pts = [];
      for (let i = 0; i <= n; i++) {
        const a = start + (sweep * i) / n;
        const wob = 1 + jit(r, 0.035) + (i === 0 ? 0.04 : 0);
        pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]);
      }
      d += smooth(pts) + " ";
    }
    return d;
  }

  // Highlighter scribble inside an ellipse.
  function hachure(cx, cy, rx, ry, r) {
    const a = -0.7, gap = 9;
    const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    const RX = rx * 0.8, RY = ry * 0.72;
    const R = Math.max(RX, RY);
    const pts = [];
    let flip = false;
    for (let dd = -R; dd <= R; dd += gap) {
      const A = (ux / RX) ** 2 + (uy / RY) ** 2;
      const B = 2 * (nx * dd * ux / RX ** 2 + ny * dd * uy / RY ** 2);
      const C = (nx * dd / RX) ** 2 + (ny * dd / RY) ** 2 - 1;
      const disc = B * B - 4 * A * C;
      if (disc <= 0) continue;
      const t1 = (-B - Math.sqrt(disc)) / (2 * A), t2 = (-B + Math.sqrt(disc)) / (2 * A);
      const P = t => [cx + nx * dd + ux * t + jit(r, 1.5), cy + ny * dd + uy * t + jit(r, 1.5)];
      if (flip) pts.push(P(t2), P(t1)); else pts.push(P(t1), P(t2));
      flip = !flip;
    }
    return pts.length ? "M" + pts.map(p => `${f(p[0])},${f(p[1])}`).join(" L") : "";
  }

  /* ---------- geometry ---------- */

  function nodeSize(n) {
    const s = state.s;
    const rx = Math.max(54, n.label.length * 7.4 + 30) * s;
    return { rx, ry: 33 * s };
  }

  function nodePos(id) {
    const custom = state.pos[state.mode][id];
    const [fx, fy] = custom || SITE.layout[state.mode][id];
    const padX = state.mode === "tall" ? 98 * state.s : 80, padY = 46;
    return [padX + fx * (state.W - padX * 2), padY + fy * (state.H - padY * 2)];
  }

  function toFraction(x, y) {
    const padX = state.mode === "tall" ? 98 * state.s : 80, padY = 46;
    const fx = (x - padX) / (state.W - padX * 2), fy = (y - padY) / (state.H - padY * 2);
    return [Math.min(1, Math.max(0, fx)), Math.min(1, Math.max(0, fy))];
  }

  function boundary(c, size, toward, gap = 7) {
    const vx = toward[0] - c[0], vy = toward[1] - c[1];
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len, uy = vy / len;
    const t = 1 / Math.sqrt((ux / size.rx) ** 2 + (uy / size.ry) ** 2);
    return [c[0] + ux * (t + gap), c[1] + uy * (t + gap)];
  }

  function edgeGeom(e) {
    const A = nodePos(e.a), B = nodePos(e.b);
    const r = rng(hash(e.id));
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len = Math.hypot(dx, dy) || 1;
    const random = (r() > 0.5 ? 1 : -1) * (0.07 + r() * 0.08);
    const set = e.bend && typeof e.bend === "object" ? e.bend[state.mode] : e.bend;
    const bend = set != null ? set : random;
    const c = [mx - (dy / len) * bend * len, my + (dx / len) * bend * len];
    const p0 = boundary(A, nodeSize(nodeById[e.a]), c);
    const p1 = boundary(B, nodeSize(nodeById[e.b]), c);
    const mid = [0.25 * p0[0] + 0.5 * c[0] + 0.25 * p1[0], 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p1[1]];
    return { p0, c, p1, mid, r };
  }

  /* ---------- rendering ---------- */

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function measure() {
    const rect = wrap.getBoundingClientRect();
    state.W = Math.max(300, rect.width);
    state.H = Math.max(360, rect.height);
    state.mode = state.W / state.H < 0.9 ? "tall" : "wide";
    state.s = state.mode === "tall" ? Math.min(1, Math.max(0.74, state.W / 560)) : Math.min(1, Math.max(0.8, state.W / 900));
    svg.style.setProperty("--s", state.s);
    svg.setAttribute("viewBox", `0 0 ${state.W} ${state.H}`);
  }

  let tempLine = null;

  function render() {
    const focusedKey = document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.key : null;
    svg.textContent = "";

    const edgeLayer = el("g", { class: "edges" }, svg);
    const nodeLayer = el("g", { class: "nodes" }, svg);
    const drawn = [];

    const allEdges = SITE.edges.concat(state.userEdges);
    allEdges.forEach(e => {
      const g = edgeGeom(e);
      const key = "edge:" + e.id;
      const group = el("g", {
        class: "edge" + (e.dashed ? " dashed" : "") + (e.user ? " user" : "") + (state.active === key ? " active" : ""),
        tabindex: "0", role: "button", "data-key": key,
        "aria-label": `${nodeById[e.a].label} and ${nodeById[e.b].label}: ${e.label}` + (e.dashed ? ", not built yet" : "")
      }, edgeLayer);
      const path = el("path", { class: "sk sk-edge" + (e.dashed ? " dashed" : "") + (e.user ? " sk-pencil" : ""), d: sketchQuad(g.p0, g.c, g.p1, g.r) }, group);
      el("path", { class: "hit", d: `M${f(g.p0[0])},${f(g.p0[1])} Q${f(g.c[0])},${f(g.c[1])} ${f(g.p1[0])},${f(g.p1[1])}` }, group);
      const label = el("text", { class: "edge-label", x: f(g.mid[0]), y: f(g.mid[1]) }, group);
      label.textContent = state.mode === "tall" && e.short ? e.short : e.label;
      drawn.push({ path, label, kind: "edge" });

      group.addEventListener("click", () => openEdge(e, group));
      group.addEventListener("keydown", ev => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openEdge(e, group); }
      });
      group.addEventListener("pointerenter", () => { state.lit = new Set([e.a, e.b]); paintLit(); });
      group.addEventListener("pointerleave", () => { state.lit.clear(); paintLit(); });
    });

    SITE.nodes.forEach(n => {
      const [x, y] = nodePos(n.id);
      const { rx, ry } = nodeSize(n);
      const r = rng(hash(n.id));
      const key = "node:" + n.id;
      const group = el("g", {
        class: "node" + (n.dashed ? " dashed" : "") + (state.active === key ? " active" : "") + (state.lit.has(n.id) ? " lit" : ""),
        tabindex: "0", role: "button", "data-key": key, "data-id": n.id,
        "aria-label": n.label + (n.dashed ? ", a field I haven't built in yet" : "")
      }, nodeLayer);
      el("path", { class: "sk sk-fill", d: hachure(x, y, rx, ry, r) }, group);
      const path = el("path", { class: "sk sk-node" + (n.dashed ? " dashed" : ""), d: sketchEllipse(x, y, rx, ry, r) }, group);
      const label = el("text", { class: "node-label", x: f(x), y: f(y + 1) }, group);
      label.textContent = n.label;
      el("ellipse", { class: "hit-node", cx: f(x), cy: f(y), rx: f(rx + 6), ry: f(ry + 6) }, group);
      drawn.push({ path, label, kind: "node" });
      bindNode(group, n);
    });

    if (tempLine) svg.appendChild(tempLine);

    if (state.firstRender) {
      state.firstRender = false;
      if (!reduceMotion) animateIn(drawn);
    }

    if (focusedKey) {
      const again = svg.querySelector(`[data-key="${CSS.escape(focusedKey)}"]`);
      if (again) again.focus({ preventScroll: true });
    }
  }

  function animateIn(drawn) {
    svg.classList.add("drawing");
    let ni = 0, ei = 0;
    drawn.forEach(d => {
      const len = Math.ceil(d.path.getTotalLength());
      d.path.style.setProperty("--len", len);
      let delay;
      if (d.kind === "node") delay = 0.05 + ni++ * 0.09;
      else delay = 0.75 + ei++ * 0.07;
      d.path.style.animationDelay = delay + "s";
      d.label.style.animationDelay = (delay + (d.kind === "node" ? 0.35 : 0.7)) + "s";
    });
    setTimeout(() => svg.classList.remove("drawing"), 3400);
  }

  function paintLit() {
    svg.querySelectorAll(".node").forEach(g => g.classList.toggle("lit", state.lit.has(g.dataset.id)));
  }

  /* ---------- dragging and drawing ---------- */

  function svgPoint(ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = pt.matrixTransform(m.inverse());
    return [p.x, p.y];
  }

  function nodeAt(x, y) {
    return SITE.nodes.find(n => {
      const [cx, cy] = nodePos(n.id);
      const { rx, ry } = nodeSize(n);
      return ((x - cx) / (rx + 8)) ** 2 + ((y - cy) / (ry + 8)) ** 2 <= 1;
    });
  }

  function bindNode(group, n) {
    group.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openNode(n, group); }
    });

    group.addEventListener("pointerdown", ev => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const start = svgPoint(ev);
      const origin = nodePos(n.id);
      let moved = false;
      const pointerId = ev.pointerId;
      svg.setPointerCapture(pointerId);

      const onMove = mv => {
        if (mv.pointerId !== pointerId) return;
        const p = svgPoint(mv);
        if (!moved && Math.hypot(p[0] - start[0], p[1] - start[1]) > 4) moved = true;
        if (!moved) return;
        if (state.pencil) {
          const r = rng(hash(n.id + "pencil"));
          if (!tempLine) tempLine = el("path", { class: "sk sk-edge sk-pencil" });
          const c = [(origin[0] + p[0]) / 2, (origin[1] + p[1]) / 2];
          tempLine.setAttribute("d", sketchQuad(origin, c, p, r));
          if (!tempLine.parentNode) svg.appendChild(tempLine);
        } else {
          state.pos[state.mode][n.id] = toFraction(origin[0] + p[0] - start[0], origin[1] + p[1] - start[1]);
          group.classList.add("dragging");
          render();
        }
      };
      const onUp = up => {
        if (up.pointerId !== pointerId) return;
        svg.removeEventListener("pointermove", onMove);
        svg.removeEventListener("pointerup", onUp);
        svg.removeEventListener("pointercancel", onUp);
        try { svg.releasePointerCapture(pointerId); } catch (_) {}
        if (tempLine) { tempLine.remove(); tempLine = null; }
        if (!moved) {
          const target = svg.querySelector(`[data-key="node:${n.id}"]`);
          openNode(n, target);
          return;
        }
        if (state.pencil) {
          const p = svgPoint(up);
          const other = nodeAt(p[0], p[1]);
          if (other && other.id !== n.id) connect(n, other);
        }
      };
      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
      svg.addEventListener("pointercancel", onUp);
    });
  }

  function connect(a, b) {
    const all = SITE.edges.concat(state.userEdges);
    const existing = all.find(e => (e.a === a.id && e.b === b.id) || (e.a === b.id && e.b === a.id));
    if (existing) {
      render();
      openEdge(existing, svg.querySelector(`[data-key="edge:${existing.id}"]`));
      return;
    }
    const e = {
      id: `you-${a.id}-${b.id}`, a: a.id, b: b.id, label: "your idea?", user: true,
      intro: "Nobody has drawn this one yet, including me.",
      items: [{
        t: "Got an idea for it?",
        d: `If you can think of something that belongs between ${a.label.toLowerCase()} and ${b.label.toLowerCase()}, I'd genuinely like to hear it.`,
        link: { href: `mailto:jl7716@columbia.edu?subject=${encodeURIComponent(`An idea for ${a.label} × ${b.label}`)}`, text: "Write to me" }
      }]
    };
    state.userEdges.push(e);
    render();
    openEdge(e, svg.querySelector(`[data-key="edge:${e.id}"]`));
  }

  function setPencil(on) {
    state.pencil = on;
    pencilBtn.setAttribute("aria-pressed", String(on));
    pencilBtn.textContent = on ? "Done drawing" : "Draw your own line";
    document.body.classList.toggle("pencil-mode", on);
    pencilHint.hidden = !on;
  }
  pencilBtn.addEventListener("click", () => setPencil(!state.pencil));

  /* ---------- the sticky note ---------- */

  function fillItems(items, emptyText) {
    noteEls.items.textContent = "";
    if (!items.length && emptyText) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = emptyText;
      noteEls.items.appendChild(li);
    }
    items.forEach(it => {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = it.t;
      li.appendChild(b);
      if (it.when) {
        const w = document.createElement("span");
        w.className = "when";
        w.textContent = it.when;
        li.appendChild(w);
        li.appendChild(document.createElement("br"));
      }
      if (it.d) li.appendChild(document.createTextNode(it.d));
      if (it.link) {
        li.appendChild(document.createTextNode(" "));
        const a = document.createElement("a");
        a.href = it.link.href; a.textContent = it.link.text;
        li.appendChild(a);
      }
      if (it.go) {
        const btn = document.createElement("a");
        btn.href = "#"; btn.textContent = it.go.text;
        btn.addEventListener("click", ev => { ev.preventDefault(); it.go.fn(); });
        li.appendChild(btn);
      }
      noteEls.items.appendChild(li);
    });
  }

  function showNote(key, opener) {
    state.active = key;
    state.opener = opener || null;
    svg.querySelectorAll(".edge, .node").forEach(g => g.classList.toggle("active", g.dataset.key === key));
    note.classList.add("open");
    note.setAttribute("aria-hidden", "false");
    note.scrollTop = 0;
    if (!window.matchMedia("(pointer: fine)").matches || (opener && opener.matches(":focus-visible"))) {
      note.focus({ preventScroll: true });
    }
  }

  function openEdge(e, opener) {
    const A = nodeById[e.a], B = nodeById[e.b];
    noteEls.pair.textContent = `${A.label} × ${B.label}`;
    noteEls.title.textContent = e.user ? "A line nobody's drawn" : e.label.charAt(0).toUpperCase() + e.label.slice(1);
    noteEls.intro.textContent = e.intro || "";
    fillItems(e.items || []);
    showNote("edge:" + e.id, opener);
  }

  function openNode(n, opener) {
    noteEls.pair.textContent = n.dashed ? "A field I haven't built in yet" : "A field";
    noteEls.title.textContent = n.label;
    noteEls.intro.textContent = n.blurb || "";
    const lines = SITE.edges.concat(state.userEdges)
      .filter(e => e.a === n.id || e.b === n.id)
      .map(e => {
        const other = nodeById[e.a === n.id ? e.b : e.a];
        return {
          t: `${e.label}${e.dashed ? " (not built yet)" : ""}`,
          d: `with ${other.label}. `,
          go: { text: "Open", fn: () => openEdge(e, svg.querySelector(`[data-key="edge:${e.id}"]`)) }
        };
      });
    fillItems((n.items || []).concat(lines), "Nothing here yet.");
    showNote("node:" + n.id, opener);
  }

  function closeNote() {
    if (!note.classList.contains("open")) return;
    note.classList.remove("open");
    note.setAttribute("aria-hidden", "true");
    state.active = null;
    svg.querySelectorAll(".active").forEach(g => g.classList.remove("active"));
    if (state.opener && document.contains(state.opener)) state.opener.focus({ preventScroll: true });
  }

  noteEls.close.addEventListener("click", closeNote);
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") { if (state.pencil) setPencil(false); closeNote(); }
  });
  document.addEventListener("pointerdown", ev => {
    if (!note.classList.contains("open")) return;
    if (note.contains(ev.target)) return;
    if (ev.target.closest && ev.target.closest(".edge, .node")) return;
    closeNote();
  });

  /* ---------- the cat ---------- */

  const cat = document.getElementById("cat");
  const catSays = document.getElementById("catSays");
  const lines = ["Meow.", "I'm from the 猫协 site.", "Try a dashed line.", "Mrrp. Hire her."];
  let catI = 0, catTimer = null;
  cat.addEventListener("click", () => {
    catSays.textContent = lines[catI++ % lines.length];
    catSays.classList.add("on");
    clearTimeout(catTimer);
    catTimer = setTimeout(() => catSays.classList.remove("on"), 2400);
  });

  /* ---------- go ---------- */

  function layout() { measure(); render(); }
  const start = () => {
    layout();
    let raf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }).observe(wrap);
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
