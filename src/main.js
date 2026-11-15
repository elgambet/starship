import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
</aside><main class="viewport"><div class="topbar"><div class="title">CREWED LUNAR LANDER / SECTION STUDY</div><div class="status" id="view-status">EXTERIOR · FULL SHIP</div></div><div class="layer-tooltip" id="view-description">Orbit the complete vehicle, then choose Cutaway to inspect the four connected decks.</div><div class="footer"><span>NASA / SpaceX public references · layout estimates marked</span><span class="compass">+Z WINDOW SIDE ↗</span></div></main>`;

const viewport = $('.viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#010203');
scene.fog = new THREE.FogExp2('#010203', 0.0022);
const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 1000);
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
sun.position.set(-34,58,46); sun.castShadow=true;
const rim = new THREE.DirectionalLight('#dfe8ff', 0.9);
rim.position.set(30,40,-60); scene.add(rim);
sun.shadow.mapSize.set(4096,4096); sun.shadow.camera.left=-32; sun.shadow.camera.right=32;
sun.shadow.camera.top=62;sun.shadow.camera.bottom=-32;sun.shadow.camera.near=1;sun.shadow.camera.far=160;
sun.shadow.bias=-0.00012;scene.add(sun);

const mat = (color, roughness=.65, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness,side:THREE.DoubleSide});
const M = {
  hull:new THREE.MeshPhysicalMaterial({color:'#e4e6e6',roughness:.36,metalness:.12,clearcoat:.55,clearcoatRoughness:.28,side:THREE.DoubleSide}),
  collar:new THREE.MeshPhysicalMaterial({color:'#161c22',roughness:.3,metalness:.6,clearcoat:.8,clearcoatRoughness:.12,side:THREE.DoubleSide}), inner:mat('#edf0ef',.72,.02), panel:mat('#d8dedf',.68,.07),
  floor:mat('#272d32',.82,.08), floorEdge:mat('#657177',.55,.55), dark:mat('#151d25',.45,.35),
  frame:mat('#8b9296',.32,.85), rail:mat('#b7c5c9',.38,.68), blue:mat('#28758a',.38,.32),
  amber:mat('#bd9d70',.72,.05), berth:mat('#c5c1b7',.92,.02), padding:mat('#e7e7e4',.83,.01),
  seat:mat('#434d55',.88,.03), glass:new THREE.MeshPhysicalMaterial({color:'#8ca6b0',roughness:.09,metalness:0,transmission:.67,thickness:.02,transparent:true,side:THREE.DoubleSide}),
  light:new THREE.MeshStandardMaterial({color:'#ecfbff',emissive:'#dce8ed',emissiveIntensity:2.5,roughness:.3}),
  screen:new THREE.MeshStandardMaterial({color:'#06141c',emissive:'#0b586b',emissiveIntensity:.65,roughness:.12})
};
const groups={shellFront:new THREE.Group(),shellBack:new THREE.Group(),noseFront:new THREE.Group(),noseBack:new THREE.Group(),innerFront:new THREE.Group(),windows:new THREE.Group(),decals:new THREE.Group(),interior:new THREE.Group(),labels:new THREE.Group(),detailLabels:new THREE.Group(),guides:new THREE.Group(),hardware:new THREE.Group(),debug:new THREE.Group()};
Object.values(groups).forEach(g=>scene.add(g));
groups.debug.visible=false;
groups.guides.visible=false;
function mesh(geo,material,parent=groups.interior,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);parent.add(o);return o}
function box(w,h,d,x,y,z,material=M.panel,parent=groups.interior){const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);o.castShadow=true;o.receiveShadow=true;return o}
function rod(a,b,r,material=M.frame,parent=groups.interior){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=mesh(new THREE.CylinderGeometry(r,r,av.distanceTo(bv),10),material,parent,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());o.castShadow=true;return o}
function torus(radius,tube,y,material=M.rail,parent=groups.interior,arc=Math.PI*2,start=0,cx=0,cz=.3){const o=mesh(new THREE.TorusGeometry(radius,tube,7,96,arc),material,parent,cx,y,cz);o.rotation.x=Math.PI/2;o.rotation.z=start;return o}
function polar(radius,angle,y=0,cx=0,cz=0){return [cx+Math.sin(angle)*radius,y,cz+Math.cos(angle)*radius]}
function segment(radius,y0,y1,a0,a1,material,parent){const o=mesh(new THREE.CylinderGeometry(radius,radius,y1-y0,Math.max(2,Math.ceil((a1-a0)*32)),1,true,a0,a1-a0),material,parent,0,(y0+y1)/2,0);o.receiveShadow=true;return o}
function label(text,x,y,z,scale=1,color='#d7f6fb',parent=groups.detailLabels){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#081924dd';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#4b98aa';ctx.lineWidth=3;ctx.strokeRect(2,2,508,92);ctx.fillStyle=color;ctx.font='600 37px Space Grotesk, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49,480);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:true}));o.position.set(x,y,z);o.scale.set(4.2*scale,.79*scale,1);parent.add(o);return o}
function line(a,b,color='#84c0ce',opacity=.8,parent=groups.guides){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);const o=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false}));parent.add(o);return o}

// Deterministic material maps, generated from code rather than the reference screenshots.
let seed=20261115;function random(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}
function canvasTexture(draw,size=512,repeat=[1,1]){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;return t}
function noiseHash(x,y){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^20261115;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function tileNoise(u,v,period){const x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),wrap=n=>(n+period)%period;const a=noiseHash(wrap(ix),wrap(iy)),b=noiseHash(wrap(ix+1),wrap(iy)),c=noiseHash(wrap(ix),wrap(iy+1)),d=noiseHash(wrap(ix+1),wrap(iy+1));return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,sx),THREE.MathUtils.lerp(c,d,sx),sy)}
const groundTexture=canvasTexture((ctx,n)=>{const img=ctx.createImageData(n,n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n,coarse=tileNoise(u,v,4),medium=tileNoise(u,v,16),fine=tileNoise(u,v,64),q=.52*coarse+.32*medium+.16*fine,shade=Math.round(98+q*48),index=(y*n+x)*4;img.data[index]=shade;img.data[index+1]=shade+2;img.data[index+2]=shade+3;img.data[index+3]=255}ctx.putImageData(img,0,0);for(let i=0;i<60;i++){const x=random()*n,y=random()*n,r=2+random()*9;const g=ctx.createRadialGradient(x+r*.25,y+r*.25,0,x,y,r);g.addColorStop(0,'rgba(40,42,44,.18)');g.addColorStop(.75,'rgba(60,62,64,.08)');g.addColorStop(1,'rgba(220,220,215,.10)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}},512,[12,12]);
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
const terrainGeometry=new THREE.PlaneGeometry(180,180,90,90);
const terrainPositions=terrainGeometry.attributes.position;
for(let i=0;i<terrainPositions.count;i++){const x=terrainPositions.getX(i),z=terrainPositions.getY(i),r=Math.hypot(x,z);const fade=THREE.MathUtils.smoothstep(r,14,48);const height=fade*(.8*Math.sin(x*.075)+.55*Math.cos(z*.1)+.35*Math.sin((x+z)*.12));terrainPositions.setZ(i,height)}
terrainGeometry.computeVertexNormals();
const terrain=mesh(terrainGeometry,new THREE.MeshStandardMaterial({map:groundTexture,roughness:1}),scene,0,-.08,0);terrain.rotation.x=-Math.PI/2;terrain.receiveShadow=true;
for(let i=0;i<100;i++){const a=random()*Math.PI*2,r=12+random()*80,x=Math.sin(a)*r,z=Math.cos(a)*r;const stone=mesh(new THREE.DodecahedronGeometry(.08+random()*.35,0),mat(random()>.5?'#7a8080':'#697073',1),scene,x,.05,z);stone.scale.y=.3;stone.rotation.y=random()*6}
for(let i=0;i<90;i++){const v=new THREE.Vector3((random()-.5)*500,random()*180+15,(random()-.5)*500);const star=mesh(new THREE.SphereGeometry(.035+random()*.06,4,4),new THREE.MeshBasicMaterial({color:'#d7e5ee'}),scene,...v.toArray())}
const earthCanvas=document.createElement('canvas');earthCanvas.width=512;earthCanvas.height=256;
const earthContext=earthCanvas.getContext('2d');earthContext.fillStyle='#1b4e79';earthContext.fillRect(0,0,512,256);
for(let i=0;i<28;i++){const x=random()*512,y=40+random()*175;earthContext.fillStyle=random()>.5?'#759991':'#5f8080';earthContext.beginPath();earthContext.ellipse(x,y,8+random()*42,3+random()*18,random()*6,0,Math.PI*2);earthContext.fill()}
for(let i=0;i<64;i++){const x=random()*512,y=random()*256;earthContext.fillStyle=`rgba(237,244,241,${.1+random()*.3})`;earthContext.beginPath();earthContext.ellipse(x,y,12+random()*48,2+random()*9,random()*6,0,Math.PI*2);earthContext.fill()}
const earthTexture=new THREE.CanvasTexture(earthCanvas);earthTexture.colorSpace=THREE.SRGBColorSpace;
mesh(new THREE.SphereGeometry(7,48,32),new THREE.MeshLambertMaterial({map:earthTexture,emissive:'#0a1626'}),scene,70,48,-150);

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
  segment(4.19,innerStart,isWindow?w.bottom:innerTop,a0,a1,M.inner,innerTarget);
  if(isWindow)segment(4.19,w.top,innerTop,a0,a1,M.inner,innerTarget);
}
// Curved vector decals sized from the reference render: flag ≈2.2 × 1.25 m, NASA mark ≈2.5 m wide.
function decalTexture(draw,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const flagTexture=decalTexture((ctx,w,h)=>{const sh=h/13;for(let i=0;i<13;i++){ctx.fillStyle=i%2?'#f4f2ec':'#b3203a';ctx.fillRect(0,i*sh,w,sh+1)}
  const cw=w*.4,ch=sh*7;ctx.fillStyle='#22336b';ctx.fillRect(0,0,cw,ch);ctx.fillStyle='#f4f2ec';
  const star=(x,y,r)=>{ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.4:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill()};
  for(let row=0;row<9;row++){const n=row%2?5:6;for(let col=0;col<n;col++)star(cw*(row%2?2:1)/12+col*cw/6,ch*(row+1)/10,ch*.042)}},1024,540);
const nasaTexture=decalTexture((ctx,w,h)=>{ctx.strokeStyle='#d5262d';ctx.lineWidth=h*.17;ctx.lineJoin='round';ctx.lineCap='butt';
  const top=h*.16,bot=h*.9,lw=w/4.6,gap=w*.055;let x=w*.04;
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
for(const y of [BAND0+.04,BAND1-.04])torus(4.52,.05,y,lipMat,groups.hardware,Math.PI*2,0,0,0);
const collarSeam=mat('#3d4952',.5,.5);
for(const y of [BAND0+.62,36.4,38.45,39.0,40.6,41.4,43.05])torus(4.506,.01,y,collarSeam,groups.hardware,Math.PI*2,0,0,0);
torus(4.53,.07,38.95,lipMat,groups.hardware,Math.PI*2,0,0,0);
for(let i=0;i<32;i++){const a=i*2*Math.PI/32,p=polar(4.512,a);rod([p[0],BAND0+.65,p[2]],[p[0],BAND1-.08,p[2]],.007,collarSeam,groups.hardware)}
{const holes=new THREE.InstancedMesh(new THREE.CircleGeometry(.1,16),mat('#8d969c',.5,.6),72);const o=new THREE.Object3D();for(let i=0;i<72;i++){const a=i*2*Math.PI/72;o.position.set(...polar(4.509,a,BAND0+.32));o.rotation.set(0,a,0);o.updateMatrix();holes.setMatrixAt(i,o.matrix)}groups.hardware.add(holes)}
// Subtle body seams on the white hull, kept low-contrast as on the painted reference.
const hullSeam=mat('#c9cdcf',.6,.2);
for(let i=0;i<8;i++){const a=i*2*Math.PI/8+Math.PI/8,p=polar(4.503,a);rod([p[0],9.8,p[2]],[p[0],BAND0-.05,p[2]],.006,hullSeam,groups.hardware)}
for(const deg of D.windows.value.centersDeg){const a=deg*Math.PI/180,w=D.windows.value.widthDeg*Math.PI/180,wb=D.windows.value.bottom,wt=D.windows.value.top;segment(4.507,wb-.07,wb+.02,a-w/2,a+w/2,M.dark,groups.windows);segment(4.507,wt-.02,wt+.07,a-w/2,a+w/2,M.dark,groups.windows);segment(4.517,wb,wt,a-w/2,a+w/2,M.glass,groups.windows);for(const edge of [a-w/2,a+w/2]){const p=polar(4.52,edge);rod([p[0],wb-.05,p[2]],[p[0],wt+.05,p[2]],.047,M.dark,groups.windows)}}
// Aft closure: dark engine bay plate under the skirt.
{const aft=mesh(new THREE.CircleGeometry(4.48,64),mat('#1b2025',.6,.6),groups.hardware,0,D.bodyBottom.value+.02,0);aft.rotation.x=Math.PI/2}
// Four landing legs: tall white fairings on the skirt, a primary and a secondary strut, broad dark pads.
const legMetal=new THREE.MeshPhysicalMaterial({color:'#b9bec1',roughness:.28,metalness:.9,clearcoat:.3});
const padMat=new THREE.MeshPhysicalMaterial({color:'#1d2226',roughness:.5,metalness:.6});
// Fairing: a rounded-top housing that widens toward the skirt and ends flush with the hull base.
const fairingProfile=[new THREE.Vector2(0,D.bodyBottom.value-.05),new THREE.Vector2(1.08,D.bodyBottom.value-.05),new THREE.Vector2(1.04,3.4),new THREE.Vector2(.9,7.4)];
for(let k=1;k<=12;k++){const a=k/12*Math.PI/2;fairingProfile.push(new THREE.Vector2(.9*Math.cos(a),7.4+1.4*Math.sin(a)))}
const fairingGeometry=new THREE.LatheGeometry(fairingProfile,48);
const fairingMaterial=hullMaterial(6,8);
for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;
  const fairing=mesh(fairingGeometry,fairingMaterial,groups.hardware,...polar(4.3,a,0));fairing.scale.set(1,1,.64);fairing.rotation.y=a;fairing.castShadow=true;fairing.receiveShadow=true;
  const pad=polar(8.4,a,.42);
  rod(polar(4.95,a,5.4),pad,.2,legMetal,groups.hardware);
  rod(polar(5.0,a,2.7),polar(7.6,a,.62),.13,legMetal,groups.hardware);
  rod(polar(4.9,a,4.1),polar(6.6,a,2.0),.09,M.dark,groups.hardware);
  const foot=mesh(new THREE.CylinderGeometry(1.0,1.15,.16,40),padMat,groups.hardware,...pad);foot.position.y=.1;foot.castShadow=true;foot.receiveShadow=true;
  const hub=mesh(new THREE.SphereGeometry(.28,16,12),legMetal,groups.hardware,pad[0],.3,pad[2]);hub.castShadow=true;
}

// External lift guide, platform and ground landing; the upper platform is exactly flush with Deck A.
for(const x of [-1.15,1.15]){rod([x,.1,-5.0],[x,35.5,-5.0],.09,M.frame,groups.hardware);rod([x,.1,-6.9],[x,.1,-5],.06,M.frame,groups.hardware)}
const lift=groups.hardware;
box(2.6,.13,2.2,0,35.035,-5.45,M.floor,lift);
box(2.6,.13,2.2,0,.07,-5.45,M.floor,lift);
for(let i=0;i<11;i++)box(2.55,.025,.045,0,35.11,-6.45+i*.2,M.frame,lift);
for(const x of [-1.3,1.3])for(const z of [-6.5,-4.4])rod([x,35.1,z],[x,37,z],.045,M.frame,lift);
for(const z of [-6.5,-4.4])rod([-1.3,37,z],[1.3,37,z],.045,M.frame,lift);
for(const x of [-1.3,1.3])rod([x,37,-6.5],[x,37,-4.4],.045,M.frame,lift);
for(const z of [-6.5,-4.4])for(let y=35.45;y<37;y+=.32)rod([-1.3,y,z],[1.3,y,z],.014,M.frame,lift);
rod([0,35.2,-5],[0,36.95,-5],.035,M.dark,lift);

// Annular slabs with a genuine central 3 m aperture. Each tread reaches the ring edge.
function annularFloor(y){const shape=new THREE.Shape();shape.absarc(0,0,4.18,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,.3,1.5,0,Math.PI*2,true);shape.holes.push(hole);const g=new THREE.ExtrudeGeometry(shape,{depth:D.floorThickness.value,bevelEnabled:false,curveSegments:96});g.rotateX(Math.PI/2);const o=mesh(g,M.floor,groups.interior,0,y,0);o.receiveShadow=true;torus(1.50,.055,y+.07,M.floorEdge,groups.interior);return o}
D.decks.value.forEach(annularFloor);
// Deck A garage opening in the -Z shell: bridge to external platform, with clear gate.
box(2.5,.12,.65,0,35.04,-4.43,M.floor,groups.interior);
// The 54 treads form three one-turn flights. A landable walking line is radius ~1.0 m.
const stairCx=0,stairCz=.3,innerR=.43,outerR=1.47,steps=18;
function stairTread(y,a0,a1){const s=new THREE.Shape();const p1=polar(innerR,a0,0,stairCx,stairCz),p2=polar(outerR,a0,0,stairCx,stairCz),p3=polar(outerR,a1,0,stairCx,stairCz),p4=polar(innerR,a1,0,stairCx,stairCz);s.moveTo(p1[0],p1[2]);s.lineTo(p2[0],p2[2]);for(let k=1;k<=4;k++){const p=polar(outerR,a0+(a1-a0)*k/4,0,stairCx,stairCz);s.lineTo(p[0],p[2])}s.lineTo(p4[0],p4[2]);for(let k=3;k>=0;k--){const p=polar(innerR,a0+(a1-a0)*k/4,0,stairCx,stairCz);s.lineTo(p[0],p[2])}s.closePath();const g=new THREE.ShapeGeometry(s);g.rotateX(Math.PI/2);mesh(g,M.floor,groups.interior,0,y,0).receiveShadow=true}
const stairStart=-Math.PI/2;
for(let flight=0;flight<3;flight++){const base=D.decks.value[flight];for(let i=0;i<steps;i++){const a0=stairStart+i*2*Math.PI/steps,a1=a0+2*Math.PI/steps,yt=base+(i+1)*D.deckSpacing.value/steps;stairTread(yt,a0,a1);for(const r of [innerR,outerR]){if(r===outerR&&(i===0||i===steps-1))continue;const p0=polar(r,a0,yt,stairCx,stairCz),p1=polar(r,a1,yt,stairCx,stairCz);rod([p0[0],yt+.9,p0[2]],[p1[0],yt+.9+D.deckSpacing.value/steps,p1[2]],.025,M.rail);if(i%3===0)rod([p0[0],yt,p0[2]],[p0[0],yt+.9,p0[2]],.024,M.rail)}}}
for(let flight=0;flight<3;flight++){
  const vertices=[],indices=[];
  for(let i=0;i<=72;i++){const t=i/72,a=stairStart+t*Math.PI*2,y=D.decks.value[flight]+t*D.deckSpacing.value;for(const r of [innerR,outerR])vertices.push(...polar(r,a,y,stairCx,stairCz));if(i<72){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const ramp=mesh(g,new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}),groups.interior);
  ramp.userData={collisionSurface:true,flight:flight+1,visibility:'debug-only'};
}
// Floor-edge guarding leaves an explicit landing portal at the -X sector.
for(const y of D.decks.value){for(let j=0;j<20;j++){const a0=-Math.PI/2+.28+j*(2*Math.PI-.55)/20,a1=a0+(2*Math.PI-.55)/20;for(const r of [1.50]){const p0=polar(r,a0,y+.95,0,.3),p1=polar(r,a1,y+.95,0,.3);rod(p0,p1,.023,M.rail);if(j%3===0){const b=polar(r,a0,y+.07,0,.3);rod(b,p0,.025,M.rail)}}}}

// Window-side upper room shell seams, light bands and readable deck markers.
for(const y of D.decks.value){const top=Math.min(y+2.65,BAND1-.1),inNose=y>=BAND1-.2,lightY=inNose?y+2.2:top,lr=Math.min(4.11,noseRadiusAt(lightY)-.18);if(!inNose)for(let i=0;i<14;i++){const a=i*2*Math.PI/14,p=polar(4.15,a);rod([p[0],y+.24,p[2]],[p[0],top,p[2]],.012,M.panel)}for(let i=0;i<32;i++){const a=i*2*Math.PI/32,p0=polar(lr,a,lightY),p1=polar(lr,a+2*Math.PI/32,lightY);rod(p0,p1,.016,M.light)} }
deckNames.forEach((name,i)=>label(name,5.8,D.decks.value[i]+1.3,1.3,.93,'#d7f6fb',groups.labels));

// Two independent airlocks. Each wall has a complete 1.2 m × 2.15 m hatch opening.
function hatchFrame(cx,z,y,side){const hw=.6,hh=2.15;for(const x of [cx-hw-.065,cx+hw+.065])box(.12,hh,.14,x,y+hh/2,z,M.dark);box(1.46,.13,.15,cx,y+hh+.06,z,M.dark);for(let q=0;q<8;q++){const x=cx-.72+q*.205;box(.035,.03,.16,x,y+hh+.13,z,M.rail)}const hinge=side>0?cx+hw+.18:cx-hw-.18;const panel=box(.055,hh*.87,1.14,hinge,y+hh*.45,z+(side>0?.25:-.25),M.dark);panel.userData.openHatch=true;return panel}
function endWall(cx,z,y){for(const sign of [-1,1])box(.4,2.30,.10,cx+sign*.8,y+1.15,z,M.padding);box(1.2,.15,.10,cx,y+2.225,z,M.padding)}
function airlock(cx,name){const y=35.1;for(const x of [cx-1.04,cx+1.04]){const p=box(.10,2.3,2.83,x,y+1.15,0,M.padding);p.material=M.padding}for(const z of [-1.415,1.415]){endWall(cx,z,y);hatchFrame(cx,z,y,z>0?1:-1)}box(1.94,.06,2.75,cx,y-.03,0,M.floor);box(1.96,.06,2.78,cx,y+2.31,0,M.inner);for(const z of [-.8,.8]){rod([cx-.83,y+1,z],[cx-.83,y+2,z],.03,M.dark);box(.34,.22,.025,cx+.82,y+1.4,z,M.screen)}label(name,cx,y+2.78,0,.48,'#d7f6fb');return {cx,clearSize:[2,2.83,2.3]}}
airlock(2.55,'AIRLOCK 01');airlock(-2.55,'AIRLOCK 02');
// Pressure boundary infill around the airlocks. Its middle section is behind the stair opening.
for(const [x,w] of [[-3.84,.62],[0,3.05],[3.84,.62]])box(w,2.35,.1,x,36.275,-1.46,M.inner);
// Garage hardware follows the clear rear annular route and the -Z lift gate.
for(const x of [-3.85,3.85])box(.28,2.3,.45,x,36.25,-2.1,M.panel);
for(const x of [-1.5,1.5])box(.12,2.25,.16,x,36.225,-4.12,M.frame);
box(3.1,.16,.16,0,37.35,-4.12,M.frame);
for(const x of [-1.1,1.1])box(.22,.3,.45,x,35.32,-3.85,M.dark);
label('GARAGE → LIFT',0,37.5,-3.7,.65);

// Deck B: a real privacy compartment with an open 1 m door, plus reachable work stations.
const B=D.decks.value[1];
function hygiene(){const x0=1.85,x1=3.55,z0=-2.2,z1=-.55,h=2.35;box(.09,h,z1-z0,x1,B+h/2,(z0+z1)/2,M.inner);for(const z of [z0,z1])box(x1-x0,h,.09,(x0+x1)/2,B+h/2,z,M.inner);box(.1,h,.31,x0,B+h/2,z0+.155,M.inner);box(.1,h,.31,x0,B+h/2,z1-.155,M.inner);box(.1,.25,1.04,x0,B+h-.125,(z0+z1)/2,M.inner);box(.45,.52,.5,2.95,B+.3,-1.75,M.panel);box(.36,.11,.4,3.1,B+1.05,-.9,M.rail);box(.25,.4,.04,3.12,B+1.32,-.66,M.dark);label('HYGIENE',3.1,B+2.8,-1.15,.48)}
hygiene();
// Science bench and storage cabinets sit outside the 1.5 m central circulation ring.
box(2.15,.12,.68,1.4,B+1.04,3.25,M.amber);
for(const x of [.4,1.4,2.4]){box(.55,.76,.56,x,B+.42,3.35,M.panel);box(.46,.045,.04,x,B+.5,3.055,M.dark)}
box(.7,.45,.06,2.15,B+1.58,3.78,M.screen);label('SCIENCE',1.45,B+2.72,3.5,.45);
for(const x of [-3.55,-2.8])for(let k=0;k<2;k++){box(.69,1.15,.57,x,B+.6,-1.4+k*.8,M.panel);box(.48,.07,.03,x,B+.87,-1.095+k*.8,M.dark)}
label('STORAGE',-3.3,B+2.7,-1.2,.47);
// Folded resistance device, footplate and restraints: no separate claimed gym.
box(1.2,.1,.77,-.1,B+.13,-3.46,M.floorEdge);
rod([-.63,B+.18,-3.7],[-.63,B+2.05,-3.7],.06,M.frame);rod([.42,B+.18,-3.7],[.42,B+2.05,-3.7],.06,M.frame);rod([-.63,B+2.03,-3.7],[.42,B+2.03,-3.7],.05,M.frame);rod([-.46,B+1.35,-3.65],[-.2,B+1.1,-3.4],.025,M.dark);rod([.24,B+1.35,-3.65],[.03,B+1.1,-3.4],.025,M.dark);label('EXERCISE',-.2,B+2.72,-3.65,.48);

// Deck D (top, inside the nose base): four side-opening berth pods with 1 m clear portals and a compact galley.
const C=D.decks.value[3];
function radialGroup(angle,root){const g=new THREE.Group();g.position.set(Math.sin(angle)*3.3,C,Math.cos(angle)*3.3);g.rotation.y=angle;root.add(g);return g}
for(const [i,deg] of [50,130,230,310].entries()){
  const a=deg*Math.PI/180,g=radialGroup(a,groups.interior);
  // Local +Z points outward. Both side partitions stop at the front portal.
  box(.07,2.25,1.15,-1.04,1.125,-.36,M.inner,g);box(.07,2.25,1.15,1.04,1.125,-.36,M.inner,g);
  box(.42,2.25,.07,-.82,1.125,-.93,M.inner,g);box(.42,2.25,.07,.82,1.125,-.93,M.inner,g);
  box(1.1,.14,.08,0,2.18,-.93,M.inner,g);
  box(1.77,.2,.73,0,.58,.07,M.berth,g);box(1.84,.08,.26,0,.52,-.41,M.rail,g);
  for(const sx of [-.65,.65])box(.035,.03,.86,sx,.7,.05,M.rail,g);
  box(.45,.55,.36,.73,1.18,.48,M.panel,g);box(.13,.035,.18,-.72,1.67,.58,M.light,g);
  const p=polar(3.7,a,C+2.5);label(`BERTH 0${i+1}`,p[0],p[1],p[2],.43)
}
// Galley occupies the rear gap between berths; the central ring remains free.
box(1.8,.75,.52,0,C+.4,-3.25,M.panel);box(1.8,.10,.62,0,C+.85,-3.21,M.amber);
for(const x of [-.45,.45]){box(.6,.08,.53,x,C+1.2,-2.7,M.amber);box(.52,.38,.5,x,C+.34,-2.25,M.seat)}
box(.76,.4,.06,0,C+1.55,-3.5,M.screen);label('GALLEY',0,C+2.4,-3.2,.5);
box(1.1,.09,.46,0,C+.88,3.3,M.amber);label('SHARED WORK',0,C+2.4,3.3,.4);

// Deck C follows the official concept art: four pale seats, restrained screens and a dark window arc.
const F=D.decks.value[2];
for(const [i,deg] of [-36,-12,12,36].entries()){
  const a=deg*Math.PI/180,g=radialGroup(a,groups.interior);g.position.y=F;g.position.x=Math.sin(a)*3.05;g.position.z=Math.cos(a)*3.05;
  box(.72,.18,.7,0,.54,-.02,M.panel,g);box(.61,.1,.56,0,.66,-.02,M.seat,g);box(.73,1.15,.16,0,1.23,-.3,M.panel,g);box(.62,1.0,.08,0,1.25,-.19,M.seat,g);
  box(.79,.1,.14,0,1.86,-.31,M.panel,g);for(const x of [-.43,.43])box(.12,.12,.52,x,1.03,-.12,M.panel,g);
  box(.73,.42,.04,0,1.18,.75,M.screen,g);box(.09,.48,.07,0,.91,.75,M.frame,g);
  for(const sx of [-.19,0,.19])box(.12,.016,.007,sx,1.22,.779,sx===0?M.light:M.blue,g)
}
// Curved workstation bank on the opposite side and flush service panels.
for(let i=0;i<8;i++){const a=Math.PI-1.02+i*2.04/7,p=polar(3.65,a,F+.9);const top=box(.73,.11,.61,p[0],p[1],p[2],M.amber);top.rotation.y=a;const panel=box(.74,1.35,.10,p[0],F+1.58,p[2]+Math.sign(Math.cos(a))*.33,M.inner);panel.rotation.y=a}
for(let i=0;i<3;i++){const a=Math.PI-.7+i*.7,p=polar(4.03,a,F+1.52);const hatch=box(.6,.64,.035,p[0],p[1],p[2],M.dark);hatch.rotation.y=a}
label('CONTROL DECK',0,F+2.45,3.3,.55);
// A short, explicitly non-deck docking access ladder in the upper void.
const topDeck=D.decks.value[3];
for(const x of [-.4,.4])rod([x,topDeck+.2,-.9],[x,49.35,-.9],.045,M.frame);
for(let y=topDeck+.55;y<49.3;y+=.32)rod([-.4,y,-.9],[.4,y,-.9],.025,M.frame);
for(let i=0;i<16;i++){const a=i*2*Math.PI/16,p=polar(1.6,a,49.45);rod([p[0],49.45,p[2]],[p[0],50.25,p[2]],.018,M.rail)}

// 1.8 m human silhouette, outside the footpad footprint for scale.
const human=new THREE.Group();scene.add(human);human.position.set(10,0,7);
const suit=mat('#dce1df',.82),visor=mat('#1e3944',.18,.25);
mesh(new THREE.SphereGeometry(.18,16,12),visor,human,0,1.61,0);
mesh(new THREE.CapsuleGeometry(.18,.58,5,12),suit,human,0,1.04,0);
for(const x of [-.12,.12]){rod([x,.75,0],[x*1.18,.08,0],.065,suit,human);rod([x*2,1.27,0],[x*2.6,.76,0],.055,suit,human)}
box(.38,.07,.2,0,.07,.07,M.dark,human);label('1.8 m human',10,2.22,7,.72);
const capsule=mesh(new THREE.CapsuleGeometry(.3,1.2,8,16),new THREE.MeshBasicMaterial({color:'#58d7ee',transparent:true,opacity:.32,depthWrite:false}),groups.debug,0,36,2.6);
capsule.userData={height:1.8,radius:.3,role:'clearance reference'};
label('1.8 m × 0.3 m',0,37.25,2.6,.46,'#88efff',groups.debug);
// Dimensions and nominal lift level stay visible only when guides are enabled.
line([11,0,0],[11,52,0]);for(const y of [0,52])line([10.6,y,0],[11.4,y,0]);label('52 m · PUBLISHED',12.7,26,0,.65,'#b9f1ff',groups.guides);
line([-4.5,33.7,6],[4.5,33.7,6]);for(const x of [-4.5,4.5])line([x,33.45,6],[x,33.95,6]);label('9 m · PUBLISHED',0,32.8,6,.62,'#b9f1ff',groups.guides);
line([-8,0,-5.6],[-8,35.1,-5.6]);label('35.1 m LIFT',-9.9,17.55,-5.6,.6,'#b9f1ff',groups.guides);

// Simple route landmarks make the future avatar path explicit in model data.
scene.userData.navigation={unit:'metre',avatar:{height:1.8,radius:.3},decks:D.decks.value,stair:{center:D.stairCenter.value,innerRadius:innerR,outerRadius:outerR,risersPerFlight:18},hatches:{clearWidth:1.2,clearHeight:2.15,open:true},airlocks:[{center:[-2.55,0],clearSize:[2,2.83,2.3]},{center:[2.55,0],clearSize:[2,2.83,2.3]}],lift:{upperY:35.1,platform:[2.6,2.2]},route:['surface','lift','garage','either outer hatch','separate airlock','inner hatch','Deck A hall','spiral stair','Deck B ring','Deck C ring','Deck D ring']};

const presets=[
  ['Full ship','Exterior','exterior',[24,9,64],[0,25,0],'Complete 52 m silhouette, four landing legs and the upper lift.'],
  ['Section','A–D','cutaway',[20,44,49],[0,40,0],'Front-half section reveals all four decks and continuous stair.'],
  ['Deck A','Airlocks','cutaway',[13,40,16],[0,36.2,0],'Two distinct 13 m³ airlocks lead to the garage and lift.'],
  ['Deck B','Systems','cutaway',[12,43,15],[0,39.1,0],'Hygiene, science, storage and compact exercise.'],
  ['Deck C','Control','cutaway',[14,45,18],[0,41.9,0],'Four observed seat positions facing individual windows.'],
  ['Deck D','Habitation','cutaway',[12,48.5,15],[0,44.8,0],'Four berth pods and a compact galley under the nose.'],
  ['Lift','Garage','cutaway',[12,39,-16],[0,35,-4.5],'Lift upper station aligns with the Deck A garage floor.'],
  ['Top plan','Debug','cutaway',[.01,61,0],[0,41.5,0],'Inspect annular walkways and the open stair aperture.']
];
const presetList=$('#presets');presets.forEach((p,i)=>{const b=document.createElement('button');b.className='preset'+(i===0?' active':'');b.innerHTML=`<span>${p[0]}</span><small>${p[1]}</small>`;b.onclick=()=>setPreset(i);presetList.append(b)});
let shellMode='exterior',targetCamera=null;
function setMode(mode){shellMode=mode;$('#shell-mode').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));const ext=mode==='exterior',ghost=mode==='ghost';groups.shellFront.visible=ext||ghost;groups.noseFront.visible=ext||ghost;groups.innerFront.visible=false;groups.windows.visible=ext||ghost;groups.decals.visible=ext||ghost;groups.interior.visible=true;groups.labels.visible=!ext&&$('[data-toggle="labels"]').classList.contains('on');groups.shellBack.visible=true;groups.noseBack.visible=true;for(const g of [groups.shellFront,groups.shellBack,groups.noseFront,groups.noseBack])g.traverse(o=>{if(o.isMesh){o.material.transparent=ghost;o.material.opacity=ghost?.13:1;o.material.depthWrite=!ghost}});$('#view-status').textContent=`${mode.toUpperCase()} · ${$('.preset.active span')?.textContent||'CUSTOM VIEW'}`}
function setPreset(i){const p=presets[i];presetList.querySelectorAll('.preset').forEach((b,j)=>b.classList.toggle('active',j===i));setMode(p[2]);targetCamera={position:new THREE.Vector3(...p[3]),target:new THREE.Vector3(...p[4])};$('#view-description').textContent=p[5];$('#view-status').textContent=`${p[2].toUpperCase()} · ${p[0].toUpperCase()}`}
$('#shell-mode').addEventListener('click',e=>{if(e.target.dataset.mode)setMode(e.target.dataset.mode)});
document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{b.classList.toggle('on');groups[b.dataset.toggle].visible=b.classList.contains('on');if(b.dataset.toggle==='labels')groups.detailLabels.visible=b.classList.contains('on')});
$('.mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
document.querySelectorAll('.preset,#shell-mode button').forEach(b=>b.addEventListener('click',()=>$('.sidebar').classList.remove('open')));
setMode('exterior');
if(import.meta.env.DEV)window.__view={camera,orbit,THREE};
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}
new ResizeObserver(resize).observe(viewport);resize();
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(targetCamera){const f=1-Math.exp(-dt*4);camera.position.lerp(targetCamera.position,f);orbit.target.lerp(targetCamera.target,f);if(camera.position.distanceTo(targetCamera.position)<.01&&orbit.target.distanceTo(targetCamera.target)<.01)targetCamera=null}orbit.update();groups.detailLabels.visible=shellMode!=='exterior'&&groups.labels.visible&&camera.position.distanceTo(orbit.target)<20;renderer.render(scene,camera)}animate();
