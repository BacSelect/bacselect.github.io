(() => {
  const svg = document.querySelector('#atlasMap');
  const slider = document.querySelector('#nSlider');
  const input = document.querySelector('#nInput');
  const value = document.querySelector('#nValue');
  const readout = document.querySelector('#atlasN');
  const presets = document.querySelector('.presets');
  if (!svg || !slider || !value) return;

  const NS = 'http://www.w3.org/2000/svg';
  const W = 820;
  const H = 650;
  const PAD = 30;
  const POINTS = 1650;
  const MAX_SELECTED = 500;
  let currentN = Number(slider.value) || 100;
  let previousN = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(seed) {
    return function rand() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(0xBACC5E1);

  function gaussian() {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // An abstract, non-geographic "diversity landscape". The clustered density
  // is intentional: it makes the map feel organic while remaining clearly
  // conceptual rather than a literal geographic projection.
  const centres = [
    [0.12,0.21,.085,.10],[0.31,0.16,.11,.075],[0.50,0.20,.12,.09],[0.73,0.15,.105,.075],[0.89,0.24,.07,.11],
    [0.19,0.44,.105,.115],[0.40,0.41,.12,.12],[0.62,0.43,.12,.11],[0.82,0.47,.10,.12],
    [0.13,0.70,.08,.10],[0.31,0.73,.12,.105],[0.53,0.68,.13,.11],[0.72,0.74,.11,.105],[0.89,0.70,.07,.10],
    [0.48,0.88,.15,.055]
  ];

  const points = [];
  for (let i = 0; i < POINTS; i += 1) {
    const c = centres[Math.floor(rand() * centres.length)];
    let x = c[0] + gaussian() * c[2];
    let y = c[1] + gaussian() * c[3];
    x = Math.max(.025, Math.min(.975, x));
    y = Math.max(.035, Math.min(.965, y));
    // Add a tiny deterministic wave so the cloud is less Gaussian-looking.
    x += Math.sin((y * 11 + i * .013)) * .008;
    y += Math.cos((x * 9 + i * .017)) * .007;
    points.push({
      x: PAD + x * (W - PAD * 2),
      y: PAD + y * (H - PAD * 2),
      r: 1.05 + rand() * 1.15
    });
  }

  function distance2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  // Deterministic farthest-point ordering solely for the visual metaphor. It
  // guarantees nested selections, so N=10 is preserved inside N=50, etc.
  function buildNestedOrder() {
    let first = 0;
    let bestCentre = Infinity;
    const centre = {x: W * .51, y: H * .49};
    points.forEach((p, i) => {
      const d = distance2(p, centre);
      if (d < bestCentre) { bestCentre = d; first = i; }
    });

    const order = [first];
    const selected = new Uint8Array(points.length);
    selected[first] = 1;
    const minD = points.map(p => distance2(p, points[first]));

    while (order.length < MAX_SELECTED) {
      let best = -1;
      let bestD = -1;
      for (let i = 0; i < points.length; i += 1) {
        if (selected[i]) continue;
        if (minD[i] > bestD) { bestD = minD[i]; best = i; }
      }
      selected[best] = 1;
      order.push(best);
      const q = points[best];
      for (let i = 0; i < points.length; i += 1) {
        if (selected[i]) continue;
        const d = distance2(points[i], q);
        if (d < minD[i]) minD[i] = d;
      }
    }
    return order;
  }

  const order = buildNestedOrder();

  const contours = [
    'M44 126 C135 52 236 91 304 55 C388 10 447 77 521 62 C625 40 695 87 779 134',
    'M40 218 C116 167 197 206 259 170 C337 123 409 209 488 164 C579 112 659 198 788 177',
    'M38 316 C119 260 183 326 263 283 C359 230 431 329 516 276 C608 221 693 303 792 267',
    'M36 414 C135 355 198 435 288 386 C371 341 463 424 548 381 C647 331 716 397 791 363',
    'M58 518 C141 469 225 519 306 485 C392 449 468 533 559 484 C649 437 719 494 780 458',
    'M92 590 C173 548 260 606 343 564 C437 516 534 602 626 555 C696 520 741 549 777 532',
    'M154 42 C104 143 171 220 120 304 C74 381 141 449 112 565',
    'M322 28 C287 126 351 194 304 280 C260 360 335 430 294 612',
    'M506 35 C466 118 530 205 484 294 C444 371 513 467 478 620',
    'M686 44 C649 127 718 207 673 291 C636 362 701 447 666 600'
  ];

  function el(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, String(v)));
    return node;
  }

  // Render the full 55,306-genome foundation as one lightweight raster texture.
  // This preserves the visual scale without adding 55k SVG DOM nodes.
  const universeImage = el('image', {
    href: 'assets/atlas-universe.png', x: 0, y: 0, width: W, height: H,
    preserveAspectRatio: 'none', class: 'atlas-universe-image', 'aria-hidden': 'true'
  });
  const desc = svg.querySelector('desc');
  if (desc) desc.after(universeImage); else svg.prepend(universeImage);

  const contourLayer = el('g', {'aria-hidden':'true'});
  contours.forEach((d, i) => {
    contourLayer.append(el('path', {d, class: `atlas-contour${i % 3 === 1 ? ' secondary' : ''}`}));
  });
  // A few nested "topographic" loops around high-density areas.
  [[222,174,65,38],[222,174,42,24],[528,301,76,44],[528,301,49,28],[654,491,70,39],[654,491,44,24]].forEach(([cx,cy,rx,ry]) => {
    contourLayer.append(el('ellipse', {cx,cy,rx,ry,class:'atlas-contour secondary'}));
  });
  svg.append(contourLayer);


  const haloLayer = el('g', {'aria-hidden':'true'});
  svg.append(haloLayer);
  const selectedLayer = el('g', {'aria-hidden':'true'});
  svg.append(selectedLayer);

  function selectedRadius(n) {
    if (n <= 20) return 3.8;
    if (n <= 70) return 3.0;
    if (n <= 140) return 2.4;
    if (n <= 260) return 1.8;
    return 1.35;
  }

  function render(n) {
    n = Math.max(10, Math.min(MAX_SELECTED, Number.parseInt(n, 10) || 100));
    currentN = n;
    if (readout) readout.textContent = new Intl.NumberFormat('en').format(n);

    const frag = document.createDocumentFragment();
    const radius = selectedRadius(n);
    for (let rank = 0; rank < n; rank += 1) {
      const p = points[order[rank]];
      const node = el('circle', {
        cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: radius,
        class: `atlas-selected${rank >= previousN && !prefersReducedMotion ? ' is-new' : ''}`
      });
      if (rank >= previousN && n > previousN && !prefersReducedMotion) {
        node.style.animationDelay = `${Math.min((rank - previousN) * 2, 120)}ms`;
      }
      frag.append(node);
    }
    selectedLayer.replaceChildren(frag);

    // Coverage halos are deliberately sparse: enough to signal the map metaphor,
    // not enough to turn the hero into a technical Voronoi plot.
    const haloFrag = document.createDocumentFragment();
    const haloCount = Math.min(n, n <= 20 ? 6 : n <= 100 ? 7 : n <= 250 ? 5 : 3);
    const step = Math.max(1, Math.floor(n / haloCount));
    for (let rank = 0; rank < n; rank += step) {
      if (haloFrag.childNodes.length >= haloCount) break;
      const p = points[order[rank]];
      const haloR = Math.max(11, Math.min(31, 92 / Math.sqrt(Math.max(n, 10) / 10)));
      haloFrag.append(el('circle', {cx:p.x.toFixed(2),cy:p.y.toFixed(2),r:haloR.toFixed(1),class:'atlas-halo'}));
    }
    haloLayer.replaceChildren(haloFrag);
    previousN = n;
  }

  // app.js updates #nValue whenever N changes; observing that node lets this
  // visual layer stay synchronized without altering the validated download logic.
  new MutationObserver(() => render(value.textContent)).observe(value, {childList:true, subtree:true, characterData:true});
  slider.addEventListener('input', () => render(slider.value));
  if (input) input.addEventListener('change', () => window.setTimeout(() => render(slider.value), 0));
  if (presets) presets.addEventListener('click', () => window.setTimeout(() => render(slider.value), 0));

  render(currentN);
})();
