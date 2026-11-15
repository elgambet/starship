import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createLunarTerrain } from './terrain.js';
import { createFirstPerson } from './firstPerson.js';
import { buildInterior } from './interior.js';
import { Octree } from 'three/addons/math/Octree.js';
import { dimensions as D, deckNames } from './dimensions.js';
import './style.css';

const $ = (s) => document.querySelector(s);
const app = $('#app');
app.innerHTML = `<button class="mobile-menu" aria-label="Open controls">☰</button><aside class="sidebar">
  <div class="eyebrow">Architectural study · 2026</div><div class="brand">STARSHIP HLS</div>
  <p class="sub">A walkable-scale concept of the crewed lunar lander. One scene unit equals one metre.</p>
  <div class="group"><h2>Shell mode</h2><div class="segmented" id="shell-mode"><button data-mode="exterior" class="active">Exterior</button><button data-mode="cutaway">Cutaway</button><button data-mode="ghost">Ghost</button></div></div>
  <div class="group"><h2>Camera</h2><div class="preset-list" id="presets"></div></div>
  <div class="group"><h2>Display</h2><div class="toggle-row"><span>Deck labels</span><button class="toggle on" data-toggle="labels" aria-label="Toggle deck labels"></button></div><div class="toggle-row"><span>Scale guides</span><button class="toggle" data-toggle="guides" aria-label="Toggle scale guides"></button></div><div class="toggle-row"><span>1.8 m clearance capsule</span><button class="toggle" data-toggle="debug" aria-label="Toggle clearance capsule"></button></div></div>
  <div class="group"><h2>Published scale</h2><div class="fact"><strong>52 m</strong><span class="badge">Published</span><label>Approximate vehicle height</label></div><div class="fact"><strong>9 m</strong><span class="badge">Published</span><label>Nominal hull diameter</label></div><div class="fact"><strong>35.1 m</strong><span class="badge">Published</span><label>Approximate elevator boarding height</label></div><div class="fact"><strong>2 × ~13 m³</strong><span class="badge">Published</span><label>Separate airlock volumes</label></div></div>
  <div class="group"><h2>Model interpretation</h2><p class="note"><span class="badge observed">Observed</span> motifs come from SpaceX and NASA images. <span class="badge estimated">Estimated</span> deck positions, stairs, rooms, windows and furniture form a connected concept layout. They are not released vehicle drawings.</p></div>
  <p class="note">Drag to orbit · scroll to zoom · right drag to pan<br/>WASD walking is planned for the next phase.</p>
</aside><main class="viewport"><div class="topbar"><div class="title">CREWED LUNAR LANDER / SECTION STUDY</div><div class="top-actions"><button class="chip walk" id="walk-btn" title="Walk the ship in first person (desktop)">Walk in first person</button><button class="chip on" id="labels-chip" title="Toggle deck labels (L)">Labels</button><div class="status" id="view-status">EXTERIOR · FULL SHIP</div></div></div><div class="layer-tooltip" id="view-description">Orbit the complete vehicle, then choose Cutaway to inspect the four connected decks.</div><div class="fp-hud" hidden><button class="fp-exit" id="fp-exit">← Exit first person</button><div class="fp-cross"></div><div class="fp-prompt" id="fp-prompt"></div><div class="fp-help" id="fp-help"><strong>First person</strong><span>Click to look around</span><span><b>W A S D</b> move · <b>Shift</b> run</span><span><b>E</b> or click · use lift buttons</span><span><b>Esc</b> releases the mouse</span></div><div class="fp-touch"><div class="fp-stickzone" id="fp-stickzone"><div class="fp-stick" id="fp-stick"><div class="fp-knob" id="fp-knob"></div></div></div><button class="fp-btn fp-run" id="fp-run">RUN</button><button class="fp-btn fp-use" id="fp-use">USE</button></div><div class="fp-rotate"><div class="fp-phone"></div><strong>Rotate your phone</strong><span>First person is played in landscape</span></div></div><div class="footer"><span>NASA / SpaceX public references · layout estimates marked</span><span class="compass">+Z WINDOW SIDE ↗</span></div></main>`;

const viewport = $('.viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#010203');
scene.fog = new THREE.FogExp2('#010203', 0.0008);
const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
camera.position.set(24, 9, 64);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
// Image-based lighting gives painted metal and glazing something real to reflect.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.prepend(renderer.domElement);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.06;
orbit.target.set(0, 25, 0);
orbit.minDistance = 2;
orbit.maxDistance = 190;
orbit.maxPolarAngle = Math.PI * 0.93;
// Airless lunar lighting: one hard sun, weak regolith bounce, no sky fill.
scene.add(new THREE.HemisphereLight('#3a4350','#8a8d90', 0.55));
const sun = new THREE.DirectionalLight('#fff6ea', 3.6);
sun.position.set(-62,34,44); sun.castShadow=true;
const rim = new THREE.DirectionalLight('#dfe8ff', 0.9);
rim.position.set(30,40,-60); scene.add(rim);
sun.shadow.mapSize.set(4096,4096); sun.shadow.camera.left=-45; sun.shadow.camera.right=45;
sun.shadow.camera.top=60;sun.shadow.camera.bottom=-45;sun.shadow.camera.near=1;sun.shadow.camera.far=220;
sun.shadow.bias=-0.00012;scene.add(sun);

const mat = (color, roughness=.65, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness,side:THREE.DoubleSide});
const M = {
  hull:new THREE.MeshPhysicalMaterial({color:'#e4e6e6',roughness:.36,metalness:.12,clearcoat:.55,clearcoatRoughness:.28,side:THREE.DoubleSide}),
  collar:new THREE.MeshPhysicalMaterial({color:'#161c22',roughness:.3,metalness:.6,clearcoat:.8,clearcoatRoughness:.12,side:THREE.DoubleSide}), inner:mat('#edf0ef',.72,.02), panel:mat('#d8dedf',.68,.07),
  floor:mat('#272d32',.82,.08), tread:new THREE.MeshPhysicalMaterial({color:'#3b4248',roughness:.5,metalness:.45,clearcoat:.2,side:THREE.DoubleSide}), floorEdge:mat('#657177',.55,.55), dark:mat('#151d25',.45,.35),
  frame:mat('#8b9296',.32,.85), rail:mat('#b7c5c9',.38,.68), blue:mat('#28758a',.38,.32),
  amber:mat('#bd9d70',.72,.05), berth:mat('#c5c1b7',.92,.02), padding:mat('#e7e7e4',.83,.01),
  seat:mat('#434d55',.88,.03), glass:new THREE.MeshPhysicalMaterial({color:'#8ca6b0',roughness:.09,metalness:0,transmission:.67,thickness:.02,transparent:true,side:THREE.DoubleSide}),
  light:new THREE.MeshStandardMaterial({color:'#ecfbff',emissive:'#dce8ed',emissiveIntensity:2.5,roughness:.3}),
  screen:new THREE.MeshStandardMaterial({color:'#06141c',emissive:'#0b586b',emissiveIntensity:.65,roughness:.12})
};
M.lining=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.5,metalness:.02,side:THREE.DoubleSide});
M.floor.map=null;M.floor.color.set('#26292c');M.floor.roughness=.62;M.floor.metalness=.15;
function worldVarying(sh){sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWorldP=(modelMatrix*vec4(transformed,1.)).xyz;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldP;')}
M.lining.onBeforeCompile=sh=>{worldVarying(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\n vec2 cylUv=vec2(atan(vWorldP.x,vWorldP.z)*4.19/1.2,vWorldP.y/1.2);diffuseColor*=texture2D(map,cylUv);\n#endif')};
M.floor.onBeforeCompile=sh=>{worldVarying(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  { vec2 fp=vWorldP.xz; float r=length(fp); float ang=atan(fp.x,fp.y); float seg=PI/6.;
    float k=floor(ang/seg); float local=ang-k*seg; float da=min(local,seg-local)*r;
    float ring=min(abs(r-2.3),abs(r-3.3));
    float diag=abs((local/seg)-(r-2.3)/1.0)*r*seg; diag=(r>2.3&&r<3.3)?diag:1.;
    float line=min(min(da,ring),diag);
    diffuseColor.rgb*=mix(.42,1.,smoothstep(.003,.011,line));
    diffuseColor.rgb*=.94+.06*fract(sin(dot(floor(vec2(k,floor(r/1.)))*1.7,vec2(12.9898,78.233)))*43758.5453); }`)};
const groups={shellFront:new THREE.Group(),shellBack:new THREE.Group(),noseFront:new THREE.Group(),noseBack:new THREE.Group(),innerFront:new THREE.Group(),windows:new THREE.Group(),decals:new THREE.Group(),interior:new THREE.Group(),labels:new THREE.Group(),detailLabels:new THREE.Group(),guides:new THREE.Group(),hardware:new THREE.Group(),debug:new THREE.Group()};
// Labels and guides render in an overlay pass after post-processing so AO never smears them.
const overlay=new THREE.Scene();
for(const [k,g] of Object.entries(groups))(['labels','detailLabels','guides'].includes(k)?overlay:scene).add(g);
groups.debug.visible=false;
groups.guides.visible=false;
function mesh(geo,material,parent=groups.interior,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);parent.add(o);return o}
const boxCache=new Map();
function roundedBox(w,h,d){const key=`${w}|${h}|${d}`;if(!boxCache.has(key)){const r=Math.min(.035,Math.min(w,h,d)*.3);boxCache.set(key,r<.004?new THREE.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,r))}return boxCache.get(key)}
// Every box and beam is also registered as a simple collision box for the first-person mode.
const solids=[],extraColliders=[];
function box(w,h,d,x,y,z,material=M.panel,parent=groups.interior){const o=mesh(roundedBox(w,h,d),material,parent,x,y,z);o.castShadow=true;o.receiveShadow=true;solids.push({mesh:o,w,h,d});return o}
// Rectangular beam between two points (local Y along the beam).
function beam(a,b,w,d,material,parent=groups.hardware){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=mesh(new RoundedBoxGeometry(w,av.distanceTo(bv),d,2,Math.min(w,d)*.25),material,parent,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize());o.castShadow=true;o.receiveShadow=true;solids.push({mesh:o,w,h:av.distanceTo(bv),d});return o}
// Polished flat-bar rail swept along points (as on the SpaceX cabin render), and flat posts.
function flatBar(points,width=.018,height=.065,material=M.rail,parent=groups.interior){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const sh=new THREE.Shape();sh.moveTo(-width/2,-height/2);sh.lineTo(width/2,-height/2);sh.lineTo(width/2,height/2);sh.lineTo(-width/2,height/2);sh.closePath();const o=mesh(new THREE.ExtrudeGeometry(sh,{steps:Math.max(16,points.length*3),bevelEnabled:false,extrudePath:curve}),material,parent);o.castShadow=true;return o}
function flatPost(base,height,angle,material=M.rail,parent=groups.interior){const o=mesh(new THREE.BoxGeometry(.05,height,.016),material,parent,base[0],base[1]+height/2,base[2]);o.rotation.y=angle;o.castShadow=true;return o}
// Smooth tube through a list of points (handrails).
function tube(points,radius,material=M.rail,parent=groups.interior){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*6),radius,8,false),material,parent);o.castShadow=true;return o}
function rod(a,b,r,material=M.frame,parent=groups.interior){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=mesh(new THREE.CylinderGeometry(r,r,av.distanceTo(bv),10),material,parent,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());o.castShadow=true;return o}
function torus(radius,tube,y,material=M.rail,parent=groups.interior,arc=Math.PI*2,start=0,cx=0,cz=.3){const o=mesh(new THREE.TorusGeometry(radius,tube,7,96,arc),material,parent,cx,y,cz);o.rotation.x=Math.PI/2;o.rotation.z=start;return o}
function polar(radius,angle,y=0,cx=0,cz=0){return [cx+Math.sin(angle)*radius,y,cz+Math.cos(angle)*radius]}
function segment(radius,y0,y1,a0,a1,material,parent){const o=mesh(new THREE.CylinderGeometry(radius,radius,y1-y0,Math.max(2,Math.ceil((a1-a0)*32)),1,true,a0,a1-a0),material,parent,0,(y0+y1)/2,0);o.receiveShadow=true;return o}
function label(text,x,y,z,scale=1,color='#d7f6fb',parent=groups.detailLabels){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#081924dd';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#4b98aa';ctx.lineWidth=3;ctx.strokeRect(2,2,508,92);ctx.fillStyle=color;ctx.font='600 37px Space Grotesk, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49,480);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,toneMapped:false}));o.position.set(x,y,z);o.scale.set(4.2*scale,.79*scale,1);parent.add(o);return o}
function line(a,b,color='#84c0ce',opacity=.8,parent=groups.guides){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);const o=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false}));parent.add(o);return o}

// Deterministic material maps, generated from code rather than the reference screenshots.
let seed=20261115;function random(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}
function canvasTexture(draw,size=512,repeat=[1,1]){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;return t}
function noiseHash(x,y){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^20261115;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function tileNoise(u,v,period){const x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),wrap=n=>(n+period)%period;const a=noiseHash(wrap(ix),wrap(iy)),b=noiseHash(wrap(ix+1),wrap(iy)),c=noiseHash(wrap(ix),wrap(iy+1)),d=noiseHash(wrap(ix+1),wrap(iy+1));return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,sx),THREE.MathUtils.lerp(c,d,sx),sy)}
const floorTexture=canvasTexture((ctx,n)=>{ctx.fillStyle='#2b3034';ctx.fillRect(0,0,n,n);for(let i=0;i<6500;i++){const q=35+Math.floor(random()*20);ctx.fillStyle=`rgba(${q},${q+3},${q+5},.11)`;ctx.fillRect(random()*n,random()*n,1.5,1.5)}ctx.strokeStyle='#414a50';ctx.lineWidth=2;for(let v=0;v<=n;v+=n/4){ctx.beginPath();ctx.moveTo(v,0);ctx.lineTo(v,n);ctx.stroke();ctx.beginPath();ctx.moveTo(0,v);ctx.lineTo(n,v);ctx.stroke()}},512,[4,4]);
M.floor.map=floorTexture;M.floor.needsUpdate=true;
const hexTexture=canvasTexture((ctx,n)=>{ctx.fillStyle='#e5e5e1';ctx.fillRect(0,0,n,n);const step=76;for(let row=-1;row<Math.ceil(n/step)+1;row++)for(let col=-1;col<Math.ceil(n/step)+1;col++){const x=col*step+(row%2)*step/2,y=row*step*.85;ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;const px=x+step*.48*Math.cos(a),py=y+step*.48*Math.sin(a);k?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fillStyle='#ecece8';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#cdd1d0';ctx.stroke()}} ,512,[1,1]);
M.padding.map=hexTexture;M.padding.needsUpdate=true;
// Hull surface maps. One tile covers a quarter of the 9 m circumference (7.07 m) by four 1.83 m
// barrel rings (7.32 m). Welds are horizontal; panel joints are staggered per ring.
const HULL_TILE_W=Math.PI*9/4,HULL_TILE_H=7.32;
function hullCanvas(kind,n=1024){const c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d');const img=ctx.createImageData(n,n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n;const broad=tileNoise(u,v,3),streak=tileNoise(u*1,v*0+.37,48)*.6+tileNoise(u,v,24)*.4,fine=tileNoise(u,v,128);let val;
    if(kind==='color')val=226+(broad-.5)*7+(fine-.5)*3;
    else if(kind==='rough')val=92+(broad-.5)*40+(streak-.5)*34+(fine-.5)*14;
    else val=128+(broad-.5)*10+(fine-.5)*3;
    const i=(y*n+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=val;img.data[i+3]=255}
  ctx.putImageData(img,0,0);
  const ring=n/4;
  for(let r=0;r<4;r++){const y=r*ring;
    // circumferential weld: a raised bead with a slightly darker, rougher heat zone
    if(kind==='bump'){ctx.fillStyle='rgba(150,150,150,1)';ctx.fillRect(0,y-2,n,4);ctx.fillStyle='rgba(112,112,112,.8)';ctx.fillRect(0,y+2,n,2);ctx.fillRect(0,y-4,n,2)}
    else if(kind==='rough'){ctx.fillStyle='rgba(165,165,165,.75)';ctx.fillRect(0,y-3,n,6)}
    else{ctx.fillStyle='rgba(160,163,165,.45)';ctx.fillRect(0,y-1,n,2);ctx.fillStyle='rgba(205,208,209,.35)';ctx.fillRect(0,y-6,n,12)}
    // staggered vertical panel joints within the ring
    for(let k=0;k<2;k++){const x=((k*.5+(r%2)*.25)%1)*n;
      if(kind==='bump'){ctx.fillStyle='rgba(108,108,108,1)';ctx.fillRect(x-1,y,2,ring)}
      else if(kind==='rough'){ctx.fillStyle='rgba(150,150,150,.6)';ctx.fillRect(x-2,y,4,ring)}
      else{ctx.fillStyle='rgba(170,173,175,.35)';ctx.fillRect(x-1,y,2,ring)}}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=kind==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
const hullMaps={map:hullCanvas('color'),roughnessMap:hullCanvas('rough'),bumpMap:hullCanvas('bump')};
// Returns a hull material whose maps repeat at true metric scale for a surface of the given size.
function hullMaterial(circumference,height){const m=M.hull.clone();for(const k of Object.keys(hullMaps)){const t=hullMaps[k].clone();t.repeat.set(circumference/HULL_TILE_W,height/HULL_TILE_H);t.needsUpdate=true;m[k]=t}m.color.set('#ffffff');m.roughness=1;m.bumpScale=1.2;return m}
const lunar=createLunarTerrain({anisotropy:renderer.capabilities.getMaxAnisotropy()});scene.add(lunar.group);
for(let i=0;i<90;i++){const v=new THREE.Vector3((random()-.5)*500,random()*180+15,(random()-.5)*500);mesh(new THREE.SphereGeometry(.035+random()*.06,4,4),new THREE.MeshBasicMaterial({color:'#d7e5ee',fog:false}),scene,...v.toArray())}
// Earth uses the NASA Blue Marble-derived texture shipped with the three.js examples (public domain imagery).
const earthTexture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/earth-blue-marble-2048.jpg`);earthTexture.colorSpace=THREE.SRGBColorSpace;earthTexture.anisotropy=8;
const earth=mesh(new THREE.SphereGeometry(16,96,64),new THREE.MeshStandardMaterial({map:earthTexture,roughness:.9,metalness:0,fog:false}),scene,170,118,-430);earth.rotation.set(.35,-1.9,.1);
const earthAtmosphere=mesh(new THREE.SphereGeometry(16.6,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,fog:false,uniforms:{},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),3.);gl_FragColor=vec4(.35,.6,1.,1.)*f*.9;}'}),scene,170,118,-430);

// Whole white lower body; the dark band's front sector alone opens for the section view.
const BAND0=D.bandBottom.value,NOSE=D.noseProfile.value,BAND1=NOSE.base;
const lower=segment(4.5,D.bodyBottom.value,BAND0,0,Math.PI*2,hullMaterial(Math.PI*9,BAND0-D.bodyBottom.value),groups.hardware);
lower.castShadow=true;
// Smooth blunt-ogive nose radius at height y (also used to keep interior fittings inside it).
function noseRadiusAt(y){if(y<=NOSE.base)return NOSE.baseRadius;const s=THREE.MathUtils.clamp(1-(y-NOSE.base)/(NOSE.tip-NOSE.base-.12),0,1);return NOSE.tipRadius+(NOSE.baseRadius-NOSE.tipRadius)*Math.pow(s,NOSE.exponent)}
for(let i=0;i<96;i++){
  const a0=i*Math.PI*2/96,a1=(i+1)*Math.PI*2/96,mid=(a0+a1)/2;
  const front=Math.cos(mid)>0;
  const target=front?groups.shellFront:groups.shellBack;
  const w=D.windows.value;
  const isWindow=front && w.centersDeg.some(deg=>Math.abs(Math.atan2(Math.sin(mid-deg*Math.PI/180),Math.cos(mid-deg*Math.PI/180)))<w.widthDeg*Math.PI/360);
  const isGarageGate=Math.abs(Math.atan2(Math.sin(mid-Math.PI),Math.cos(mid-Math.PI)))<.31;
  const innerTarget=front?groups.innerFront:groups.interior;
  const gateTop=37.38;
  if(isGarageGate){segment(4.5,BAND0,35.05,a0,a1,M.collar,target);segment(4.5,gateTop,isWindow?w.bottom:BAND1,a0,a1,M.collar,target)}
  else segment(4.5,BAND0,isWindow?w.bottom:BAND1,a0,a1,M.collar,target);
  if(isWindow)segment(4.5,w.top,BAND1,a0,a1,M.collar,target);
  const innerStart=isGarageGate?gateTop:35.1,innerTop=BAND1-.05;
  segment(4.19,innerStart,isWindow?w.bottom:innerTop,a0,a1,M.lining,innerTarget);
  if(isWindow)segment(4.19,w.top,innerTop,a0,a1,M.lining,innerTarget);
}
// Curved vector decals sized from the reference render: flag ≈2.2 × 1.25 m, NASA mark ≈2.5 m wide.
function decalTexture(draw,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const flagTexture=decalTexture((ctx,w,h)=>{const sh=h/13;for(let i=0;i<13;i++){ctx.fillStyle=i%2?'#f4f2ec':'#b3203a';ctx.fillRect(0,i*sh,w,sh+1)}
  const cw=w*.4,ch=sh*7;ctx.fillStyle='#22336b';ctx.fillRect(0,0,cw,ch);ctx.fillStyle='#f4f2ec';
  const star=(x,y,r)=>{ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.4:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill()};
  for(let row=0;row<9;row++){const n=row%2?5:6;for(let col=0;col<n;col++)star(cw*(row%2?2:1)/12+col*cw/6,ch*(row+1)/10,ch*.042)}},1024,540);
const nasaTexture=decalTexture((ctx,w,h)=>{ctx.strokeStyle='#d5262d';ctx.lineWidth=h*.17;ctx.lineJoin='round';ctx.lineCap='butt';
  const pad=h*.12,gap=w*.05,lw=(w-2*pad-3*gap)/4,top=h*.16,bot=h*.9;let x=pad;
  const arch=(x0,x1)=>{ctx.beginPath();ctx.moveTo(x0,bot);ctx.lineTo(x0,top+(x1-x0)*.5);ctx.quadraticCurveTo(x0,top,(x0+x1)/2,top);ctx.quadraticCurveTo(x1,top,x1,top+(x1-x0)*.5);ctx.lineTo(x1,bot);ctx.stroke()};
  // N: stem with a forward-leaning shoulder into the right stem
  ctx.beginPath();ctx.moveTo(x,bot);ctx.lineTo(x,top+lw*.35);ctx.quadraticCurveTo(x,top,x+lw*.3,top+lw*.2);ctx.lineTo(x+lw*.75,bot-lw*.25);ctx.quadraticCurveTo(x+lw,bot,x+lw,bot-lw*.35);ctx.lineTo(x+lw,top);ctx.stroke();x+=lw+gap;
  // A without crossbar
  ctx.beginPath();ctx.moveTo(x,bot);ctx.lineTo(x+lw*.42,top+h*.04);ctx.quadraticCurveTo(x+lw*.5,top-h*.02,x+lw*.58,top+h*.04);ctx.lineTo(x+lw,bot);ctx.stroke();x+=lw+gap;
  // S as two rounded runs
  ctx.beginPath();ctx.moveTo(x+lw,top);ctx.lineTo(x+lw*.3,top);ctx.quadraticCurveTo(x,top,x,top+(bot-top)*.25);ctx.quadraticCurveTo(x,(top+bot)/2,x+lw*.3,(top+bot)/2);ctx.lineTo(x+lw*.7,(top+bot)/2);ctx.quadraticCurveTo(x+lw,(top+bot)/2,x+lw,bot-(bot-top)*.25);ctx.quadraticCurveTo(x+lw,bot,x+lw*.7,bot);ctx.lineTo(x,bot);ctx.stroke();x+=lw+gap;
  ctx.beginPath();ctx.moveTo(x,bot);ctx.lineTo(x+lw*.42,top+h*.04);ctx.quadraticCurveTo(x+lw*.5,top-h*.02,x+lw*.58,top+h*.04);ctx.lineTo(x+lw,bot);ctx.stroke()},1024,300);
function hullDecal(texture,width,height,y,centerDeg){const r=4.512,span=width/r,m=new THREE.MeshPhysicalMaterial({map:texture,transparent:true,roughness:.42,metalness:.05,clearcoat:.5,clearcoatRoughness:.3,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.FrontSide,depthWrite:false});const o=mesh(new THREE.CylinderGeometry(r,r,height,32,1,true,centerDeg*Math.PI/180-span/2,span),m,groups.decals,0,y,0);o.receiveShadow=true;return o}
hullDecal(flagTexture,2.25,1.19,BAND0-1.45,10);
hullDecal(nasaTexture,2.55,.75,BAND0-2.75,10);
const nosePoints=[];
for(let k=0;k<=40;k++){const y=NOSE.base+(NOSE.tip-.12-NOSE.base)*k/40;nosePoints.push(new THREE.Vector2(noseRadiusAt(y),y))}
for(let k=1;k<=8;k++){const a=k/8*Math.PI/2;nosePoints.push(new THREE.Vector2(NOSE.tipRadius*Math.cos(a),NOSE.tip-.12+.12*Math.sin(a)))}
const noseMaterial=hullMaterial(Math.PI*4.5,NOSE.tip-NOSE.base);
mesh(new THREE.LatheGeometry(nosePoints,96,-Math.PI/2,Math.PI),noseMaterial,groups.noseFront).castShadow=true;
mesh(new THREE.LatheGeometry(nosePoints,96,Math.PI/2,Math.PI),noseMaterial,groups.noseBack).castShadow=true;
torus(.56,.06,51.9,M.frame,groups.hardware,Math.PI*2,0,0,0);
// Band joints: protruding lips top and bottom, one mid ring and a row of vent holes along the bottom lip.
const lipMat=new THREE.MeshPhysicalMaterial({color:'#2a3138',roughness:.35,metalness:.7,clearcoat:.6});
// Band rings as front/back half-arcs so the front half disappears with the cut shell.
const GATE={half:.34,y0:35.0,y1:37.45},inGate=a=>Math.abs(Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI)))<GATE.half;
function bandRing(r,y,radius,material){const arcs=[[groups.shellFront,-Math.PI/2,Math.PI/2]];if(y>GATE.y0&&y<GATE.y1)arcs.push([groups.shellBack,Math.PI/2,Math.PI-GATE.half],[groups.shellBack,Math.PI+GATE.half,Math.PI*1.5]);else arcs.push([groups.shellBack,Math.PI/2,Math.PI*1.5]);
  for(const [g,a0,a1] of arcs){const pts=[],n=Math.max(4,Math.ceil((a1-a0)*16));for(let k=0;k<=n;k++)pts.push(polar(r,a0+(a1-a0)*k/n,y));tube(pts,radius,material,g)}}
for(const y of [BAND0+.04,BAND1-.04])bandRing(4.52,y,.05,lipMat);
const collarSeam=mat('#3d4952',.5,.5);
for(const y of [BAND0+.62,36.4,38.45,39.0,40.6,41.4,43.05])bandRing(4.506,y,.01,collarSeam);
bandRing(4.53,38.95,.07,lipMat);
for(let i=0;i<32;i++){const a=i*2*Math.PI/32,p=polar(4.512,a),g=Math.cos(a)>0?groups.shellFront:groups.shellBack;if(inGate(a)){rod([p[0],BAND0+.65,p[2]],[p[0],GATE.y0,p[2]],.007,collarSeam,g);rod([p[0],GATE.y1,p[2]],[p[0],BAND1-.08,p[2]],.007,collarSeam,g)}else rod([p[0],BAND0+.65,p[2]],[p[0],BAND1-.08,p[2]],.007,collarSeam,g)}
{const holeGeo=new THREE.CircleGeometry(.1,16),holeMat=mat('#8d969c',.5,.6);for(const [g,front] of [[groups.shellFront,true],[groups.shellBack,false]]){const holes=new THREE.InstancedMesh(holeGeo,holeMat,36);const o=new THREE.Object3D();let n=0;for(let i=0;i<72;i++){const a=i*2*Math.PI/72;if((Math.cos(a)>0)!==front)continue;o.position.set(...polar(4.509,a,BAND0+.32));o.rotation.set(0,a,0);o.updateMatrix();holes.setMatrixAt(n++,o.matrix)}holes.count=n;g.add(holes)}}
// Subtle body seams on the white hull, kept low-contrast as on the painted reference.
const hullSeam=mat('#c9cdcf',.6,.2);
for(let i=0;i<8;i++){const a=i*2*Math.PI/8+Math.PI/8,p=polar(4.503,a);rod([p[0],9.8,p[2]],[p[0],BAND0-.05,p[2]],.006,hullSeam,groups.hardware)}
// Rounded-rectangle windows (tall, softly radiused as in the render). Each window bay is an alpha-masked
// patch over the open shell sectors: dark hull with a rounded hole, inner lining, tinted glass and a gasket.
const WIN={width:.74,height:1.04,radius:.24,gasket:.07};
function windowMask(kind,spanM,heightM,centerU){const n=256,c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d');const sx=n/spanM,sy=n/heightM;
  const rr=(grow)=>{const w=(WIN.width+grow*2)*sx,h=(WIN.height+grow*2)*sy,x=centerU*n-w/2,y=n/2-h/2;ctx.beginPath();ctx.roundRect(x,y,w,h,[(WIN.radius+grow)*Math.min(sx,sy)*1.0]);};
  ctx.fillStyle=kind==='shell'?'#fff':'#000';ctx.fillRect(0,0,n,n);
  if(kind==='shell'){ctx.fillStyle='#000';rr(0);ctx.fill()}
  else if(kind==='glass'){ctx.fillStyle='#fff';rr(.01);ctx.fill()}
  else{ctx.fillStyle='#fff';rr(WIN.gasket);ctx.fill();ctx.fillStyle='#000';rr(0);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;return t}
const windowGlass=new THREE.MeshPhysicalMaterial({color:'#1d2a33',roughness:.05,metalness:.1,clearcoat:1,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false});
const gasket=new THREE.MeshStandardMaterial({color:'#0c0f12',roughness:.7,metalness:.2,side:THREE.DoubleSide});
{const w=D.windows.value,step=Math.PI*2/96,h=w.top-w.bottom;
  for(const deg of w.centersDeg){const c=deg*Math.PI/180;let a0=Infinity,a1=-Infinity;
    for(let i=0;i<96;i++){const mid=(i+.5)*step;if(Math.cos(mid)>0&&Math.abs(Math.atan2(Math.sin(mid-c),Math.cos(mid-c)))<w.widthDeg*Math.PI/360){let s0=i*step;if(s0>Math.PI)s0-=Math.PI*2;a0=Math.min(a0,s0);a1=Math.max(a1,s0+step)}}
    const centerU=(c-a0)/(a1-a0);
    const shell=M.collar.clone();shell.alphaMap=windowMask('shell',4.5*(a1-a0),h,centerU);shell.alphaTest=.5;segment(4.5,w.bottom,w.top,a0,a1,shell,groups.shellFront);
    const lining=M.inner.clone();lining.alphaMap=windowMask('shell',4.19*(a1-a0),h,centerU);lining.alphaTest=.5;segment(4.19,w.bottom,w.top,a0,a1,lining,groups.innerFront);
    // reveal: a short rounded tube joining hull and lining around the opening
    const glass=windowGlass.clone();glass.alphaMap=windowMask('glass',4.44*(a1-a0),h,centerU);glass.alphaTest=.3;segment(4.44,w.bottom,w.top,a0,a1,glass,groups.windows);
    const ring=gasket.clone();ring.alphaMap=windowMask('gasket',4.513*(a1-a0),h,centerU);ring.alphaTest=.5;segment(4.513,w.bottom,w.top,a0,a1,ring,groups.windows);
  }}
// Aft closure: dark engine bay plate under the skirt.
{const aft=mesh(new THREE.CircleGeometry(4.48,64),mat('#1b2025',.6,.6),groups.hardware,0,D.bodyBottom.value+.02,0);aft.rotation.x=Math.PI/2}
// Four landing legs. Each sits in a tall white shroud that is open on its outboard face; the concave
// interior and the hull behind it are bare metal, deep enough for the folded strut (as in the render).
const legMetal=new THREE.MeshPhysicalMaterial({color:'#d9dcdd',roughness:.32,metalness:.75,clearcoat:.4,clearcoatRoughness:.3});
const bayMetal=new THREE.MeshPhysicalMaterial({color:'#a3aaae',roughness:.36,metalness:.9,side:THREE.DoubleSide});
const bayBack=new THREE.MeshPhysicalMaterial({color:'#b4bbbf',roughness:.45,metalness:.8,side:THREE.DoubleSide});
const padMat=new THREE.MeshPhysicalMaterial({color:'#17191b',roughness:.55,metalness:.5,clearcoat:.3});
const BAY={r:1.05,top:9.2,open:Math.PI*.62};
const bayProfile=[new THREE.Vector2(1.12,D.bodyBottom.value-.08),new THREE.Vector2(1.1,3.2),new THREE.Vector2(1.02,6.6),new THREE.Vector2(.92,BAY.top-1.2)];
for(let k=1;k<=14;k++){const t=k/14*Math.PI/2;bayProfile.push(new THREE.Vector2(.92*Math.cos(t)+.001,BAY.top-1.2+1.2*Math.sin(t)))}
const bayGeometry=new THREE.LatheGeometry(bayProfile,56,BAY.open/2,Math.PI*2-BAY.open);
const shroudMaterial=hullMaterial(7,9);shroudMaterial.side=THREE.FrontSide;
for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;
  const radial=new THREE.Vector3(Math.sin(a),0,Math.cos(a)),side=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));
  const at=(r,y,lat=0)=>radial.clone().multiplyScalar(r).add(side.clone().multiplyScalar(lat)).setY(y).toArray();
  const g=new THREE.Group();g.position.set(...at(4.42,0));g.rotation.y=a;groups.hardware.add(g);
  const outer=mesh(bayGeometry,shroudMaterial,g);outer.castShadow=true;outer.receiveShadow=true;
  const inner=mesh(bayGeometry,bayMetal,g);inner.scale.set(.97,.995,.97);inner.receiveShadow=true;
  // rim lip along the open edges
  for(const sgn of [-1,1]){const ang=sgn*BAY.open/2;const pts=bayProfile.map(p=>[Math.sin(ang)*p.x,p.y,Math.cos(ang)*p.x]);const lip=tube(pts,.035,legMetal,g)}
  // bare metal hull panel at the back of the bay
  // flat metal back plate closing the bay just proud of the hull; its outline follows the shroud profile
  {const zPlate=.13,shape=new THREE.Shape(),half=bayProfile.map(p=>[Math.sqrt(Math.max(0,(p.x*.97)**2-zPlate**2)),p.y]);
    shape.moveTo(-half[0][0],half[0][1]);for(const [w,y] of half)shape.lineTo(-w,y);for(const [w,y] of [...half].reverse())shape.lineTo(w,y);shape.closePath();
    const plate=mesh(new THREE.ShapeGeometry(shape,24),bayBack,g,0,0,zPlate);plate.receiveShadow=true}
  // primary strut from a pivot high inside the bay down to the pad
  const pivot=at(4.95,7.9),padC=at(8.9,.5);
  beam(pivot,padC,.42,.34,legMetal);
  mesh(new THREE.CylinderGeometry(.2,.2,.6,20),legMetal,groups.hardware,...pivot).rotation.set(0,a,Math.PI/2);
  // telescoping damper inside the strut line
  const knee=new THREE.Vector3(...pivot).lerp(new THREE.Vector3(...padC),.68).toArray();
  // lower V-brace from the bay base to the knee
  for(const lat of [-.62,.62])beam(at(5.15,2.55,lat),knee,.2,.18,legMetal);
  beam(at(5.15,2.55,-.62),at(5.15,2.55,.62),.18,.18,legMetal);
  // footpad: broad, shallow, dark dish with a ball joint
  const foot=mesh(new THREE.CylinderGeometry(1.15,1.28,.14,48),padMat,groups.hardware,padC[0],.08,padC[2]);foot.castShadow=true;foot.receiveShadow=true;
  mesh(new THREE.SphereGeometry(.3,20,14),legMetal,groups.hardware,padC[0],.36,padC[2]).castShadow=true;
}

// External lift: twin guide rails, a ground pad, a moving railed car and three call panels.
// The car is open on its hull side; at the top its floor is flush with Deck A and the garage gate.
const LIFT={halfX:1.3,z0:-6.55,z1:-4.35,cz:-5.45,bottom:.25,top:D.decks.value[0],speed:2.8,accel:.9};
for(const x of [-1.52,1.52]){rod([x,0,LIFT.cz],[x,38.3,LIFT.cz],.09,M.frame,groups.hardware);rod([x,38.1,LIFT.cz],[x*.9,38.1,-4.45],.06,M.frame,groups.hardware)}
rod([-1.52,38.3,LIFT.cz],[1.52,38.3,LIFT.cz],.08,M.frame,groups.hardware);
box(2.9,.13,2.5,0,.065,LIFT.cz,M.floor,groups.hardware);
const liftCar=new THREE.Group();liftCar.position.set(0,LIFT.bottom,LIFT.cz);groups.hardware.add(liftCar);
box(2.6,.12,2.2,0,-.06,0,M.tread,liftCar);
for(let i=0;i<21;i++)box(2.5,.012,.03,0,.006,-1+i*.1,M.frame,liftCar);
// Cage after the NASA elevator render: dark square-tube frame, X-bracing, perforated lower panels, steel U-rails.
const cageMat=new THREE.MeshPhysicalMaterial({color:'#2c3135',roughness:.45,metalness:.7});
const perf=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,256,256);g.fillStyle='#000';for(let y=8;y<256;y+=14)for(let x=8;x<256;x+=14)g.fillRect(x,y,7,5);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1.2);return t})();
const perfMat=new THREE.MeshStandardMaterial({color:'#7d858a',roughness:.5,metalness:.6,alphaMap:perf,alphaTest:.5,side:THREE.DoubleSide});
const CAGE=2.5;
for(const [x,z] of [[-1.25,-1.05],[1.25,-1.05],[-1.25,.95],[1.25,.95]])box(.08,CAGE,.08,x,CAGE/2,z,cageMat,liftCar);
box(2.58,.08,.08,0,CAGE,-1.05,cageMat,liftCar);for(const x of [-1.25,1.25]){box(.08,.08,2.08,x,CAGE,-.05,cageMat,liftCar);box(.06,.06,2.0,x,1.15,-.05,cageMat,liftCar)}
box(2.5,.06,.06,0,1.15,-1.05,cageMat,liftCar);
for(const x of [-1.25,1.25]){beam([x,.1,-1.0],[x,1.12,.9],.04,.04,cageMat,liftCar);beam([x,.1,.9],[x,1.12,-1.0],.04,.04,cageMat,liftCar);beam([x,1.18,-1.0],[x,2.42,.9],.04,.04,cageMat,liftCar)}
for(const [w,h,x,z,ry] of [[2.0,.9,-1.25,-.05,Math.PI/2],[2.0,.9,1.25,-.05,Math.PI/2],[2.45,.9,0,-1.05,0]]){const pnl=mesh(new THREE.PlaneGeometry(w,h),perfMat,liftCar,x,.5,z);pnl.rotation.y=ry}
const liftRail=new THREE.MeshPhysicalMaterial({color:'#d3d8db',roughness:.16,metalness:1});
for(const x of [-1.05,1.05])tube([[x,0,.95],[x,1.0,.95],[x,1.05,.85],[x,1.0,.6],[x,0,.6]].map(([a,b,c])=>[a,b,c]),.022,liftRail,liftCar);
// Interactive call panels (first-person mode uses E or click; the viewer can watch the car move).
const interactables=[];
function callPanel(pos,rotY,parent,label,action){const g=new THREE.Group();g.position.set(...pos);g.rotation.y=rotY;parent.add(g);box(.24,.36,.07,0,0,0,M.dark,g);
  const button=mesh(new THREE.CylinderGeometry(.06,.06,.035,28),new THREE.MeshStandardMaterial({color:'#2a0d08',emissive:'#ff6a3d',emissiveIntensity:.7,roughness:.4}),g,0,.03,.045);button.rotation.x=Math.PI/2;
  const lamp=mesh(new THREE.CircleGeometry(.025,16),new THREE.MeshBasicMaterial({color:'#7dffb0'}),g,0,-.11,.036);
  interactables.push({mesh:button,label,action});return button}
const lift={y:LIFT.bottom,target:LIFT.bottom,v:0,
  get moving(){return Math.abs(this.target-this.y)>1e-3},
  get atTop(){return this.target===LIFT.top},
  go(level){this.target=level==='top'?LIFT.top:LIFT.bottom},
  update(dt){const d=this.target-this.y;if(Math.abs(d)<1e-3){this.y=this.target;this.v=0}else{const vmax=Math.min(LIFT.speed,Math.sqrt(2*LIFT.accel*Math.abs(d))+.05);this.v=Math.sign(d)*Math.min(vmax,Math.abs(this.v)+LIFT.accel*dt);const step=this.v*dt;this.y=Math.abs(step)>=Math.abs(d)?this.target:this.y+step}liftCar.position.y=this.y},
  bounds(){return {x0:-LIFT.halfX,x1:LIFT.halfX,z0:LIFT.z0,z1:LIFT.z1,floor:this.y,rails:[[[-1.25,LIFT.cz-1.05],[1.25,LIFT.cz-1.05]],[[-1.25,LIFT.cz-1.05],[-1.25,LIFT.cz+1.0]],[[1.25,LIFT.cz-1.05],[1.25,LIFT.cz+1.0]]]}}};
const groundPost=rod([2.7,0,-7.3],[2.7,1.2,-7.3],.05,M.frame,groups.hardware);
callPanel([2.7,1.15,-7.37],Math.PI,groups.hardware,()=>lift.moving?'Lift moving…':(lift.atTop?'Call lift down':'Lift is here'),()=>lift.go('bottom'));
callPanel([1.3,36.25,-4.2],Math.PI,groups.interior,()=>lift.moving?'Lift moving…':(lift.atTop?'Lift is here':'Call lift up'),()=>lift.go('top'));
callPanel([.55,.95,-1.0],0,liftCar,()=>lift.moving?'Lift moving…':(lift.atTop?'Go down to the surface':'Go up to the garage'),()=>lift.go(lift.atTop?'bottom':'top'));

// Vertical circulation after the SpaceX cabin render: steep straight "ship's ladder" stairs beside a central
// storage core with numbered doors, not a spiral. Two 0.8 m lanes flank the core; flights alternate lanes and
// direction (A→B left lane toward -Z, B→C right lane toward +Z, C→D left lane toward -Z). Each deck has a
// rectangular opening only above the flight that arrives at it. Stair angle ≈ 50°, 13 risers of 0.223 m.
const STAIR={core:.2,lane:.8,half:1.2,risers:13};
const lanes={L:[-STAIR.core-STAIR.lane,-STAIR.core],R:[STAIR.core,STAIR.core+STAIR.lane]};
const flights=[{lane:'L',dir:-1},{lane:'R',dir:1},{lane:'L',dir:-1}];      // dir: horizontal travel along Z going up
const holeFor=[null,flights[0],flights[1],flights[2]];                   // opening in deck k above flight k-1
const CLEAR=D.deckSpacing.value-D.floorThickness.value;
function annularFloor(y,i){const shape=new THREE.Shape();shape.absarc(0,0,4.18,0,Math.PI*2,false);const f=holeFor[i];
  if(f){const [x0,x1]=lanes[f.lane],z0=-STAIR.half-.07,z1=STAIR.half+.07,hole=new THREE.Path();hole.moveTo(x0,-z0);hole.lineTo(x0,-z1);hole.lineTo(x1,-z1);hole.lineTo(x1,-z0);hole.closePath();shape.holes.push(hole)}
  const g=new THREE.ExtrudeGeometry(shape,{depth:D.floorThickness.value,bevelEnabled:false,curveSegments:96});g.rotateX(Math.PI/2);const o=mesh(g,M.floor,groups.interior,0,y,0);o.receiveShadow=true;o.userData.collider=true;return o}
D.decks.value.forEach(annularFloor);
// Deck A garage opening in the -Z shell: bridge to external platform, with clear gate.
box(2.5,.12,.65,0,35.04,-4.43,M.floor,groups.interior);
const stairRail=new THREE.MeshPhysicalMaterial({color:'#d3d8db',roughness:.16,metalness:1,clearcoat:.3});
const stairMetal=new THREE.MeshPhysicalMaterial({color:'#2a2f33',roughness:.45,metalness:.7});
function colliderStrip(points,bottom,top){const pos=[],idx=[];points.forEach((p,i)=>{pos.push(p[0],p[1]+bottom,p[2],p[0],p[1]+top,p[2]);if(i){const n=i*2;idx.push(n-2,n-1,n,n-1,n+1,n)}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);const o=new THREE.Mesh(g);o.updateMatrixWorld();extraColliders.push(o);return o}
function colliderQuad(a,b,c,d){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...d],3));g.setIndex([0,1,2,0,2,3]);const o=new THREE.Mesh(g);o.userData.collider=true;o.updateMatrixWorld();extraColliders.push(o);return o}
flights.forEach((f,k)=>{
  const y0=D.decks.value[k],rise=D.deckSpacing.value/STAIR.risers,run=2*STAIR.half/STAIR.risers,[x0,x1]=lanes[f.lane],xc=(x0+x1)/2,outer=f.lane==='L'?x0:x1,inner=f.lane==='L'?x1:x0;
  const zAt=i=>-f.dir*STAIR.half+f.dir*i*run;                               // z of riser i (0 = bottom edge)
  // treads: dark grated steel with a bright nosing strip
  for(let i=1;i<STAIR.risers;i++){const z=zAt(i)+f.dir*run*.5,y=y0+i*rise;box(STAIR.lane-.04,.04,run+.04,xc,y-.02,z,stairMetal);box(STAIR.lane-.04,.012,.025,xc,y+.002,zAt(i)+f.dir*.012,stairRail)}
  // stringers on both sides
  const sb=[0,y0-.08,zAt(0)],st=[0,y0+D.deckSpacing.value-.1,zAt(STAIR.risers)];
  for(const x of [x0+.02,x1-.02])beam([x,sb[1],sb[2]],[x,st[1],st[2]],.04,.22,stairMetal);
  // handrails: outer flat bar on posts, inner bar on brackets off the core
  const railPts=[];for(let t=0;t<=1.0001;t+=.1)railPts.push([outer+(f.lane==='L'?.03:-.03),y0+.95+t*(D.deckSpacing.value),zAt(t*STAIR.risers)]);
  flatBar(railPts,.07,.018,stairRail);for(const t of [.08,.5,.92]){const p=[outer+(f.lane==='L'?.03:-.03),y0+t*D.deckSpacing.value,zAt(t*STAIR.risers)];flatPost(p,.95,0,stairRail)}
  tube([[inner+(f.lane==='L'?-.06:.06),y0+.9,zAt(0)],[inner+(f.lane==='L'?-.06:.06),y0+.9+D.deckSpacing.value,zAt(STAIR.risers)]],.02,stairRail);
  // walkable collision ramp across the lane, and an invisible wall under the outer handrail
  const zb=zAt(0),zt=zAt(STAIR.risers),yt=y0+D.deckSpacing.value;
  colliderQuad([x0,y0,zb],[x1,y0,zb],[x1,yt,zt],[x0,yt,zt]);
  colliderStrip([[outer,y0,zb],[outer,yt,zt]],-.2,1.1);
});
// central storage core (numbered doors on its Z faces, as in the render) for decks A-C
{const num=n=>{const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#202427';g.fillRect(0,0,128,64);g.fillStyle='#8f9699';g.font='600 34px Space Grotesk, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n).padStart(2,'0'),64,34);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  let n=1;for(let k=0;k<3;k++){const y=D.decks.value[k];box(STAIR.core*2,CLEAR,2*STAIR.half+.12,0,y+CLEAR/2,0,stairMetal);
    for(const zs of [-1,1])for(let r=0;r<2;r++){const yy=y+.62+r*1.1;box(.36,1.0,.02,0,yy,zs*(STAIR.half+.07),M.dark);box(.18,.015,.02,0,yy-.25,zs*(STAIR.half+.085),M.rail);const lab=mesh(new THREE.PlaneGeometry(.12,.06),new THREE.MeshStandardMaterial({map:num(n),roughness:.6}),groups.interior,0,yy+.38,zs*(STAIR.half+.082));if(zs<0)lab.rotation.y=Math.PI;n+=2}}}
// guard rails around each deck opening: outer long side + the far end (above the flight's foot);
// on Deck D the core is absent, so the inner side gets a rail too
D.decks.value.forEach((y,k)=>{const f=holeFor[k];if(!f)return;const [x0,x1]=lanes[f.lane],outer=f.lane==='L'?x0-.05:x1+.05,inner=f.lane==='L'?x1+.05:x0-.05,zFoot=-f.dir*(STAIR.half+.1),zTop=f.dir*(STAIR.half+.1);
  const sides=[[[outer,zTop],[outer,zFoot]],[[outer,zFoot],[inner,zFoot]]];if(k===3)sides.push([[inner,zFoot],[inner,zTop]]);
  for(const [[ax,az],[bx,bz]] of sides){for(const h of [1.0,.52])flatBar([[ax,y+h,az],[(ax+bx)/2,y+h,(az+bz)/2],[bx,y+h,bz]],h>.9?.075:.035,.018,stairRail);
    const len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(len/.8));for(let i=0;i<=n;i++)flatPost([ax+(bx-ax)*i/n,y,az+(bz-az)*i/n],1.0,Math.atan2(bx-ax,bz-az)+Math.PI/2,stairRail);
    colliderStrip([[ax,y,az],[bx,y,bz]],0,1.1)}});

// Window-side upper room shell seams, light bands and readable deck markers.
for(const y of D.decks.value){const top=Math.min(y+2.65,BAND1-.1),inNose=y>=BAND1-.2,lightY=inNose?y+2.2:top,lr=Math.min(4.11,noseRadiusAt(lightY)-.18);if(!inNose)for(let i=0;i<14;i++){const a=i*2*Math.PI/14,p=polar(4.15,a);if(y<36&&inGate(a))continue;rod([p[0],y+.24,p[2]],[p[0],top,p[2]],.012,M.panel,Math.cos(a)>0?groups.innerFront:groups.interior)}for(let i=0;i<32;i++){const a=i*2*Math.PI/32,p0=polar(lr,a,lightY),p1=polar(lr,a+2*Math.PI/32,lightY);rod(p0,p1,.016,M.light,Math.cos(a+Math.PI/32)>0?groups.innerFront:groups.interior)} }
deckNames.forEach((name,i)=>label(name,5.8,D.decks.value[i]+1.3,1.3,.93,'#d7f6fb',groups.labels));
for(const [i,y] of D.decks.value.entries()){for(const a of [Math.PI*.25,Math.PI*1.25]){const l=new THREE.PointLight(i===3?'#ffe9cc':'#eef6ff',7,8,1.6);l.position.set(...polar(2.7,a,y+(i===3?2.1:2.45)));groups.interior.add(l)}}

// Airlocks, garage, Deck B rooms, control deck furniture and berths (see src/interior.js).
const interior=buildInterior({D,M,groups,box,rod,mesh,tube,beam,label,polar,solids,renderer});
M.lining.map=interior.panelMap;M.lining.needsUpdate=true;
// A short, explicitly non-deck docking access ladder in the upper void.
const topDeck=D.decks.value[3];
// Inclined ladder: foot on the Deck D floor beside the stair opening, head inside the docking tunnel.
{const cx=.32,foot=new THREE.Vector3(cx,topDeck,1.0),head=new THREE.Vector3(cx,49.55,-.15);
  for(const x of [cx-.34,cx+.34])rod([x,foot.y,foot.z],[x,head.y,head.z],.04,M.frame);
  for(let k=1;k<18;k++){const p=foot.clone().lerp(head,k/18);rod([cx-.34,p.y,p.z],[cx+.34,p.y,p.z],.022,M.frame)}}
// Docking tunnel: a closed white vestibule from the ladder head to the nose docking port.
{const tunnelY0=49.3,tunnelY1=51.86;mesh(new THREE.CylinderGeometry(.78,.78,tunnelY1-tunnelY0,48,1,true),M.inner,groups.interior,0,(tunnelY0+tunnelY1)/2,0).receiveShadow=true;
  torus(.8,.06,tunnelY0,M.frame,groups.interior,Math.PI*2,0,0,0);
  const cone=mesh(new THREE.CylinderGeometry(.8,1.35,.35,48,1,true),M.inner,groups.interior,0,tunnelY0-.17,0);
  const hatch=mesh(new THREE.CylinderGeometry(.62,.62,.08,40),M.dark,groups.interior,0,tunnelY1-.25,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,p=polar(.7,a,tunnelY1-.25);mesh(new THREE.SphereGeometry(.03,8,6),M.frame,groups.interior,...p)}}

// Astronauts: NASA Z2 planetary spacesuit (NASA 3D Resources), scaled to a 1.85 m suited height.
// One stands outside the footpads as the scale reference; two wait at the lift's ground station.
const astronauts=[];
const draco=new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
new GLTFLoader().setDRACOLoader(draco).load(`${import.meta.env.BASE_URL}models/nasa-z2-spacesuit.glb`,gltf=>{
  const base=gltf.scene;base.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.envMapIntensity=.8}}});
  const box=new THREE.Box3().setFromObject(base),size=box.getSize(new THREE.Vector3()),scale=1.85/size.y;
  base.scale.setScalar(scale);base.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);
  for(const [x,z,ry] of [[10,7,-.9],[-.55,-5.2,Math.PI*.95],[.6,-5.75,Math.PI*1.1]]){const holder=new THREE.Group();holder.add(base.clone());holder.position.set(x,Math.max(0,lunar.heightAt(x,z))+(Math.hypot(x,z)<7?.13:0),z);holder.rotation.y=ry;holder.userData.atLift=Math.hypot(x,z)<7;astronauts.push(holder);scene.add(holder)}
});
label('1.8 m human',10,2.4,7,.72);
const capsule=mesh(new THREE.CapsuleGeometry(.3,1.2,8,16),new THREE.MeshBasicMaterial({color:'#58d7ee',transparent:true,opacity:.32,depthWrite:false}),groups.debug,0,36,2.6);
capsule.userData={height:1.8,radius:.3,role:'clearance reference'};
label('1.8 m × 0.3 m',0,37.25,2.6,.46,'#88efff',groups.debug);
// Dimensions and nominal lift level stay visible only when guides are enabled.
line([11,0,0],[11,52,0]);for(const y of [0,52])line([10.6,y,0],[11.4,y,0]);label('52 m · PUBLISHED',12.7,26,0,.65,'#b9f1ff',groups.guides);
line([-4.5,33.7,6],[4.5,33.7,6]);for(const x of [-4.5,4.5])line([x,33.45,6],[x,33.95,6]);label('9 m · PUBLISHED',0,32.8,6,.62,'#b9f1ff',groups.guides);
line([-8,0,-5.6],[-8,35.1,-5.6]);label('35.1 m LIFT',-9.9,17.55,-5.6,.6,'#b9f1ff',groups.guides);

// Simple route landmarks make the future avatar path explicit in model data.
scene.userData.navigation={unit:'metre',avatar:{height:1.8,radius:.3},decks:D.decks.value,stair:{type:'straight',lanes,flights,risersPerFlight:STAIR.risers,riser:D.deckSpacing.value/STAIR.risers,run:2*STAIR.half/STAIR.risers},hatches:{clearWidth:1.2,clearHeight:2.15,open:true},airlocks:[{center:[-2.55,0],clearSize:[2,2.83,2.3]},{center:[2.55,0],clearSize:[2,2.83,2.3]}],lift:{upperY:35.1,platform:[2.6,2.2]},route:['surface','lift','garage','either outer hatch','separate airlock','inner hatch','Deck A hall','straight stairs','Deck B ring','Deck C ring','Deck D ring']};

const presets=[
  ['Full ship','Exterior','exterior',[24,9,64],[0,25,0],'Complete 52 m silhouette, four landing legs and the upper lift.'],
  ['Section','A–D','cutaway',[20,44,49],[0,40,0],'Front-half section reveals all four decks and continuous stair.'],
  ['Deck A','Airlocks','cutaway',[13,40,16],[0,36.2,0],'Two distinct 13 m³ airlocks lead to the garage and lift.'],
  ['Deck B','Systems','cutaway',[12,43,15],[0,39.1,0],'Hygiene, science, storage and compact exercise.'],
  ['Deck C','Control','cutaway',[14,45,18],[0,41.9,0],'Four observed seat positions facing individual windows.'],
  ['Deck D','Habitation','cutaway',[12,48.5,15],[0,44.8,0],'Four berth pods and a compact galley under the nose.'],
  ['Lift','Garage','cutaway',[12,39,-16],[0,35,-4.5],'Lift upper station aligns with the Deck A garage floor.'],
  ['Top plan','Debug','cutaway',[.01,61,0],[0,41.5,0],'Inspect deck layout, the stair core and the straight stair openings.']
];
const presetList=$('#presets');presets.forEach((p,i)=>{const b=document.createElement('button');b.className='preset'+(i===0?' active':'');b.innerHTML=`<span>${p[0]}</span><small>${p[1]}</small>`;b.onclick=()=>setPreset(i);presetList.append(b)});
let shellMode='exterior',targetCamera=null;
function setMode(mode){shellMode=mode;$('#shell-mode').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));const ext=mode==='exterior',ghost=mode==='ghost';groups.shellFront.visible=ext||ghost;groups.noseFront.visible=ext||ghost;groups.innerFront.visible=false;groups.windows.visible=ext||ghost;groups.decals.visible=ext||ghost;groups.interior.visible=true;groups.labels.visible=!ext&&$('[data-toggle="labels"]').classList.contains('on');groups.shellBack.visible=true;groups.noseBack.visible=true;for(const g of [groups.shellFront,groups.shellBack,groups.noseFront,groups.noseBack])g.traverse(o=>{if(o.isMesh){o.material.transparent=ghost;o.material.opacity=ghost?.13:1;o.material.depthWrite=!ghost}});$('#view-status').textContent=`${mode.toUpperCase()} · ${$('.preset.active span')?.textContent||'CUSTOM VIEW'}`}
function setPreset(i){const p=presets[i];presetList.querySelectorAll('.preset').forEach((b,j)=>b.classList.toggle('active',j===i));setMode(p[2]);targetCamera={position:new THREE.Vector3(...p[3]),target:new THREE.Vector3(...p[4])};$('#view-description').textContent=p[5];$('#view-status').textContent=`${p[2].toUpperCase()} · ${p[0].toUpperCase()}`}
$('#shell-mode').addEventListener('click',e=>{if(e.target.dataset.mode)setMode(e.target.dataset.mode)});
function setToggle(name,on){const b=document.querySelector(`[data-toggle="${name}"]`);b.classList.toggle('on',on);if(name==='labels'){$('#labels-chip').classList.toggle('on',on);groups.labels.visible=on&&shellMode!=='exterior'}else groups[name].visible=on}
document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>setToggle(b.dataset.toggle,!b.classList.contains('on')));
$('#labels-chip').onclick=()=>setToggle('labels',!$('#labels-chip').classList.contains('on'));
addEventListener('keydown',e=>{if(e.key==='l'||e.key==='L')setToggle('labels',!$('#labels-chip').classList.contains('on'))});
$('.mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
document.querySelectorAll('.preset,#shell-mode button').forEach(b=>b.addEventListener('click',()=>$('.sidebar').classList.remove('open')));
setMode('exterior');
if(import.meta.env.DEV)window.__view={camera,orbit,THREE,scene};
// ---------- First-person mode (desktop only)
function isUnder(o,ancestor){for(let p=o;p;p=p.parent)if(p===ancestor)return true;return false}
function buildCollisionOctree(){
  scene.updateMatrixWorld(true);
  // Octree triangles only push from their front side, so open surfaces (shell, rails, ramps) get a reversed twin.
  const flipped=geo=>{const g=geo.index?geo.toNonIndexed():geo.clone(),p=g.attributes.position;for(let i=0;i<p.count;i+=3){const x=p.getX(i+1),y=p.getY(i+1),z=p.getZ(i+1);p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,x,y,z)}return g};
  const root=new THREE.Group(),add=(geo,matrix,twoSided=true)=>{for(const g of twoSided?[geo,flipped(geo)]:[geo]){const m=new THREE.Mesh(g);m.matrixAutoUpdate=false;m.matrix.copy(matrix);root.add(m)}};
  for(const {mesh,w,h,d} of solids){if(isUnder(mesh,liftCar)||Math.min(w,h,d)<.025)continue;add(new THREE.BoxGeometry(w,h,d),mesh.matrixWorld,false)}
  const shell=o=>o.geometry.type==='CylinderGeometry'&&o.geometry.parameters.openEnded&&o.geometry.parameters.radiusTop>=4;
  const take=(g,test)=>g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!isUnder(o,liftCar)&&test(o))add(o.geometry,o.matrixWorld)});
  for(const g of [groups.shellFront,groups.shellBack,groups.innerFront])take(g,shell);
  take(groups.interior,o=>shell(o)||o.userData.collider);
  take(groups.hardware,o=>(o.geometry.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop>=.5)||o.geometry.type==='LatheGeometry');
  take(groups.noseFront,()=>true);take(groups.noseBack,()=>true);
  for(const o of extraColliders)add(o.geometry,o.matrixWorld);
  return new Octree().fromGraphNode(root);
}
// Phones and tablets get on-screen controls; desktops use pointer lock + keyboard.
const isTouch=matchMedia('(pointer: coarse)').matches&&!matchMedia('(hover: hover)').matches;
const canWalk=isTouch||matchMedia('(hover: hover) and (pointer: fine)').matches;
if(isTouch){$('.fp-hud').classList.add('touch');$('#fp-help').innerHTML='<strong>First person</strong><span><b>Left thumb</b> anywhere on the left half to move</span><span><b>Right thumb</b> drag on the right half to look</span><span><b>USE</b> presses the lift button you look at · <b>RUN</b> toggles running</span><span>Touch to start</span>';
  sun.shadow.mapSize.set(2048,2048)}
const hud=$('.fp-hud');
const fp=createFirstPerson({camera,domElement:renderer.domElement,buildOctree:buildCollisionOctree,heightAt:(x,z)=>lunar.heightAt(x,z),lift,interactables,
  touchUI:isTouch?{zone:$('#fp-stickzone'),stick:$('#fp-stick'),knob:$('#fp-knob'),useButton:$('#fp-use'),runButton:$('#fp-run')}:null,
  ui:{setLocked:on=>$('#fp-help').classList.toggle('show',!on),touched:()=>$('#fp-help').classList.remove('show'),setPrompt:html=>{$('#fp-prompt').innerHTML=html;$('#fp-prompt').classList.toggle('show',!!html)}}});
function enterFirstPerson(){
  targetCamera=null;orbit.enabled=false;app.classList.add('fp');hud.hidden=false;
  setMode('exterior');groups.innerFront.visible=true;groups.labels.visible=false;groups.detailLabels.visible=false;groups.guides.visible=false;groups.debug.visible=false;
  for(const a of astronauts)if(a.userData.atLift)a.visible=false;
  camera.fov=70;camera.updateProjectionMatrix();
  fp.enter(new THREE.Vector3(3.2,0,-12),new THREE.Vector3(0,3,-5.45));
  if(isTouch){$('#fp-help').classList.add('show');const root=document.documentElement;if(root.requestFullscreen&&!document.fullscreenElement)root.requestFullscreen({navigationUI:'hide'}).then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{})}
}
function exitFirstPerson(){
  fp.exit();app.classList.remove('fp');hud.hidden=true;orbit.enabled=true;
  if(document.fullscreenElement){screen.orientation?.unlock?.();document.exitFullscreen().catch(()=>{})}
  for(const a of astronauts)a.visible=true;
  camera.fov=45;camera.updateProjectionMatrix();
  setToggle('guides',$('[data-toggle="guides"]').classList.contains('on'));setToggle('debug',$('[data-toggle="debug"]').classList.contains('on'));
  setPreset(0);
}
if(canWalk)$('#walk-btn').onclick=enterFirstPerson;else $('#walk-btn').remove();
$('#fp-exit').onclick=exitFirstPerson;
if(import.meta.env.DEV)Object.assign(window.__view,{fp,lift,enterFirstPerson,exitFirstPerson,interactables,renderOnce:()=>{composer.render();renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,camera);renderer.autoClear=true}});
// Post-processing: GTAO grounds furniture, seams and leg bays; OutputPass applies tone mapping and sRGB.
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const gtao=new GTAOPass(scene,camera,1,1);gtao.updateGtaoMaterial({radius:.6,distanceExponent:1.4,thickness:1.2,scale:1.1,samples:16});gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16});gtao.blendIntensity=.9;gtao.normalMaterial.side=THREE.DoubleSide;if(isTouch)gtao.enabled=false;composer.addPass(gtao);
composer.addPass(new OutputPass());
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setPixelRatio(Math.min(devicePixelRatio,1.5));composer.setSize(w,h)}
new ResizeObserver(resize).observe(viewport);resize();
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);lift.update(dt);if(fp.active){fp.update(dt)}else{if(targetCamera){const f=1-Math.exp(-dt*4);camera.position.lerp(targetCamera.position,f);orbit.target.lerp(targetCamera.target,f);if(camera.position.distanceTo(targetCamera.position)<.01&&orbit.target.distanceTo(targetCamera.target)<.01)targetCamera=null}orbit.update();if(camera.position.y<.5){camera.position.y=.5}}groups.detailLabels.visible=!fp.active&&shellMode!=='exterior'&&groups.labels.visible&&camera.position.distanceTo(orbit.target)<24;{const decks=D.decks.value;let base=decks[0];for(const y of decks)if(orbit.target.y>=y-.6)base=y;for(const l of groups.detailLabels.children)l.visible=l.position.y>=base-.2&&l.position.y<base+D.deckSpacing.value-.05}composer.render();renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,camera);renderer.autoClear=true}animate();
