// Procedural lunar surface. Everything is deterministic (fixed seed) and generated at startup.
// Physical cues used: crater depth/diameter 0.08-0.2 with raised rims and ejecta falloff ~d^-3,
// a power-law crater size distribution (many small, few large), bright halos around fresh craters,
// boulders concentrated on fresh rims, fine regolith grain in the detail maps and distant highlands.
import * as THREE from 'three';

function prng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(ix, iz, salt = 0) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(salt + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, z, salt = 0) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, salt), b = hash(ix + 1, iz, salt), c = hash(ix, iz + 1, salt), d = hash(ix + 1, iz + 1, salt);
  return (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz;
}
function fbm(x, z, octaves, salt = 0) {
  let sum = 0, amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) { sum += amp * noise(x, z, salt + o); norm += amp; amp *= 0.5; x *= 2.03; z *= 2.03; }
  return sum / norm;
}
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function createLunarTerrain({ seed = 20261115, padRadius = 11, anisotropy = 8 } = {}) {
  const random = prng(seed);
  // ---- craters with a cumulative size distribution N(>R) ~ R^-2
  const craters = [];
  function addCraters(count, rMin, rMax, zoneRadius, keepOut) {
    for (let i = 0; i < count; i++) {
      const R = Math.min(rMax, rMin * Math.pow(1 - random(), -0.5));
      const a = random() * Math.PI * 2, dist = Math.sqrt(random()) * zoneRadius;
      const x = Math.sin(a) * dist, z = Math.cos(a) * dist;
      if (Math.hypot(x, z) < keepOut + R * 1.3) continue;
      const fresh = Math.pow(random(), 1.4);                       // most craters are degraded
      const depth = 2 * R * (0.07 + 0.13 * fresh);
      craters.push({ x, z, R, depth, rim: depth * (0.25 + 0.2 * fresh), fresh, reach: R * 3 });
    }
  }
  // a few named, clearly readable craters in the mid-ground (positions chosen for the default views)
  for (const [x, z, R, fresh] of [[-34, 26, 9, 0.9], [42, -22, 15, 0.35], [-22, -58, 6, 1], [64, 48, 22, 0.2], [18, 40, 4, 0.95], [-70, -20, 30, 0.15], [-48, 70, 12, 0.6]]) {
    const depth = 2 * R * (0.07 + 0.13 * fresh);
    craters.push({ x, z, R, depth, rim: depth * (0.25 + 0.2 * fresh), fresh, reach: R * 3 });
  }
  addCraters(1400, 0.35, 22, 170, padRadius + 3);
  addCraters(260, 9, 170, 1600, 120);

  // spatial hash for crater lookup
  const CELL = 32, grid = new Map();
  const key = (cx, cz) => cx * 73856093 ^ cz * 19349663;
  for (const c of craters) {
    const x0 = Math.floor((c.x - c.reach) / CELL), x1 = Math.floor((c.x + c.reach) / CELL);
    const z0 = Math.floor((c.z - c.reach) / CELL), z1 = Math.floor((c.z + c.reach) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const k = key(cx, cz); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c);
    }
  }

  // returns [height, albedo]
  function sample(x, z) {
    const r = Math.hypot(x, z);
    let h = 0, albedo = 0;
    const list = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (list) for (const c of list) {
      const dx = x - c.x, dz = z - c.z, d2 = dx * dx + dz * dz;
      if (d2 > c.reach * c.reach) continue;
      const d = Math.sqrt(d2) / c.R;
      const bowl = d < 1 ? -c.depth * (1 - d * d) : 0;
      const rim = c.rim * Math.exp(-(((d - 1) / 0.2) ** 2));
      const ejecta = d > 1 ? c.rim * 0.45 * Math.pow(d, -3) : c.rim * 0.45;
      h += bowl + rim + (d > 1 ? ejecta : 0);
      albedo += c.fresh * (d < 1 ? -0.05 : 0.32 * Math.exp(-(((d - 1.15) / 0.7) ** 2)));
    }
    // rolling regolith, small bumps and distant highlands
    h += 0.7 * (fbm(x / 60, z / 60, 4, 11) - 0.5) + 0.06 * (fbm(x / 2.5, z / 2.5, 3, 21) - 0.5);
    h += smooth(220, 1100, r) * (85 * fbm(x / 520, z / 520, 4, 31) + 25 * fbm(x / 140, z / 140, 3, 41) - 42);
    // blast-swept, levelled pad under the lander
    const pad = smooth(padRadius, padRadius + 10, r);
    h *= pad;
    albedo = albedo * pad + (1 - pad) * 0.06 + 0.12 * (fbm(x / 35, z / 35, 3, 51) - 0.5) + 0.08 * (fbm(x / 9, z / 9, 2, 57) - 0.5) + 0.1 * (fbm(x / 160, z / 160, 3, 63) - 0.5);
    return [h, albedo];
  }
  const heightAt = (x, z) => sample(x, z)[0];

  // ---- detail maps: fine regolith grain (albedo) + matching normal map, 4 m tile
  const N = 1024, TILE = 4;
  const heightField = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    // periodic noise: sample on integer lattice periods so the tile wraps
    const p = (f, s) => { const X = u * f, Z = v * f, ix = Math.floor(X), iz = Math.floor(Z), fx = X - ix, fz = Z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz), w = n => ((n % f) + f) % f;
      const a = hash(w(ix), w(iz), s), b = hash(w(ix + 1), w(iz), s), c = hash(w(ix), w(iz + 1), s), d = hash(w(ix + 1), w(iz + 1), s);
      return (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz; };
    heightField[y * N + x] = 0.4 * p(8, 1) + 0.25 * p(24, 2) + 0.18 * p(64, 3) + 0.12 * p(160, 4) + 0.05 * p(400, 5);
  }
  // pebbles and micro-pits
  for (let i = 0; i < 2600; i++) {
    const cx = random() * N, cy = random() * N, rad = 1 + Math.pow(random(), 3) * 9, pit = random() < 0.35;
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      const d = Math.hypot(x, y) / rad; if (d > 1) continue;
      const px = ((Math.round(cx + x) % N) + N) % N, py = ((Math.round(cy + y) % N) + N) % N;
      heightField[py * N + px] += (pit ? -0.12 : 0.18) * (1 - d * d);
    }
  }
  const colorCanvas = document.createElement('canvas'), normalCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = normalCanvas.width = normalCanvas.height = N;
  const cImg = colorCanvas.getContext('2d').createImageData(N, N), nImg = normalCanvas.getContext('2d').createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, hgt = heightField[i];
    const g = Math.max(0, Math.min(255, 124 + (hgt - 0.5) * 55));
    cImg.data[i * 4] = g; cImg.data[i * 4 + 1] = g; cImg.data[i * 4 + 2] = g * 0.985; cImg.data[i * 4 + 3] = 255;
    const hl = heightField[y * N + ((x - 1 + N) % N)], hr = heightField[y * N + ((x + 1) % N)];
    const hu = heightField[((y - 1 + N) % N) * N + x], hd = heightField[((y + 1) % N) * N + x];
    const nx = (hl - hr) * 3.2, ny = (hu - hd) * 3.2, nz = 1, len = Math.hypot(nx, ny, nz);
    nImg.data[i * 4] = (nx / len * 0.5 + 0.5) * 255; nImg.data[i * 4 + 1] = (ny / len * 0.5 + 0.5) * 255; nImg.data[i * 4 + 2] = (nz / len * 0.5 + 0.5) * 255; nImg.data[i * 4 + 3] = 255;
  }
  colorCanvas.getContext('2d').putImageData(cImg, 0, 0); normalCanvas.getContext('2d').putImageData(nImg, 0, 0);
  const map = new THREE.CanvasTexture(colorCanvas), normalMap = new THREE.CanvasTexture(normalCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, normalMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anisotropy; }

  // Breaks visible tiling: the detail maps are sampled three times at unrelated scales and rotations
  // (1x, 0.291x rotated 37 deg, 0.083x rotated 74 deg) and blended; normals are rotated back into place.
  function antiTile(m) {
    m.onBeforeCompile = shader => {
      const rot = `
        const mat2 rB = mat2(0.7986, -0.6018, 0.6018, 0.7986);
        const mat2 rC = mat2(0.2756, 0.9613, -0.9613, 0.2756);
        vec2 atUvB(vec2 uv) { return rB * uv * 0.291 + vec2(0.37, 0.11); }
        vec2 atUvC(vec2 uv) { return rC * uv * 0.083 + vec2(0.71, 0.53); }
      `;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + rot)
        .replace('#include <map_fragment>', `
          #ifdef USE_MAP
            vec4 tA = texture2D(map, vMapUv), tB = texture2D(map, atUvB(vMapUv)), tC = texture2D(map, atUvC(vMapUv));
            vec4 sampledDiffuseColor = tA * 0.42 + tB * 0.36 + tC * 0.22;
            sampledDiffuseColor.rgb = max(mix(vec3(0.2), sampledDiffuseColor.rgb, 1.25), 0.0);
            diffuseColor *= sampledDiffuseColor;
          #endif`)
        .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;', `
          vec3 nA = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
          vec3 nB = texture2D(normalMap, atUvB(vNormalMapUv)).xyz * 2.0 - 1.0; nB.xy = transpose(rB) * nB.xy;
          vec3 nC = texture2D(normalMap, atUvC(vNormalMapUv)).xyz * 2.0 - 1.0; nC.xy = transpose(rC) * nC.xy;
          vec3 mapN = normalize(vec3(nA.xy * 0.5 + nB.xy * 0.35 + nC.xy * 0.25, 1.0));`);
    };
  }
  function material(size, tile = TILE) {
    const m = new THREE.MeshStandardMaterial({ map: map.clone(), normalMap: normalMap.clone(), normalScale: new THREE.Vector2(1.1, 1.1), roughness: 1, metalness: 0, vertexColors: true });
    for (const t of [m.map, m.normalMap]) { t.repeat.set(size / tile, size / tile); t.needsUpdate = true; }
    antiTile(m);
    return m;
  }
  function surface(size, segments, drop, tile) {
    const g = new THREE.PlaneGeometry(size, size, segments, segments);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), [h, a] = sample(x, z);
      pos.setY(i, h - drop);
      const tone = 0.92 + a; colors[i * 3] = tone; colors[i * 3 + 1] = tone; colors[i * 3 + 2] = tone * 0.99;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const o = new THREE.Mesh(g, material(size, tile)); o.receiveShadow = true; return o;
  }
  const group = new THREE.Group();
  group.add(surface(300, 480, 0, TILE));          // 0.62 m resolution around the lander
  group.add(surface(4200, 420, 0.3, 26));       // 10 m resolution to the horizon, slightly below the near patch

  // ---- boulders: a few lumpy variants, instanced; more of them on fresh rims
  const rockMat = new THREE.MeshStandardMaterial({ color: '#c4c4c0', roughness: 0.95, metalness: 0, map: map.clone(), normalMap: normalMap.clone() });
  const variants = [0, 1, 2, 3].map(v => {
    const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, q = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      q.fromBufferAttribute(p, i);
      const k = 1 + 0.35 * (fbm(q.x * 1.6 + v * 7, q.z * 1.6 + q.y * 1.3, 3, 60 + v) - 0.5) * 2 + 0.08 * (noise(q.x * 6, q.y * 6 + q.z * 6, 70 + v) - 0.5);
      q.multiplyScalar(k); q.y *= 0.62; if (q.y < -0.25) q.y = -0.25 + (q.y + 0.25) * 0.3;
      p.setXYZ(i, q.x, q.y, q.z);
    }
    g.computeVertexNormals(); return g;
  });
  const placements = variants.map(() => []);
  const place = (x, z, s) => { const r = Math.hypot(x, z); if (r < padRadius + 1) return; placements[Math.floor(random() * variants.length)].push([x, heightAt(x, z) - s * 0.2, z, s]); };
  for (let i = 0; i < 1100; i++) { const a = random() * Math.PI * 2, r = padRadius + 2 + Math.pow(random(), 0.8) * 140; place(Math.sin(a) * r, Math.cos(a) * r, 0.04 + Math.pow(random(), 4) * 0.7); }
  for (const c of craters) if (c.fresh > 0.45 && c.R > 2.5 && Math.hypot(c.x, c.z) < 160) {
    const n = Math.min(40, Math.round(c.R * 2.2));
    for (let i = 0; i < n; i++) { const a = random() * Math.PI * 2, d = c.R * (0.85 + random() * 0.9); place(c.x + Math.sin(a) * d, c.z + Math.cos(a) * d, 0.08 + Math.pow(random(), 3) * c.R * 0.09); }
  }
  const m4 = new THREE.Matrix4(), quat = new THREE.Quaternion(), e = new THREE.Euler();
  variants.forEach((g, v) => {
    const list = placements[v], inst = new THREE.InstancedMesh(g, rockMat, list.length);
    list.forEach(([x, y, z, s], i) => { e.set((random() - 0.5) * 0.4, random() * Math.PI * 2, (random() - 0.5) * 0.4); quat.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), quat, new THREE.Vector3(s * (0.8 + random() * 0.5), s, s * (0.8 + random() * 0.5))); inst.setMatrixAt(i, m4); });
    inst.castShadow = true; inst.receiveShadow = true; group.add(inst);
  });

  return { group, heightAt };
}
