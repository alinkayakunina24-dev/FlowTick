// Liquid glass — recreates Figma's "Glass" effect, which CSS has no equivalent for.
//
// How it works: the element gets a copy of the background that lies behind it.
// That copy is bent by an SVG displacement filter (refraction near the edges),
// split slightly into red/green/blue (dispersion) and softened (frost).
// A thin light rim is drawn from the light angle, intensity and splay.
//
// Parameters use the same names and units as the Figma effect panel:
//   frost         blur radius at the edge (Figma "Frost")
//   frostCenter   0–1, share of the blur kept in the middle (1 = even, like Figma; 0 = sharp middle)
//   refraction    0–1 (Figma shows it as %)
//   depth         px, width of the bent band along the edge
//   dispersion    0–1, how far colors split at the edge
//   lightAngle    degrees, where the light hits the rim (0 = top, clockwise)
//   lightIntensity 0–1
//   splay         0–1, how wide the highlight spreads around the rim

window.LiquidGlass = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  let defs = null;
  let counter = 0;
  const sizes = {}; // natural sizes of backdrop pictures, by URL

  function getDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    defs = document.createElementNS(SVG_NS, "defs");
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
  }

  // Paints a w×h image pixel by pixel and returns it as a data URL.
  // For each pixel fn gets: its index, a set(i, r, g, b, a) helper, the distance to the
  // edge of the rounded rectangle (negative outside) and the values used to find the edge normal.
  function paint(w, h, radius, fn) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, h);
    const r = Math.min(radius, w / 2, h / 2);
    const set = (i, red, green, blue, alpha) => {
      img.data[i] = red;
      img.data[i + 1] = green;
      img.data[i + 2] = blue;
      img.data[i + 3] = alpha;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - w / 2;
        const py = y + 0.5 - h / 2;
        // Signed distance to a rounded rectangle (negative inside)
        const qx = Math.abs(px) - (w / 2 - r);
        const qy = Math.abs(py) - (h / 2 - r);
        const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        const inside = Math.min(Math.max(qx, qy), 0);
        const toEdge = -(outside + inside - r);
        fn((y * w + x) * 4, set, toEdge, px, py, qx, qy);
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }

  // Displacement map: red = horizontal push, green = vertical push, 50% gray = none.
  // Pixels deeper than `depth` from the edge stay neutral; the push grows toward the
  // edge along a lens-like curve, pointing along the edge normal.
  function buildMap(w, h, radius, depth) {
    return paint(w, h, radius, (i, set, toEdge, px, py, qx, qy) => {
      let nx = 0;
      let ny = 0;
      let strength = 0;
      if (toEdge >= 0 && toEdge < depth) {
        const t = 1 - toEdge / depth;
        strength = 1 - Math.sqrt(1 - t * t);
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1;
          nx = (qx / len) * Math.sign(px);
          ny = (qy / len) * Math.sign(py);
        } else if (qx > qy) {
          nx = Math.sign(px);
        } else {
          ny = Math.sign(py);
        }
      }
      set(i, 128 + 127 * nx * strength, 128 + 127 * ny * strength, 128, 255);
    });
  }

  // Frost mask: transparent in the middle, opaque at the edge — where the blur shows.
  // `center` is how much of the blur stays in the middle (0–1).
  function buildFrostMask(w, h, radius, center) {
    const half = Math.min(w, h) / 2;
    return paint(w, h, radius, (i, set, toEdge) => {
      const t = Math.min(Math.max(1 - toEdge / half, 0), 1);
      const eased = t * t * (3 - 2 * t);
      set(i, 0, 0, 0, 255 * (center + (1 - center) * eased));
    });
  }

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  // One displacement pass per color channel, so colors split at the edge (dispersion)
  // pad: extra room around the glass box where the filter still draws (a turning glass's
  // copy moves and rotates under the glass, so its edge must never be reached)
  function buildFilter(id, map, frostMask, box, opts, pad = 0) {
    const filter = el("filter", {
      id,
      filterUnits: "userSpaceOnUse",
      primitiveUnits: "userSpaceOnUse",
      x: box.x - pad,
      y: box.y - pad,
      width: box.w + 2 * pad,
      height: box.h + 2 * pad,
      "color-interpolation-filters": "sRGB",
    });

    // Frost: the blurred copy shows through the mask, so the middle stays sharp
    filter.appendChild(el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: opts.frost / 2, result: "blurred" }));
    filter.appendChild(el("feImage", {
      href: frostMask, x: box.x, y: box.y, width: box.w, height: box.h,
      preserveAspectRatio: "none", result: "frostMask",
    }));
    filter.appendChild(el("feComposite", { in: "blurred", in2: "frostMask", operator: "in", result: "blurredEdge" }));
    const merge = el("feMerge", { result: "frosted" });
    merge.appendChild(el("feMergeNode", { in: "SourceGraphic" }));
    merge.appendChild(el("feMergeNode", { in: "blurredEdge" }));
    filter.appendChild(merge);

    filter.appendChild(el("feImage", {
      href: map, x: box.x, y: box.y, width: box.w, height: box.h,
      preserveAspectRatio: "none", result: "map",
    }));

    const scale = -opts.refraction * opts.depth * 4;
    const channels = [
      ["r", 1 + opts.dispersion, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
      ["g", 1, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
      ["b", 1 - opts.dispersion, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
    ];
    for (const [name, k, matrix] of channels) {
      filter.appendChild(el("feDisplacementMap", {
        in: "frosted", in2: "map", scale: scale * k,
        xChannelSelector: "R", yChannelSelector: "G", result: `d${name}`,
      }));
      filter.appendChild(el("feColorMatrix", { in: `d${name}`, type: "matrix", values: matrix, result: name }));
    }
    filter.appendChild(el("feBlend", { in: "r", in2: "g", mode: "screen", result: "rg" }));
    filter.appendChild(el("feBlend", { in: "rg", in2: "b", mode: "screen" }));
    return filter;
  }

  // Rim highlight: brightest at lightAngle, a weaker reflection on the opposite side
  function rimGradient({ lightAngle, lightIntensity, splay }) {
    const base = 0.18;
    const spread = Math.max(10, splay * 180);
    const peak = base + lightIntensity;
    const back = base + lightIntensity * 0.4;
    const stop = (alpha, deg) => `rgba(255,255,255,${alpha.toFixed(3)}) ${deg}deg`;
    return `conic-gradient(from ${lightAngle - 180}deg, ${[
      stop(back, 0),
      stop(base, spread),
      stop(base, 180 - spread),
      stop(peak, 180),
      stop(base, 180 + spread),
      stop(base, 360 - spread),
      stop(back, 360),
    ].join(", ")})`;
  }

  // element  — the glass shape (needs a fixed size and border-radius)
  // backdrop — the element whose background the glass sits on
  function apply(element, backdrop, options) {
    const opts = Object.assign(
      { frost: 4, frostCenter: 1, refraction: 0.27, depth: 23, dispersion: 0.24, lightAngle: 101, lightIntensity: 0.4, splay: 0.32 },
      options
    );
    const id = `liquid-glass-${++counter}`;

    const lens = document.createElement("div");
    lens.className = "liquid-glass__lens";
    const copy = document.createElement("div");
    copy.className = "liquid-glass__backdrop";
    lens.appendChild(copy);
    element.prepend(lens);
    element.classList.add("liquid-glass");
    element.style.setProperty("--liquid-glass-rim", rimGradient(opts));

    const bg = getComputedStyle(backdrop);
    for (const prop of ["backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat"]) {
      copy.style[prop] = bg[prop];
    }

    let filter = null;

    // Natural size of the backdrop picture (needed by turning glass, see layout()).
    // Remembered per picture, so the next screen's glass is right from its first frame
    // (otherwise it would be drawn once without the margin and then jump).
    let natural = null;
    if (element.classList.contains("liquid-glass--turn")) {
      const url = (bg.backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1];
      if (url && sizes[url]) natural = sizes[url];
      else if (url) {
        const img = new Image();
        img.onload = () => {
          natural = sizes[url] = { w: img.naturalWidth, h: img.naturalHeight };
          layout();
        };
        img.src = url;
      }
    }

    function layout() {
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      if (!w || !h) return;

      // getBoundingClientRect includes CSS scaling of the preview frame; undo it
      const elRect = element.getBoundingClientRect();
      const bdRect = backdrop.getBoundingClientRect();
      const scale = elRect.width / w || 1;
      const left = (elRect.left - bdRect.left) / scale;
      const top = (elRect.top - bdRect.top) / scale;

      // A turning glass (.liquid-glass--turn) gets a copy with a wide margin of extra
      // picture around it, so no edge of the copy ever shows while it rotates
      const bw = backdrop.offsetWidth;
      const bh = backdrop.offsetHeight;
      const m = element.classList.contains("liquid-glass--turn") && natural ? Math.max(bw, bh) : 0;
      copy.style.width = `${bw + 2 * m}px`;
      copy.style.height = `${bh + 2 * m}px`;
      copy.style.left = `${-left - m}px`;
      copy.style.top = `${-top - m}px`;
      if (m) {
        // The backdrop's "cover, centred" picture, drawn at the same size and place
        const k = Math.max(bw / natural.w, bh / natural.h);
        const iw = natural.w * k;
        const ih = natural.h * k;
        copy.style.backgroundSize = `${iw}px ${ih}px`;
        copy.style.backgroundPosition = `${m + (bw - iw) / 2}px ${m + (bh - ih) / 2}px`;
        copy.style.backgroundRepeat = "repeat";
      }
      // Scale the copy around the glass center when the glass moves (see track())
      copy.style.transformOrigin = `${left + m + w / 2}px ${top + m + h / 2}px`;

      const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
      const map = buildMap(w, h, radius, opts.depth);
      const frostMask = buildFrostMask(w, h, radius, opts.frostCenter);
      const next = buildFilter(id, map, frostMask, { x: left + m, y: top + m, w, h }, opts, m ? Math.max(w, h) : 0);
      if (filter) filter.replaceWith(next);
      else getDefs().appendChild(next);
      filter = next;
      copy.style.filter = `url(#${id})`;
    }

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(backdrop);

    return function destroy() {
      observer.disconnect();
      if (filter) filter.remove();
    };
  }

  // Keep the background inside the glass in place while the glass itself moves.
  // frames: the glass's own animation steps [{ dx, dy, s }] (translate in px, scale);
  // the copy of the background gets the opposite movement with the same timing.
  function track(element, frames, timing) {
    const copy = element.querySelector(":scope > .liquid-glass__lens > .liquid-glass__backdrop");
    if (!copy) return;
    if (element.classList.contains("liquid-glass--turn")) {
      // A turning glass must also turn the picture around the glass's *current* centre,
      // or its view drifts away from a still glass's view of the same spot. Moving the
      // turning point with the glass (and the copy back by the same amount) does that,
      // while the picture still stays in place on the screen.
      const [ox, oy] = copy.style.transformOrigin.split(" ").map(parseFloat);
      copy.animate(
        frames.map((f) => ({
          transformOrigin: `${ox + f.dx}px ${oy + f.dy}px`,
          translate: `${-f.dx}px ${-f.dy}px`,
          scale: 1 / f.s,
        })),
        timing
      );
      return;
    }
    copy.animate(
      frames.map((f) => ({ translate: `${-f.dx / f.s}px ${-f.dy / f.s}px`, scale: 1 / f.s })),
      timing
    );
  }

  // Effect styles from the Figma file, ready to pass to apply()
  const presets = {
    // "Glass / Alpha 25". Figma blurs evenly with frost 4; here the middle stays
    // sharp and the blur builds up toward the edge (agreed on the splash screen).
    alpha25: {
      frost: 8,
      frostCenter: 0,
      refraction: 0.27,
      depth: 23,
      lightAngle: 101,
      lightIntensity: 0.4,
      dispersion: 0.24,
      splay: 0.32,
    },
  };

  return { apply, track, presets };
})();
