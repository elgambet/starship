// Interior fit-out modelled on the SpaceX/NASA references in research/screenshots:
//  - spacex-hls-airlock-view-republished: quilted white hex padding, black soft hatch in a thick white
//    padded rim, black grab bars, ceiling light cove, flush riveted panels with a display + cubby, black floor.
//  - nasa-2025-airlock-test: dark bolted outer hatch rim, hanging strap loops, black ladder rack, extinguisher.
//  - nasa-spacex-cabin-1-2026-main: narrow padded berth, wood ceiling panel with light cove, glowing rounded
//    end frame, beige strapped bed.
//  - spacex-hls-cabin-concept: polished flat-bar rails, curved wood benches on dark frames, white seats on
//    dark tripods, suspended screens, a dark light strip with UI icons, charcoal floor with panel seams.
// All dimensions are estimates for this study. Every solid element goes through box()/proxy() so the
// first-person collision world sees it.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildInterior(ctx) {
  const { D, M, groups, box, rod, mesh, label, polar, solids, renderer } = ctx;
  const A = D.decks.value[0], B = D.decks.value[1], F = D.decks.value[2], H = D.decks.value[3];
  const CLEAR = D.deckSpacing.value - D.floorThickness.value;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const root = groups.interior;

  // ---------------------------------------------------------------- textures
  function canvas(w, h, draw, color = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t;
  }
  function hexPath(ctx2, cx, cy, r) { ctx2.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); k ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y); } ctx2.closePath(); }
  // pointy-top hex quilt; one tile = 2 columns x 2 rows of 0.55 m cells (1.1 m x 0.953 m)
  const HEX = { w: 1.1, h: 0.953 };
  function hexQuilt(kind) {
    return canvas(1024, 888, (g, W, Hh) => {
      g.fillStyle = kind === 'bump' ? '#202020' : '#cfd1cf'; g.fillRect(0, 0, W, Hh);
      const cw = W / 2, r = cw / Math.sqrt(3), rowH = r * 1.5;
      for (let row = -1; row <= 3; row++) for (let col = -1; col <= 2; col++) {
        const cx = col * cw + (row & 1 ? cw / 2 : 0), cy = row * rowH;
        const grad = g.createRadialGradient(cx - r * .15, cy - r * .2, r * .1, cx, cy, r * 1.02);
        if (kind === 'bump') { grad.addColorStop(0, '#ffffff'); grad.addColorStop(.6, '#d8d8d8'); grad.addColorStop(1, '#3a3a3a'); }
        else { grad.addColorStop(0, '#fbfbf9'); grad.addColorStop(.7, '#eeeeec'); grad.addColorStop(1, '#d4d6d4'); }
        hexPath(g, cx, cy, r * .985); g.fillStyle = grad; g.fill();
        if (kind !== 'bump') { g.setLineDash([5, 5]); g.strokeStyle = 'rgba(150,152,150,.45)'; g.lineWidth = 1.5; hexPath(g, cx, cy, r * .9); g.stroke(); g.setLineDash([]); }
      }
    }, kind !== 'bump');
  }
  const hexMap = hexQuilt('color'), hexBump = hexQuilt('bump');
  // flush white panels with seams and rivet strips (1.2 m tile)
  function rivetPanels(kind) {
    return canvas(1024, 1024, (g, W) => {
      g.fillStyle = kind === 'bump' ? '#808080' : '#ecedec'; g.fillRect(0, 0, W, W);
      const seam = kind === 'bump' ? '#404040' : '#c3c6c6';
      g.fillStyle = seam; g.fillRect(0, 0, W, 3); g.fillRect(0, W / 2, W, 2); g.fillRect(0, 0, 3, W); g.fillRect(W * .62, 0, 2, W);
      for (const x of [14, W * .62 + 14]) for (let y = 12; y < W; y += 34) { g.beginPath(); g.arc(x, y, kind === 'bump' ? 5 : 4, 0, Math.PI * 2); g.fillStyle = kind === 'bump' ? '#2a2a2a' : '#8e9394'; g.fill(); }
      for (let x = 30; x < W; x += 60) { g.beginPath(); g.arc(x, 10, 2.5, 0, Math.PI * 2); g.fillStyle = kind === 'bump' ? '#555' : '#a9adae'; g.fill(); }
    }, kind !== 'bump');
  }
  const panelMap = rivetPanels('color'), panelBump = rivetPanels('bump');
  const grille = canvas(256, 128, (g, W, Hh) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#2b2e30'; for (let y = 10; y < Hh - 6; y += 9) for (let x = 10 + ((y / 9) % 2) * 4; x < W - 8; x += 9) { g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); } });
  const wood = canvas(1024, 256, (g, W, Hh) => {
    g.fillStyle = '#6b5a4a'; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 140; i++) { const y = Math.random() * Hh, a = .05 + Math.random() * .12; g.strokeStyle = `rgba(${Math.random() < .5 ? '40,30,22' : '150,128,104'},${a})`; g.lineWidth = .6 + Math.random() * 1.6; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 64) g.lineTo(x, y + Math.sin(x * .01 + i) * 3); g.stroke(); }
    g.fillStyle = 'rgba(20,18,16,.85)'; for (let x = 60; x < W; x += 170) g.fillRect(x, Hh * .3, 40, 4);
  });
  const lightWood = canvas(1024, 512, (g, W, Hh) => {
    g.fillStyle = '#c8955c'; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 180; i++) { const x = Math.random() * W, a = .05 + Math.random() * .1; g.strokeStyle = `rgba(${Math.random() < .5 ? '120,74,34' : '232,190,140'},${a})`; g.lineWidth = .8 + Math.random() * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= Hh; y += 32) g.lineTo(x + Math.sin(y * .02 + i) * 6, y); g.stroke(); }
  });
  function screenUI(kind) {
    return canvas(512, 300, (g, W, Hh) => {
      g.fillStyle = '#05090d'; g.fillRect(0, 0, W, Hh);
      if (kind === 'status') {
        const sky = g.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, '#0b0f14'); sky.addColorStop(.62, '#11161c'); sky.addColorStop(.63, '#6f7880'); sky.addColorStop(1, '#3e454b'); g.fillStyle = sky; g.fillRect(14, 14, W - 28, Hh - 28);
        g.fillStyle = '#dfe3e4'; g.beginPath(); g.moveTo(W / 2 - 14, 210); g.lineTo(W / 2 - 14, 80); g.quadraticCurveTo(W / 2, 40, W / 2 + 14, 80); g.lineTo(W / 2 + 14, 210); g.fill(); g.fillStyle = '#1b2228'; g.fillRect(W / 2 - 14, 98, 28, 26);
        g.fillStyle = '#9fb7c9'; g.beginPath(); g.arc(W - 70, 60, 10, 0, Math.PI * 2); g.fill();
      } else {
        g.strokeStyle = '#123d4f'; g.lineWidth = 1; for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
        g.strokeStyle = '#38c6f0'; g.lineWidth = 2.5; g.beginPath(); for (let x = 20; x < W * .6; x += 6) g.lineTo(x, 180 - Math.sin(x * .03) * 40 - x * .1); g.stroke();
        for (const [x, y, r] of [[W * .76, 90, 42], [W * .76, 210, 30]]) { g.strokeStyle = '#1b3a48'; g.lineWidth = 7; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#41c8f5'; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, Math.PI * .9); g.stroke(); }
        g.fillStyle = '#2b7fa0'; for (let i = 0; i < 6; i++) g.fillRect(20 + i * 46, 24, 36, 10);
      }
    });
  }
  const statusScreen = screenUI('status'), dashScreen = screenUI('dash');
  const iconStrip = canvas(2048, 64, (g, W, Hh) => {
    g.fillStyle = '#0a0d10'; g.fillRect(0, 0, W, Hh);
    for (let x = 80; x < W; x += 150) { g.strokeStyle = '#2fa6d8'; g.lineWidth = 3; g.beginPath(); g.arc(x, Hh / 2, 13, -1.3, 4.4); g.stroke(); g.fillStyle = '#9fe3ff'; g.fillRect(x + 32, Hh / 2 - 2, 26, 4); g.fillRect(x + 66, Hh / 2 - 2, 10, 4); }
  });

  // ---------------------------------------------------------------- materials
  const tex = (t, rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
  const MAT = {
    pad: (w, h) => new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex(hexMap, w / HEX.w, h / HEX.h), bumpMap: tex(hexBump, w / HEX.w, h / HEX.h), bumpScale: 2.2, roughness: .62, metalness: 0 }),
    panel: (w, h) => new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex(panelMap, w / 1.2, h / 1.2), bumpMap: tex(panelBump, w / 1.2, h / 1.2), bumpScale: .6, roughness: .5, metalness: .02 }),
    leather: new THREE.MeshPhysicalMaterial({ color: '#f1f1ef', roughness: .45, metalness: 0, clearcoat: .25, clearcoatRoughness: .5, sheen: .4, sheenColor: new THREE.Color('#ffffff') }),
    hatchFabric: new THREE.MeshPhysicalMaterial({ color: '#141618', roughness: .7, metalness: 0, sheen: .6, sheenColor: new THREE.Color('#3a3f44'), sheenRoughness: .6 }),
    darkMetal: new THREE.MeshPhysicalMaterial({ color: '#25292d', roughness: .42, metalness: .65, clearcoat: .2 }),
    blackMatte: new THREE.MeshStandardMaterial({ color: '#0f1113', roughness: .75, metalness: .2 }),
    steel: new THREE.MeshPhysicalMaterial({ color: '#cfd4d7', roughness: .18, metalness: 1, clearcoat: .2 }),
    bolt: new THREE.MeshStandardMaterial({ color: '#a7aeb2', roughness: .3, metalness: .95 }),
    wood: new THREE.MeshPhysicalMaterial({ map: wood, roughness: .5, metalness: 0, clearcoat: .5, clearcoatRoughness: .35 }),
    ceilingWood: new THREE.MeshStandardMaterial({ map: lightWood, roughness: .6 }),
    beige: new THREE.MeshStandardMaterial({ color: '#d9ccb2', roughness: .9 }),
    strap: new THREE.MeshStandardMaterial({ color: '#8c7a5c', roughness: .8 }),
    blueStrap: new THREE.MeshStandardMaterial({ color: '#3f5bd0', roughness: .7 }),
    red: new THREE.MeshPhysicalMaterial({ color: '#b3171d', roughness: .35, clearcoat: .6 }),
    glow: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f4f8ff', emissiveIntensity: 2.2, roughness: .4 }),
    warmGlow: new THREE.MeshStandardMaterial({ color: '#fff7ea', emissive: '#ffe9c8', emissiveIntensity: 1.8, roughness: .4 }),
    grille: new THREE.MeshStandardMaterial({ map: grille, roughness: .5, metalness: .1 }),
    status: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: statusScreen, emissiveIntensity: 1.1, roughness: .15 }),
    dash: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: dashScreen, emissiveIntensity: 1.1, roughness: .15 }),
    icons: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: iconStrip, emissiveIntensity: 1, roughness: .3, side: THREE.DoubleSide }),
    acrylic: new THREE.MeshPhysicalMaterial({ color: '#e8f4f8', roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false }),
    seatShell: new THREE.MeshPhysicalMaterial({ color: '#e6e7e6', roughness: .35, metalness: .05, clearcoat: .6, clearcoatRoughness: .25 }),
    seatPad: new THREE.MeshStandardMaterial({ color: '#4a4f54', roughness: .85 }),
  };

  // ---------------------------------------------------------------- helpers
  const v3 = (...a) => new THREE.Vector3(...a);
  function proxy(w, h, d, parent, x, y, z, ry = 0) { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); solids.push({ mesh: o, w, h, d }); return o; }
  function rbox(w, h, d, x, y, z, material, parent = root, radius = .02, solid = true) {
    const o = mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, Math.min(w, h, d) * .45)), material, parent, x, y, z);
    o.castShadow = o.receiveShadow = true; if (solid) solids.push({ mesh: o, w, h, d }); return o;
  }
  function roundedRectShape(w, h, r, cx = 0, cy = 0) { const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
  function roundedRectPath(w, h, r, cx = 0, cy = 0) { const p = new THREE.Path(), x = cx - w / 2, y = cy - h / 2; p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h); p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r); p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); return p; }
  function extrude(shape, depth, bevel = .02) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 }); g.translate(0, 0, -depth / 2); return g; }
  // flat-bar rail swept along points (a polished steel ribbon, as in the cabin render)
  function flatBar(points, width = .018, height = .06, material = MAT.steel, parent = root) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => v3(...p)));
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, -height / 2); shape.lineTo(width / 2, -height / 2); shape.lineTo(width / 2, height / 2); shape.lineTo(-width / 2, height / 2); shape.closePath();
    const o = mesh(new THREE.ExtrudeGeometry(shape, { steps: Math.max(12, points.length * 3), bevelEnabled: false, extrudePath: curve }), material, parent); o.castShadow = true; return o;
  }
  function post(x, y0, y1, z, ry = 0, material = MAT.steel, parent = root, w = .018, d = .05) { const o = mesh(new THREE.BoxGeometry(w, y1 - y0, d), material, parent, x, (y0 + y1) / 2, z); o.rotation.y = ry; o.castShadow = true; return o; }
  function screen(w, h, material, parent, x, y, z, ry = 0, bezel = .025) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    rbox(w + bezel * 2, h + bezel * 2, .03, 0, 0, 0, MAT.blackMatte, g, .01, false);
    mesh(new THREE.PlaneGeometry(w, h), material, g, 0, 0, .0161); return g;
  }
  function grillePanel(w, h, parent, x, y, z, ry = 0) { const o = mesh(new THREE.PlaneGeometry(w, h), MAT.grille, parent, x, y, z); o.rotation.y = ry; return o; }

  // ================================================================ AIRLOCKS (Deck A)
  // Each airlock: 2.0 m x 2.83 m clear, full-height walls, hatches at z = ±1.415 opening into the airlock.
  function airlock(cx, name) {
    const g = new THREE.Group(); g.position.set(cx, A, 0); root.add(g);
    const out = Math.sign(cx);                                   // +1 hull side for airlock 01
    // side walls: hex padding inside, riveted panel on the hall side
    for (const sx of [-1, 1]) { const w = rbox(.1, CLEAR, 2.93, sx * 1.04, CLEAR / 2, 0, MAT.pad(2.93, CLEAR), g, .02); }
    // ceiling + light coves
    rbox(2.0, .05, 2.83, 0, 2.32, 0, MAT.panel(2, 2.8), g, .02, false);
    for (const sx of [-1, 1]) rbox(.05, .05, 2.6, sx * .93, 2.27, 0, MAT.glow, g, .02, false);
    const lamp = new THREE.PointLight('#f2f6ff', 4, 4.5, 1.6); lamp.position.set(0, 2.1, 0); g.add(lamp);
    // end walls with hatches
    for (const zs of [-1, 1]) {
      const z = zs * 1.415, inward = -zs, outer = zs < 0;
      // padded wall around a 1.56 x 2.44 rim
      for (const sx of [-1, 1]) rbox(.27, CLEAR, .1, sx * .905, CLEAR / 2, z, MAT.pad(.27, CLEAR), g, .02);
      rbox(2.08, CLEAR - 2.46, .1, 0, 2.46 + (CLEAR - 2.46) / 2, z, MAT.pad(2.08, CLEAR - 2.46), g, .02);
      // airlock-side rim: thick white padded rounded frame
      const rimShape = roundedRectShape(1.56, 2.46, .34, 0, 1.23); rimShape.holes.push(roundedRectPath(1.2, 2.17, .22, 0, 1.135));
      const rim = mesh(extrude(rimShape, .1, .045), MAT.leather, g, 0, 0, z + inward * .07); rim.castShadow = true;
      // outside rim: dark metal with a ring of bolts (as in the full-scale test article)
      const dark = mesh(extrude(rimShape, .05, .01), MAT.darkMetal, g, 0, 0, z - inward * .07);
      const bolts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .018, .02, 10), MAT.bolt, 26); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), Math.PI / 2);
      for (let k = 0; k < 26; k++) { const t = k / 26, per = 2 * (1.38 + 2.28); let d = t * per, px, py; if (d < 1.38) { px = -.69 + d; py = .04; } else if ((d -= 1.38) < 2.28) { px = .69; py = .04 + d; } else if ((d -= 2.28) < 1.38) { px = .69 - d; py = 2.32; } else { d -= 1.38; px = -.69; py = 2.32 - d; } m4.compose(v3(px, py, z - inward * .1), q, v3(1, 1, 1)); bolts.setMatrixAt(k, m4); }
      g.add(bolts);
      // collision for the rim jambs and header (threshold left walkable)
      for (const sx of [-1, 1]) proxy(.18, 2.46, .2, g, sx * .69, 1.23, z);
      proxy(1.56, .3, .2, g, 0, 2.31, z);
      // grab bars on both sides of the hatch (airlock side)
      for (const sx of [-1, 1]) { rbox(.035, .7, .035, sx * .86, 1.25, z + inward * .16, MAT.blackMatte, g, .015, false); for (const yy of [.92, 1.58]) rbox(.03, .03, .1, sx * .86, yy, z + inward * .12, MAT.blackMatte, g, .01, false); }
      // soft black hatch, hinged on the hull side, swung ~95° open out of the airlock
      const hinge = new THREE.Group(), dir = -out, away = -inward; hinge.position.set(out * .66, .06, z + away * .15); hinge.rotation.y = -away * dir * Math.PI * .53; g.add(hinge);
      const doorShape = roundedRectShape(1.24, 2.16, .24, dir * .62, 1.08);
      const door = mesh(extrude(doorShape, .07, .03), MAT.hatchFabric, hinge, 0, 0, 0); door.castShadow = true;
      for (const face of [-1, 1]) {
        mesh(new THREE.CylinderGeometry(.22, .22, .012, 40), MAT.hatchFabric, hinge, dir * .62, 1.0, face * .055).rotation.x = Math.PI / 2;
        for (const sx of [-.3, .3]) rbox(.025, .32, .012, dir * .62 + sx, 1.75, face * .055, MAT.blackMatte, hinge, .006, false);
      }
      proxy(1.24, 2.16, .1, hinge, dir * .62, 1.08, 0);
      // light ladder of webbing loops hanging from the ceiling (test article)
      if (!outer) for (const [lx, lz] of [[-.35, -.4], [.3, .5]]) { const pts = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2; pts.push([lx + Math.sin(a) * .07, 2.3 - .25 - Math.cos(a) * .22 + .22, lz]); } ctx.tube(pts, .012, MAT.blueStrap, g); rod([lx, 2.3, lz], [lx, 2.08, lz], .01, MAT.blueStrap, g); }
    }
    // inboard wall: flush riveted panel with display, button block, cubby and two grilles
    const inb = -out, wx = inb * .985;
    const pane = rbox(.03, 2.2, 1.5, wx, 1.12, -.35, MAT.panel(1.5, 2.2), g, .01, false);
    const disp = screen(.42, .26, MAT.status, g, wx - inb * .02, 1.5, -.35, inb > 0 ? -Math.PI / 2 : Math.PI / 2);
    const keys = new THREE.Group(); keys.position.set(wx - inb * .025, 1.28, -.35); keys.rotation.y = inb > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(keys);
    rbox(.6, .14, .02, 0, 0, 0, MAT.blackMatte, keys, .01, false);
    for (let k = 0; k < 8; k++) rbox(.045, .035, .02, -.26 + k * .075, 0, .012, k > 4 ? MAT.red : MAT.darkMetal, keys, .006, false);
    const cubby = rbox(.06, .2, .5, wx - inb * .02, 1.0, -.35, MAT.blackMatte, g, .01, false);
    grillePanel(.4, .12, g, wx - inb * .02, 2.05, -.35, inb > 0 ? -Math.PI / 2 : Math.PI / 2);
    grillePanel(.36, .1, g, wx - inb * .02, .18, -.35, inb > 0 ? -Math.PI / 2 : Math.PI / 2);
    // fire extinguisher and black ladder rack on the outboard wall
    const ow = out * .97;
    mesh(new THREE.CylinderGeometry(.065, .065, .42, 20), MAT.red, g, ow - out * .07, 1.0, .9).castShadow = true;
    mesh(new THREE.CylinderGeometry(.02, .03, .08, 12), MAT.blackMatte, g, ow - out * .07, 1.25, .9);
    for (const zz of [-.15, .2]) rbox(.03, 2.1, .03, ow - out * .04, 1.1, zz, MAT.blackMatte, g, .01, false);
    for (let k = 0; k < 7; k++) rbox(.03, .025, .36, ow - out * .04, .3 + k * .28, .025, MAT.blackMatte, g, .01, false);
    // black floor (seams come from the floor shader)
    rbox(1.96, .03, 2.8, 0, -.005, 0, M.floor, g, .01, false);
    label(name, cx, A + 2.78, 0, .48);
  }
  airlock(2.55, 'AIRLOCK 01'); airlock(-2.55, 'AIRLOCK 02');
  // pressure-boundary infill between the airlocks, full height, riveted panels
  for (const [x, w] of [[-3.84, .62], [0, 3.05], [3.84, .62]]) rbox(w, CLEAR, .1, x, A + CLEAR / 2, -1.46, MAT.panel(w, CLEAR), root, .02);
  // garage: suit lockers, gate frame, cargo crates
  for (const x of [-3.5, 3.5]) { const l = rbox(.42, 2.3, .6, x, A + 1.15, -2.2, MAT.panel(.6, 2.3), root, .02); for (const y of [.55, 1.35]) rbox(.02, .04, .3, x - Math.sign(x) * .22, A + y, -2.2, MAT.blackMatte, root, .01, false); }
  for (const x of [-1.5, 1.5]) rbox(.12, 2.25, .16, x, A + 1.125, -4.12, MAT.darkMetal, root, .02);
  rbox(3.1, .16, .16, 0, A + 2.25, -4.12, MAT.darkMetal, root, .02);
  for (const [x, z] of [[-2.6, -3.0], [2.7, -3.1]]) { rbox(.7, .5, .5, x, A + .25, z, MAT.seatShell, root, .04); rbox(.71, .07, .51, x, A + .38, z, new THREE.MeshStandardMaterial({ color: '#2f57c9', roughness: .6 }), root, .01, false); }
  label('GARAGE → LIFT', 0, A + 2.4, -3.7, .65);

  // ================================================================ DECK B
  // Hygiene compartment: full-height walls, 1 m door, toilet, wash station, mirror.
  {
    const x0 = 1.85, x1 = 3.5, z0 = -2.15, z1 = -.55, h = CLEAR;
    rbox(.08, h, z1 - z0, x1, B + h / 2, (z0 + z1) / 2, MAT.panel(z1 - z0, h));
    for (const z of [z0, z1]) rbox(x1 - x0, h, .08, (x0 + x1) / 2, B + h / 2, z, MAT.panel(x1 - x0, h));
    for (const z of [z0 + .155, z1 - .155]) rbox(.08, h, .31, x0, B + h / 2, z, MAT.panel(.31, h));
    rbox(.08, h - 2.12, 1.0, x0, B + 2.12 + (h - 2.12) / 2, (z0 + z1) / 2, MAT.panel(1, h - 2.12));
    // sliding door parked half open
    rbox(.03, 2.05, .55, x0 - .07, B + 1.05, z1 - .4, MAT.leather, root, .02);
    // toilet (UWMS-like)
    mesh(new THREE.CylinderGeometry(.19, .23, .42, 32), MAT.seatShell, root, 3.05, B + .21, -1.75).castShadow = true;
    const seat = mesh(new THREE.TorusGeometry(.16, .035, 12, 32), MAT.blackMatte, root, 3.05, B + .44, -1.75); seat.rotation.x = Math.PI / 2;
    proxy(.46, .44, .46, root, 3.05, B + .22, -1.75);
    ctx.tube([[3.2, B + .6, -1.6], [3.35, B + .9, -1.4], [3.42, B + 1.2, -1.2]], .03, MAT.darkMetal);
    mesh(new THREE.ConeGeometry(.07, .16, 20, 1, true), MAT.seatShell, root, 3.42, B + 1.3, -1.2);
    // wash station + mirror on the hull-side wall
    rbox(.32, .5, .62, x1 - .2, B + 1.0, -1.05, MAT.seatShell, root, .05);
    mesh(new THREE.PlaneGeometry(.6, .55), new THREE.MeshPhysicalMaterial({ color: '#dfe6ea', metalness: 1, roughness: .04 }), root, x1 - .045, B + 1.65, -1.05).rotation.y = -Math.PI / 2;
    rbox(.05, .05, 1.4, x1 - .1, B + h - .12, (z0 + z1) / 2, MAT.glow, root, .02, false);
    label('HYGIENE', 2.7, B + 2.55, -1.35, .48);
  }
  // Science bench: base cabinet with drawers, composite worktop, glovebox, display, wall cabinet.
  {
    const cx = 1.2, cz = 3.05, w = 2.1;
    rbox(w, .8, .58, cx, B + .44, cz + .02, MAT.panel(w, .8));
    rbox(w - .04, .08, .5, cx, B + .04, cz + .05, MAT.blackMatte, root, .01, false);
    for (let k = 0; k < 3; k++) for (let r = 0; r < 2; r++) { const x = cx - w / 2 + .36 + k * .69; rbox(.64, .34, .02, x, B + .27 + r * .38, cz - .28, MAT.seatShell, root, .015, false); rbox(.3, .02, .02, x, B + .4 + r * .38, cz - .3, MAT.blackMatte, root, .006, false); }
    rbox(w + .1, .04, .64, cx, B + .86, cz, new THREE.MeshPhysicalMaterial({ color: '#d7dbdc', roughness: .35, clearcoat: .4 }));
    // glovebox
    const gb = new THREE.Group(); gb.position.set(cx + .35, B + .88, cz + .05); root.add(gb);
    rbox(.86, .03, .5, 0, .015, 0, MAT.darkMetal, gb, .01, false);
    mesh(new THREE.BoxGeometry(.84, .46, .48), MAT.acrylic, gb, 0, .26, 0);
    for (const e of [[0, .49, 0, .86, .02, .5], [-.42, .26, -.24, .02, .46, .02], [.42, .26, -.24, .02, .46, .02], [-.42, .26, .24, .02, .46, .02], [.42, .26, .24, .02, .46, .02]]) mesh(new THREE.BoxGeometry(e[3], e[4], e[5]), MAT.darkMetal, gb, e[0], e[1], e[2]);
    for (const sx of [-.2, .2]) { const ring = mesh(new THREE.TorusGeometry(.085, .018, 12, 32), MAT.blackMatte, gb, sx, .25, -.245); mesh(new THREE.CircleGeometry(.085, 32), MAT.hatchFabric, gb, sx, .25, -.243).rotation.y = Math.PI; }
    proxy(.86, .5, .5, gb, 0, .25, 0);
    screen(.5, .3, MAT.dash, root, cx - .6, B + 1.32, cz + .22, Math.PI);
    rod([cx - .6, B + .88, cz + .25], [cx - .6, B + 1.15, cz + .25], .02, MAT.darkMetal);
    rbox(1.6, .55, .3, cx - .1, B + 2.05, cz + .42, MAT.panel(1.6, .55), root, .03);
    for (let k = 0; k < 3; k++) rbox(.02, .48, .015, cx - .63 + k * .53, B + 2.05, cz + .265, MAT.blackMatte, root, .005, false);
    rbox(1.5, .03, .04, cx - .1, B + 1.76, cz + .3, MAT.glow, root, .01, false);
    label('SCIENCE', 1.2, B + 2.55, 3.3, .45);
  }
  // Storage: locker bank of two full-height columns with numbered doors.
  {
    const num = n => canvas(128, 64, (g2, W, Hh) => { g2.fillStyle = '#ffffff'; g2.fillRect(0, 0, W, Hh); g2.fillStyle = '#5c6366'; g2.font = '600 34px Space Grotesk, sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(String(n).padStart(2, '0'), W / 2, Hh / 2); });
    let n = 1;
    for (const z of [-1.45, -.72]) {
      rbox(.56, 2.3, .7, -3.32, B + 1.15, z, MAT.panel(.7, 2.3), root, .02);
      for (let r = 0; r < 4; r++) { const y = B + .32 + r * .54; rbox(.02, .5, .64, -3.03, y, z, MAT.seatShell, root, .015, false); rbox(.02, .03, .26, -3.01, y - .12, z, MAT.blackMatte, root, .006, false); const lab = mesh(new THREE.PlaneGeometry(.12, .06), new THREE.MeshStandardMaterial({ map: num(n++), roughness: .6 }), root, -3.018, y + .15, z - .2); lab.rotation.y = Math.PI / 2; }
    }
    label('STORAGE', -3.1, B + 2.55, -1.1, .47);
  }
  // Exercise: resistive device on a platform with uprights, crossbar, canisters and lift bar.
  {
    const ex = new THREE.Group(); ex.position.set(-.1, B, -3.35); root.add(ex);
    rbox(1.4, .08, .9, 0, .04, 0, M.tread, ex, .02);
    for (const sx of [-.55, .55]) { rbox(.1, 2.0, .1, sx, 1.08, -.36, MAT.darkMetal, ex, .02); mesh(new THREE.CylinderGeometry(.1, .1, .58, 24), MAT.steel, ex, sx * 1.35, .37, -.25).castShadow = true; proxy(.22, .6, .22, ex, sx * 1.35, .37, -.25); }
    rbox(1.2, .1, .1, 0, 2.06, -.36, MAT.darkMetal, ex, .02);
    rod([-.7, 1.2, .02], [.7, 1.2, .02], .022, MAT.steel, ex);
    for (const sx of [-.58, .58]) { mesh(new THREE.CylinderGeometry(.028, .028, .14, 16), MAT.blackMatte, ex, sx, 1.2, .02).rotation.z = Math.PI / 2; rod([sx * 1.18, 1.2, .02], [sx * 1.35, .66, -.25], .006, MAT.blackMatte, ex); }
    const fly = mesh(new THREE.CylinderGeometry(.24, .24, .1, 32), MAT.seatShell, ex, 0, .34, -.38); fly.rotation.x = Math.PI / 2;
    for (const sx of [-.2, .2]) { const loop = mesh(new THREE.TorusGeometry(.09, .015, 8, 20, Math.PI), MAT.blackMatte, ex, sx, .08, .15); }
    label('EXERCISE', -.1, B + 2.55, -3.5, .48);
  }

  // ================================================================ DECK C (control deck)
  // Seats: white shells on dark tripods, a shared bar carrying the displays, as in the cabin render.
  for (const deg of [-36, -12, 12, 36]) {
    const a = deg * Math.PI / 180, g = new THREE.Group(); g.position.set(...polar(2.95, a, F)); g.rotation.y = a; root.add(g);
    const shellShape = roundedRectShape(.62, 1.2, .16, 0, 0);
    const back = mesh(extrude(shellShape, .12, .04), MAT.seatShell, g, 0, 1.3, -.32); back.rotation.x = -.18; back.castShadow = true;
    rbox(.5, .9, .05, 0, 1.25, -.24, MAT.seatPad, g, .04, false).rotation.x = -.18;
    for (const sx of [-1, 1]) rbox(.09, .3, .34, sx * .33, 1.78, -.29, MAT.seatShell, g, .04, false);
    rbox(.58, .1, .56, 0, .74, -.02, MAT.seatShell, g, .05, false); rbox(.5, .07, .48, 0, .8, -.02, MAT.seatPad, g, .03, false);
    for (const sx of [-1, 1]) rbox(.07, .07, .42, sx * .33, .98, -.05, MAT.seatShell, g, .03, false);
    for (const [lx, lz] of [[-.26, .22], [.26, .22], [0, -.36]]) ctx.beam([lx * .3, .7, lz * .3], [lx, 0, lz], .045, .045, MAT.darkMetal, g);
    proxy(.66, 1.95, .7, g, 0, .98, -.05);
  }
  { const pts = []; for (let k = 0; k <= 24; k++) { const a = (-50 + k * 100 / 24) * Math.PI / 180; pts.push(polar(3.72, a, F + 1.55)); } ctx.tube(pts, .025, MAT.darkMetal); }
  for (const deg of [-36, -12, 12, 36]) { const a = deg * Math.PI / 180, p = polar(3.68, a, F + 1.32); screen(.7, .4, MAT.dash, root, p[0], p[1], p[2], a + Math.PI); const s = polar(3.7, a, F + 1.55); rod(s, [s[0], F + 1.55 - .02, s[2]], .01); }
  // curved wood benches on dark frames with padded cubbies (opposite the windows)
  {
    const a0 = Math.PI - .95, a1 = Math.PI + .95, ri = 3.15, ro = 3.75;
    const top = new THREE.Shape(); top.absarc(0, 0, ro, a0 - Math.PI / 2, a1 - Math.PI / 2, false); top.absarc(0, 0, ri, a1 - Math.PI / 2, a0 - Math.PI / 2, true);
    const g = new THREE.ExtrudeGeometry(top, { depth: .045, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2, curveSegments: 48 }); g.rotateX(-Math.PI / 2);
    const bench = mesh(g, MAT.wood, root, 0, F + .86, 0); bench.castShadow = bench.receiveShadow = true;
    for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; for (const r of [ri + .05, ro - .05]) { const p = polar(r, a, F); rbox(.04, .86, .04, p[0], F + .43, p[2], MAT.darkMetal, root, .01, false); } const p = polar((ri + ro) / 2, a, F + .3); const shelf = rbox(.04, .04, ro - ri, p[0], p[1], p[2], MAT.darkMetal, root, .01, false); shelf.rotation.y = a; }
    for (let k = 0; k < 6; k++) { const a = a0 + (a1 - a0) * (k + .5) / 6, p = polar((ri + ro) / 2 + .05, a, F + .58); const cub = rbox(.62, .44, .5, p[0], p[1], p[2], MAT.seatPad, root, .04, false); cub.rotation.y = a; }
    for (let k = 0; k < 6; k++) { const a = a0 + (a1 - a0) * (k + .5) / 6, p = polar((ri + ro) / 2, a, F + .45); proxy(.7, .9, ro - ri, root, p[0], p[1], p[2], a); }
    // dark light strip with UI icons above the benches
    const strip = mesh(new THREE.CylinderGeometry(4.16, 4.16, .1, 64, 1, true, a0, a1 - a0), MAT.icons, root, 0, F + 2.05, 0);
    // FIRE access panel
    const fp = polar(4.13, Math.PI + 1.25, F + 1.4); const fire = rbox(.3, .42, .03, fp[0], fp[1], fp[2], MAT.seatShell, root, .03, false); fire.rotation.y = Math.PI + 1.25;
  }
  label('CONTROL DECK', 0, F + 2.45, 3.3, .55);

  // ================================================================ DECK D (habitation, in the nose base)
  // Berth pods after the Cabin 1 build: padded white walls, wood ceiling in a light cove, glowing rounded end frame.
  for (const [i, deg] of [50, 130, 230, 310].entries()) {
    const a = deg * Math.PI / 180, g = new THREE.Group(); g.position.set(Math.sin(a) * 3.3, H, Math.cos(a) * 3.3); g.rotation.y = a; root.add(g);
    const ph = 2.2;
    // side walls (vertical padded panels) and front wall with a 1.2 m entrance
    for (const sx of [-1, 1]) { rbox(.08, ph, 1.15, sx * 1.04, ph / 2, -.36, MAT.leather, g, .03); for (let k = 0; k < 3; k++) rbox(.012, ph - .1, .01, sx * .995, ph / 2, -.75 + k * .38, MAT.seatShell, g, .004, false); }
    for (const sx of [-1, 1]) rbox(.42, ph, .08, sx * .82, ph / 2, -.93, MAT.leather, g, .03);
    rbox(1.2, .3, .08, 0, ph - .15, -.93, MAT.leather, g, .03);
    // ceiling: wood panel inside a glowing cove
    rbox(2.1, .05, 1.2, 0, ph + .02, -.36, MAT.seatShell, g, .02, false);
    rbox(1.3, .02, .7, 0, ph - .02, -.36, MAT.ceilingWood, g, .01, false);
    for (const sx of [-1, 1]) rbox(.03, .02, .78, sx * .7, ph - .03, -.36, MAT.warmGlow, g, .01, false);
    // glowing rounded frame on the end (hull) side
    const frameShape = roundedRectShape(1.2, .9, .16, 0, 0); frameShape.holes.push(roundedRectPath(1.08, .78, .12, 0, 0));
    mesh(extrude(frameShape, .03, .01), MAT.warmGlow, g, 0, 1.35, .2);
    rbox(1.1, .8, .02, 0, 1.35, .22, MAT.leather, g, .05, false);
    const light = new THREE.PointLight('#ffe8c8', 1.6, 2.6, 1.8); light.position.set(0, 1.6, -.2); g.add(light);
    // strapped beige bed
    rbox(1.9, .34, .8, 0, .27, .02, MAT.seatShell, g, .04);
    rbox(1.84, .1, .74, 0, .49, .02, MAT.beige, g, .05, false);
    for (const sx of [-.55, 0, .55]) { rbox(.05, .012, .76, sx, .545, .02, MAT.strap, g, .004, false); for (const sz of [-1, 1]) mesh(new THREE.TorusGeometry(.03, .008, 6, 12), MAT.darkMetal, g, sx, .52, .02 + sz * .38); }
    rbox(.4, .08, .5, -.7, .58, .02, MAT.beige, g, .04, false);
    label(`BERTH 0${i + 1}`, ...polar(3.7, a, H + 2.5), .43);
  }
  // galley: base cabinet with doors, worktop, food warmer, water dispenser, table with pedestal and two stools
  {
    const z = -3.2;
    rbox(1.8, .82, .55, 0, H + .45, z, MAT.panel(1.8, .82));
    for (let k = 0; k < 3; k++) { rbox(.56, .7, .02, -.6 + k * .6, H + .45, z + .285, MAT.seatShell, root, .015, false); rbox(.02, .2, .02, -.4 + k * .6, H + .5, z + .3, MAT.blackMatte, root, .006, false); }
    rbox(1.9, .04, .62, 0, H + .88, z + .02, MAT.wood);
    rbox(.5, .32, .4, -.5, H + 1.06, z - .02, MAT.darkMetal, root, .03);
    rbox(.42, .22, .01, -.5, H + 1.06, z + .185, new THREE.MeshPhysicalMaterial({ color: '#0d1114', roughness: .05, metalness: .2, clearcoat: 1 }), root, .01, false);
    rbox(.42, .5, .14, .45, H + 1.15, z - .1, MAT.seatShell, root, .03);
    for (const sx of [-.1, .1]) mesh(new THREE.CylinderGeometry(.015, .015, .06, 12), MAT.steel, root, .45 + sx, H + 1.04, z + .0);
    screen(.18, .1, MAT.dash, root, .45, H + 1.3, z - .02, 0, .01);
    mesh(new THREE.CylinderGeometry(.06, .09, .9, 24), MAT.darkMetal, root, 0, H + .45, -2.35).castShadow = true;
    proxy(.2, .9, .2, root, 0, H + .45, -2.35);
    const table = mesh(extrude(roundedRectShape(1.1, .6, .2), .04, .01), MAT.wood, root, 0, H + .92, -2.35); table.rotation.x = -Math.PI / 2;
    for (const sx of [-.45, .45]) { mesh(new THREE.CylinderGeometry(.18, .18, .07, 28), MAT.seatPad, root, sx, H + .5, -1.95); mesh(new THREE.CylinderGeometry(.03, .05, .46, 12), MAT.darkMetal, root, sx, H + .23, -1.95); }
    label('GALLEY', 0, H + 2.4, -3.0, .5);
  }
  // shared work table on the window side
  rbox(1.2, .04, .5, 0, H + .9, 3.2, MAT.wood);
  for (const sx of [-.5, .5]) rbox(.05, .88, .05, sx, H + .44, 3.25, MAT.darkMetal, root, .01, false);
  screen(.4, .26, MAT.dash, root, 0, H + 1.08, 3.3, Math.PI);
  label('SHARED WORK', 0, H + 2.4, 3.3, .4);

  return { MAT, flatBar, post, panelMap };
}
