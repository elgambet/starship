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

export function createFirstPerson({ camera, domElement, buildOctree, heightAt, lift, interactables, onExitRequest, ui }) {
  const controls = new PointerLockControls(camera, domElement);
  controls.pointerSpeed = 0.9;
  const capsule = new Capsule(new THREE.Vector3(), new THREE.Vector3(), RADIUS);
  const velocity = new THREE.Vector3();
  const keys = new Set();
  const ray = new THREE.Raycaster();
  let octree = null, active = false, onFloor = false, focused = null;

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
  domElement.addEventListener('click', () => { if (!active) return; if (!controls.isLocked) controls.lock(); else use(); });
  controls.addEventListener('lock', () => ui.setLocked(true));
  controls.addEventListener('unlock', () => { keys.clear(); ui.setLocked(false); });

  function use() { if (focused) focused.action(); }

  function enter(spawn, lookAt) {
    if (!octree) octree = buildOctree();
    active = true; velocity.set(0, 0, 0); keys.clear();
    placeFeet(spawn.x, spawn.y, spawn.z);
    camera.position.set(spawn.x, spawn.y + EYE, spawn.z);
    camera.lookAt(lookAt);
    controls.lock();
  }
  function exit() { active = false; keys.clear(); if (controls.isLocked) controls.unlock(); ui.setPrompt(''); focused = null; }

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
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN : WALK);
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
    const hits = ray.intersectObjects(interactables.map(i => i.mesh), false);
    const next = hits.length ? interactables.find(i => i.mesh === hits[0].object) : null;
    if (focused && focused !== next) focused.mesh.material.emissiveIntensity = 0.7;
    focused = next;
    if (focused) { focused.mesh.material.emissiveIntensity = 2.4; ui.setPrompt(`<b>E</b> / click · ${typeof focused.label === 'function' ? focused.label() : focused.label}`); }
    else ui.setPrompt('');
  }

  return { enter, exit, update, get active() { return active; }, get locked() { return controls.isLocked; } };
}
