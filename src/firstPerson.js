// First-person walking mode: pointer-lock mouse look, WASD movement, capsule collisions against an
// Octree of the ship, analytic lunar terrain, a moving lift car and "use" interactions (E / click).
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Capsule } from 'three/addons/math/Capsule.js';

const RADIUS = 0.3;          // capsule radius (m)
const CAPSULE_TOP = 1.85;    // top of the body capsule above the feet
const EYE = 1.8;             // camera height above the feet (spec)
const WALK = 2.0, RUN = 4.2; // m/s
const GRAVITY = 1.62;        // lunar surface gravity, m/s²
const SNAP = 0.32;           // max step-down snap when walking off ledges/stairs
const REACH = 2.4;           // interaction distance (m)
const WORLD_LIMIT = 140;     // keep the walker on the detailed terrain patch

export function createFirstPerson({ camera, domElement, buildOctree, heightAt, lift, interactables, onExitRequest, ui, touchUI = null }) {
  const controls = new PointerLockControls(camera, domElement);
  controls.pointerSpeed = 0.9;
  const capsule = new Capsule(new THREE.Vector3(), new THREE.Vector3(), RADIUS);
  const velocity = new THREE.Vector3();
  const keys = new Set();
  const ray = new THREE.Raycaster();
  let octree = null, active = false, onFloor = false, focused = null;
  // Touch input (phones/tablets): left virtual stick moves, dragging anywhere else looks, USE and RUN buttons.
  const touch = { enabled: !!touchUI, stick: new THREE.Vector2(), stickId: null, lookId: null, last: new THREE.Vector2(), run: false };
  const euler = new THREE.Euler(0, 0, 0, 'YXZ'), LOOK_SPEED = 0.0055;
  if (touchUI) {
    // Mobile-game layout (landscape): a floating thumbstick appears wherever the left thumb lands on the
    // left half of the screen; the right half is a drag-to-look surface; action buttons sit bottom-right.
    const { zone, stick, knob, useButton, runButton } = touchUI, STICK_R = 56;
    const origin = new THREE.Vector2();
    const setKnob = () => { knob.style.transform = `translate(${touch.stick.x * STICK_R}px, ${touch.stick.y * STICK_R}px)`; };
    const stickFrom = e => { touch.stick.set((e.clientX - origin.x) / STICK_R, (e.clientY - origin.y) / STICK_R); if (touch.stick.length() > 1) touch.stick.normalize(); setKnob(); };
    zone.addEventListener('pointerdown', e => {
      if (!active || touch.stickId !== null) return;
      touch.stickId = e.pointerId; zone.setPointerCapture(e.pointerId); origin.set(e.clientX, e.clientY);
      const zr = zone.getBoundingClientRect(); stick.style.left = `${e.clientX - zr.left}px`; stick.style.top = `${e.clientY - zr.top}px`; stick.classList.add('active');
      stickFrom(e); ui.touched?.(); e.preventDefault();
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === touch.stickId) stickFrom(e); });
    const release = e => { if (e.pointerId !== touch.stickId) return; touch.stickId = null; touch.stick.set(0, 0); setKnob(); stick.classList.remove('active'); stick.style.left = stick.style.top = ''; };
    zone.addEventListener('pointerup', release); zone.addEventListener('pointercancel', release);
    domElement.addEventListener('pointerdown', e => { if (!active || e.pointerType === 'mouse' || touch.lookId !== null) return; touch.lookId = e.pointerId; touch.last.set(e.clientX, e.clientY); touch.down = { x: e.clientX, y: e.clientY, t: performance.now() }; ui.touched?.(); });
    addEventListener('pointermove', e => {
      if (e.pointerId !== touch.lookId) return;
      const dx = e.clientX - touch.last.x, dy = e.clientY - touch.last.y; touch.last.set(e.clientX, e.clientY);
      euler.setFromQuaternion(camera.quaternion); euler.y -= dx * LOOK_SPEED; euler.x = THREE.MathUtils.clamp(euler.x - dy * LOOK_SPEED, -1.45, 1.45); camera.quaternion.setFromEuler(euler);
    });
    const endLook = e => { if (e.pointerId !== touch.lookId) return; touch.lookId = null; const d = touch.down; if (d && performance.now() - d.t < 350 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 14) tapAt(e.clientX, e.clientY); };
    addEventListener('pointerup', endLook); addEventListener('pointercancel', endLook);
    useButton.addEventListener('pointerdown', e => { e.preventDefault(); use(); });
    runButton.addEventListener('pointerdown', e => { e.preventDefault(); touch.run = !touch.run; runButton.classList.toggle('on', touch.run); });
  }

  const feet = () => capsule.start.y - RADIUS;
  function placeFeet(x, y, z) { capsule.start.set(x, y + RADIUS, z); capsule.end.set(x, y + CAPSULE_TOP - RADIUS, z); }

  function onKey(e, down) {
    if (!active) return;
    const k = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) { down ? keys.add(k) : keys.delete(k); e.preventDefault(); }
    if (down && k === 'KeyE') use();
  }
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup', e => onKey(e, false));
  addEventListener('blur', () => keys.clear());
  domElement.addEventListener('click', e => { if (!active || touch.enabled) return; if (!controls.isLocked) controls.lock(); else use(); });
  controls.addEventListener('lock', () => ui.setLocked(true));
  controls.addEventListener('unlock', () => { keys.clear(); ui.setLocked(false); });

  function use() { if (focused) focused.action(); }
  const targets = () => interactables.map(i => i.hit || i.mesh);
  const entryFor = o => interactables.find(i => i.hit === o || i.mesh === o);
  // tap a lift button directly on screen (short touch with almost no drag)
  function tapAt(x, y) {
    const r = domElement.getBoundingClientRect();
    ray.setFromCamera({ x: ((x - r.left) / r.width) * 2 - 1, y: -((y - r.top) / r.height) * 2 + 1 }, camera); ray.far = REACH + 0.6;
    const hit = ray.intersectObjects(targets(), false)[0]; if (hit) { const e = entryFor(hit.object); e.action(); e.mesh.material.emissiveIntensity = 4; ui.pressed?.(); }
  }
  // collision world is built once, after the loading screen has painted
  async function prepare() {
    if (octree) return;
    await new Promise(res => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(go, 0))); setTimeout(go, 200); });
    octree = buildOctree();
  }

  function enter(spawn, lookAt) {
    if (!octree) octree = buildOctree();
    active = true; velocity.set(0, 0, 0); keys.clear();
    placeFeet(spawn.x, spawn.y, spawn.z);
    camera.position.set(spawn.x, spawn.y + EYE, spawn.z);
    camera.lookAt(lookAt);
    if (touch.enabled) ui.setLocked(true); else controls.lock();
  }
  function exit() { active = false; keys.clear(); touch.stick.set(0, 0); touch.stickId = touch.lookId = null; if (controls.isLocked) controls.unlock(); ui.setPrompt(''); focused = null; }

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();
  const probe = new Capsule(new THREE.Vector3(), new THREE.Vector3(), RADIUS);

  function collide() {
    const hit = octree.capsuleIntersect(capsule);
    let floor = false;
    if (hit) {
      floor = hit.normal.y > 0.45;
      if (!floor) velocity.addScaledVector(hit.normal, -hit.normal.dot(velocity));
      else if (velocity.y < 0) velocity.y = 0;
      if (hit.depth >= 1e-10) capsule.translate(hit.normal.multiplyScalar(hit.depth));
    }
    return floor;
  }

  // Lift car: a moving floor plus three railed sides, handled analytically.
  function liftContact() {
    const b = lift.bounds(), x = capsule.start.x, z = capsule.start.z, f = feet();
    let floor = false;
    const inside = x > b.x0 + 0.05 && x < b.x1 - 0.05 && z > b.z0 + 0.05 && z < b.z1;
    if (inside && f > b.floor - 0.4 && f < b.floor + 0.3 && velocity.y <= 0.5) {
      capsule.translate(new THREE.Vector3(0, b.floor - f, 0)); velocity.y = Math.max(0, velocity.y); floor = true;
    }
    if (f < b.floor + 2.4 && f + CAPSULE_TOP > b.floor) {
      for (const [[ax, az], [bx, bz]] of b.rails) {
        const dx = bx - ax, dz = bz - az, t = THREE.MathUtils.clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
        const px = ax + dx * t, pz = az + dz * t, ox = capsule.start.x - px, oz = capsule.start.z - pz, d = Math.hypot(ox, oz), min = RADIUS + 0.04;
        if (d < min && d > 1e-6) { const push = (min - d) / d; capsule.translate(new THREE.Vector3(ox * push, 0, oz * push)); }
      }
    }
    return floor;
  }

  function terrainContact() {
    const g = heightAt(capsule.start.x, capsule.start.z), f = feet();
    if (f < g) { capsule.translate(new THREE.Vector3(0, g - f, 0)); if (velocity.y < 0) velocity.y = 0; return true; }
    return f - g < 0.02;
  }

  function step(dt, wasOnFloor) {
    // horizontal intent
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.crossVectors(fwd, camera.up).normalize();
    wish.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) wish.add(fwd);
    if (keys.has('KeyS') || keys.has('ArrowDown')) wish.sub(fwd);
    if (keys.has('KeyD') || keys.has('ArrowRight')) wish.add(right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) wish.sub(right);
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.run;
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(running ? RUN : WALK);
    else if (touch.stick.lengthSq() > 0.01) { const m = Math.min(1, touch.stick.length()); wish.addScaledVector(fwd, -touch.stick.y).addScaledVector(right, touch.stick.x).normalize().multiplyScalar(m * (running ? RUN : WALK)); }
    const k = Math.min(1, (wasOnFloor ? 14 : 1.5) * dt);
    velocity.x += (wish.x - velocity.x) * k; velocity.z += (wish.z - velocity.z) * k;
    if (!wasOnFloor) velocity.y -= GRAVITY * dt; else velocity.y = Math.min(velocity.y, 0) - GRAVITY * dt;

    capsule.translate(velocity.clone().multiplyScalar(dt));
    let floor = collide();
    floor = liftContact() || floor;
    floor = terrainContact() || floor;

    // step-down snap so stairs and ramps are walked, not hopped
    if (!floor && wasOnFloor && velocity.y <= 0.01) {
      probe.copy(capsule); probe.translate(new THREE.Vector3(0, -SNAP, 0));
      const hit = octree.capsuleIntersect(probe);
      if (hit && hit.normal.y > 0.45) { probe.translate(hit.normal.multiplyScalar(hit.depth)); const lateral = Math.hypot(probe.start.x - capsule.start.x, probe.start.z - capsule.start.z); if (lateral < 0.03 && probe.start.y <= capsule.start.y + 1e-3) { capsule.copy(probe); floor = true; velocity.y = 0; } }
      else { const g = heightAt(capsule.start.x, capsule.start.z); if (feet() - g < SNAP && feet() - g > 0) { capsule.translate(new THREE.Vector3(0, g - feet(), 0)); floor = true; velocity.y = 0; } }
    }
    // keep inside the playable area
    const r = Math.hypot(capsule.start.x, capsule.start.z);
    if (r > WORLD_LIMIT) { const s = WORLD_LIMIT / r - 1; capsule.translate(new THREE.Vector3(capsule.start.x * s, 0, capsule.start.z * s)); }
    return floor;
  }

  function update(dt) {
    if (!active) return;
    const sub = 4, h = Math.min(dt, 0.05) / sub;
    for (let i = 0; i < sub; i++) onFloor = step(h, onFloor);
    camera.position.set(capsule.start.x, feet() + EYE, capsule.start.z);
    // interaction focus
    ray.setFromCamera({ x: 0, y: 0 }, camera); ray.far = REACH;
    const hits = ray.intersectObjects(targets(), false);
    const next = hits.length ? entryFor(hits[0].object) : null;
    if (focused && focused !== next) focused.mesh.material.emissiveIntensity = 0.7;
    focused = next;
    touchUI?.useButton.classList.toggle('ready', !!next);
    if (focused) { focused.mesh.material.emissiveIntensity = 2.4; ui.setPrompt(`${touch.enabled ? '<b>USE</b>' : '<b>E</b> / click'} · ${typeof focused.label === 'function' ? focused.label() : focused.label}`); }
    else ui.setPrompt('');
  }

  return { prepare, enter, exit, update, get active() { return active; }, get locked() { return controls.isLocked; } };
}
