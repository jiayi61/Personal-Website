(() => {
  "use strict";

  const photos = window.PHOTOS || [];
  const gallery = document.getElementById("gallery");
  const empty = document.getElementById("empty");
  const box = document.getElementById("lightbox");
  const boxImg = box.querySelector("img");
  const boxCap = box.querySelector(".lb-cap");

  if (!photos.length) { empty.hidden = false; return; }

  // A small, stable tilt for each print, so the wall looks hand-pinned.
  const tilt = i => {
    const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
    return ((x - Math.floor(x)) * 2 - 1) * 1.6;
  };
  const meta = p => [p.place, p.when].filter(Boolean).join(" · ");

  photos.forEach((p, i) => {
    const fig = document.createElement("figure");
    fig.className = "print";
    fig.style.setProperty("--tilt", tilt(i).toFixed(2) + "deg");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Open " + (p.caption || "photo " + (i + 1)));
    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.alt || p.caption || "";
    img.loading = "lazy";
    img.decoding = "async";
    btn.appendChild(img);
    btn.addEventListener("click", () => show(i));
    fig.appendChild(btn);

    if (p.caption || meta(p)) {
      const cap = document.createElement("figcaption");
      if (p.caption) {
        const b = document.createElement("b");
        b.textContent = p.caption;
        cap.appendChild(b);
      }
      if (meta(p)) {
        const s = document.createElement("span");
        s.textContent = meta(p);
        cap.appendChild(s);
      }
      fig.appendChild(cap);
    }
    gallery.appendChild(fig);
  });

  let cur = 0;
  function show(i) {
    cur = (i + photos.length) % photos.length;
    const p = photos[cur];
    boxImg.src = p.src;
    boxImg.alt = p.alt || p.caption || "";
    boxCap.textContent = [p.caption, meta(p)].filter(Boolean).join(" · ");
    if (!box.open) box.showModal();
  }

  const single = photos.length < 2;
  box.querySelectorAll(".lb-nav").forEach(b => { b.hidden = single; });

  box.addEventListener("click", ev => {
    const act = ev.target.closest("[data-act]");
    if (act) {
      if (act.dataset.act === "close") box.close();
      if (act.dataset.act === "prev") show(cur - 1);
      if (act.dataset.act === "next") show(cur + 1);
      return;
    }
    if (ev.target === box) box.close();   // click on the dark backdrop
  });
  document.addEventListener("keydown", ev => {
    if (!box.open || single) return;
    if (ev.key === "ArrowLeft") show(cur - 1);
    if (ev.key === "ArrowRight") show(cur + 1);
  });
})();
