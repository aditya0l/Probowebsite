
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STUDIO, WALK } from './markup.js';
// the engine binds to the studio and showroom-walk markup; pages that do not show them get a hidden copy
for (const [id, html] of [['rig', STUDIO], ['hall', WALK]]) if (!document.getElementById(id)) { const d = document.createElement('div'); d.hidden = true; d.setAttribute('aria-hidden', 'true'); d.innerHTML = html; document.body.append(d); }

gsap.registerPlugin(ScrollTrigger);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t, seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const $=s=>document.querySelector(s);

/* ================= loader ================= */
const manager=new THREE.LoadingManager();
let loaded=false;
const finish=()=>{ if(loaded) return; loaded=true; const lb=$('#loadbar'); if(lb) lb.style.width='100%'; setTimeout(()=>$('#loader')?.classList.add('done'),250); };
manager.onProgress=(u,i,n)=>{const lb=$('#loadbar'); if(lb) lb.style.width=(i/n*100)+'%';};
manager.onLoad=finish; setTimeout(finish,document.getElementById('earth')?9000:400);

if($('#flight')) ScrollTrigger.create({trigger:'#flight',start:'bottom 68px',onEnter:()=>$('#nav')?.classList.add('solid'),onLeaveBack:()=>$('#nav')?.classList.remove('solid')}); else $('#nav')?.classList.add('solid');

let fp=0, eResize=()=>{}, earthFrame=null;
if(document.getElementById('earth')){
/* ================= EARTH ================= */
const JAIPUR={lat:26.78,lon:75.82};
const CITIES=[[28.61,77.21],[19.08,72.88],[12.97,77.59],[13.08,80.27],[22.57,88.36],[23.02,72.57],[17.39,78.49],[18.52,73.86],[26.85,80.95],[30.73,76.78],[21.15,79.09],[22.72,75.86],[26.14,91.74],[15.50,73.83],[11.02,76.96],[25.32,82.97],[9.93,76.27],[24.58,73.71],[32.73,74.86],[20.30,85.82]];
const ll2v=(lat,lon,r=1)=>{const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));};

const ec=$('#earth');
const er=new THREE.WebGLRenderer({canvas:ec,antialias:true});
er.setPixelRatio(Math.min(devicePixelRatio,2)); er.setClearColor(0x050607);
const es=new THREE.Scene();
const ecam=new THREE.PerspectiveCamera(35,1,.001,200);
const TL=new THREE.TextureLoader(manager);
const tex=(f,srgb)=>{const t=TL.load('assets/tex/'+f);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;};
const sunDir=ll2v(8,JAIPUR.lon+60).normalize();

const earthMat=new THREE.ShaderMaterial({
  uniforms:{dayMap:{value:tex('earth-blue-marble.jpg',true)},nightMap:{value:tex('earth-night.jpg',true)},waterMap:{value:tex('earth-water.png')},sunDir:{value:sunDir}},
  vertexShader:`varying vec2 vUv;varying vec3 vN;varying vec3 vP;
    void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D dayMap,nightMap,waterMap;uniform vec3 sunDir;varying vec2 vUv;varying vec3 vN;varying vec3 vP;
    void main(){
      vec3 n=normalize(vN),v=normalize(cameraPosition-vP);
      float d=dot(n,sunDir), dayK=smoothstep(-.1,.2,d);
      vec3 day=texture2D(dayMap,vUv).rgb;
      vec3 night=pow(texture2D(nightMap,vUv).rgb,vec3(1.5))*vec3(1.,.72,.42)*2.4;
      vec3 lit=day*(.05+1.2*max(d,0.));
      float water=texture2D(waterMap,vUv).r;
      float spec=pow(max(dot(n,normalize(sunDir+v)),0.),70.)*water*.8;
      vec3 col=mix(night,lit,dayK)+spec*vec3(1.,.88,.7)*dayK;
      col+=vec3(1.,.45,.2)*exp(-d*d*400.)*.05*dayK;
      float fr=pow(1.-max(dot(n,v),0.),2.6);
      col+=vec3(.28,.52,1.)*fr*(.12+.9*smoothstep(-.3,.5,d))*.85;
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
    }`});
const earth=new THREE.Mesh(new THREE.SphereGeometry(1,160,160),earthMat); es.add(earth);

const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.008,128,128),new THREE.ShaderMaterial({
  uniforms:{map:{value:tex('clouds.png')},sunDir:{value:sunDir}},transparent:true,depthWrite:false,
  vertexShader:`varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D map;uniform vec3 sunDir;varying vec2 vUv;varying vec3 vN;
    void main(){float a=texture2D(map,vUv).a;float l=smoothstep(-.08,.35,dot(normalize(vN),sunDir));
    gl_FragColor=vec4(vec3(.06+.94*l),a*.75*(.15+.85*l));
    #include <colorspace_fragment>
    }`}));
es.add(clouds);

es.add(new THREE.Mesh(new THREE.SphereGeometry(1.15,96,96),new THREE.ShaderMaterial({
  uniforms:{sunDir:{value:sunDir}},side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`varying vec3 vN;varying vec3 vW;void main(){vN=normalize(normalMatrix*normal);vW=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 sunDir;varying vec3 vN;varying vec3 vW;
    void main(){float i=pow(clamp(.62-dot(vN,vec3(0,0,1.)),0.,1.),3.2);float l=.2+.8*smoothstep(-.4,.6,dot(vW,sunDir));
    gl_FragColor=vec4(vec3(.32,.56,1.)*i*l*1.4,1.);}`})));

(()=>{const n=3500,p=new Float32Array(n*3),c=new Float32Array(n*3);
  for(let i=0;i<n;i++){const v=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize().multiplyScalar(60+Math.random()*40);p.set([v.x,v.y,v.z],i*3);const b=.35+Math.random()*.65;c.set([b,b,b*(.9+Math.random()*.15)],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  es.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.3,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85})));})();

const jv=ll2v(JAIPUR.lat,JAIPUR.lon,1.0);
const pin=new THREE.Group(); pin.position.copy(jv); pin.lookAt(jv.clone().multiplyScalar(2)); es.add(pin);
const accent=new THREE.Color(0x8ea5ff);
const pinDot=new THREE.Mesh(new THREE.CircleGeometry(.005,32),new THREE.MeshBasicMaterial({color:0xffffff}));pinDot.position.z=.0015;pin.add(pinDot);
const pinRing=new THREE.Mesh(new THREE.RingGeometry(.009,.011,64),new THREE.MeshBasicMaterial({color:accent,transparent:true,side:THREE.DoubleSide}));pinRing.position.z=.0015;pin.add(pinRing);

const arcs=CITIES.map(([la,lo])=>{
  const a=jv.clone(),b=ll2v(la,lo,1),m=a.clone().add(b).multiplyScalar(.5);m.normalize().multiplyScalar(1+a.distanceTo(b)*.55);
  const g=new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a,m,b),64,.0009,6,false);g.setDrawRange(0,0);
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));es.add(mesh);
  const end=new THREE.Mesh(new THREE.CircleGeometry(.0035,16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true}));end.position.copy(b.clone().multiplyScalar(1.001));end.lookAt(b.clone().multiplyScalar(2));end.scale.setScalar(0);es.add(end);
  return {g,mesh,end,total:g.index.count};
});

eResize=function(){const w=ec.clientWidth,h=ec.clientHeight;er.setSize(w,h,false);ecam.aspect=w/h;ecam.updateProjectionMatrix();}
fp=0; ScrollTrigger.create({trigger:'#flight',start:'top top',end:'bottom bottom',scrub:true,onUpdate:s=>fp=s.progress});
const hero=$('#hero'),ch1=$('#ch1'),ch2=$('#ch2'),lens=$('#lens'),drone=$('#drone'),showroom=$('#showroom'),alt=$('#alt');
drone.addEventListener('loadedmetadata',()=>drone.playbackRate=.55);
const look=new THREE.Vector3(), tmp=new THREE.Vector3();
let counted=false;

earthFrame=function(t){
  const p=fp, idle=RM?0:Math.sin(t*.00012)*8*(1-seg(p,0,.08));
  const a=ease(seg(p,0,.36)), c=ease(seg(p,.5,.84));
  const far=ecam.aspect<1?1+(1-ecam.aspect)*1.3:1;
  let lat=lerp(14,21,a), lon=lerp(22,80,a)+idle, dist=(lerp(3.4,2.15,a)-seg(p,.36,.5)*.08)*far;
  lat=lerp(lat,JAIPUR.lat-1.6,c); lon=lerp(lon,JAIPUR.lon+.2,c); dist=lerp(dist,1.05,c);
  ecam.position.copy(ll2v(lat,lon,dist));
  look.set(0,0,0).lerp(jv,ease(seg(p,.58,.86))); ecam.lookAt(look);
  clouds.rotation.y=RM?0:t*.0000035;

  const ap=seg(p,.34,.5);
  arcs.forEach((A,i)=>{const k=clamp(ap*1.7-i*.035,0,1);A.g.setDrawRange(0,Math.floor(k*A.total/3)*3);const f=1-seg(p,.55,.66);A.mesh.material.opacity=.9*f;A.end.scale.setScalar(k>=1?f:0);});
  const pulse=RM?0:(t*.0012)%1; pinRing.scale.setScalar((1+pulse*2.2)*lerp(1,.2,c)); pinRing.material.opacity=1-pulse;
  pinDot.scale.setScalar(lerp(1,.25,c));

  hero.style.opacity=1-seg(p,.03,.1); hero.style.transform=`translateY(${-seg(p,.03,.1)*30}px)`; hero.style.pointerEvents=p<.06?'auto':'none';
  const o1=seg(p,.38,.43)*(1-seg(p,.5,.55)); ch1.style.opacity=o1; ch1.style.transform=`translateY(calc(-50% + ${(1-o1)*24}px))`;
  const o2=seg(p,.62,.67)*(1-seg(p,.78,.82)); ch2.style.opacity=o2; ch2.style.transform=`translateY(${(1-o2)*24}px)`;
  alt.style.opacity=1-seg(p,.8,.84);
  $('#altv').textContent=Math.round((dist-1)*6371).toLocaleString('en-IN');
  $('#llv').textContent=`${lat.toFixed(2)} N  ${(((lon%360)+540)%360-180).toFixed(2)} E`;

  // lens opens from the pin into the real drone footage
  const lp=ease(seg(p,.8,.9));
  if(lp>0){
    tmp.copy(jv).project(ecam);
    const w=ec.clientWidth,h=ec.clientHeight,x=(tmp.x+1)/2*w,y=(1-tmp.y)/2*h;
    lens.style.visibility='visible';
    lens.style.clipPath=`circle(${lp*Math.hypot(w,h)}px at ${x}px ${y}px)`;
    drone.style.transform=`scale(${lerp(1.35,1.04,ease(seg(p,.8,1)))})`;
    if(drone.paused) drone.play().catch(()=>{});
  } else { lens.style.visibility='hidden'; if(!drone.paused) drone.pause(); }
  const so=seg(p,.9,.95); showroom.style.opacity=so; showroom.style.transform=`translateY(${(1-so)*30}px)`;
  if(so>.5&&!counted){counted=true;document.querySelectorAll('[data-count]').forEach(el=>{const o={v:0},n=+el.dataset.count;gsap.to(o,{v:n,duration:RM?0:1.8,ease:'power3.out',onUpdate:()=>el.textContent=Math.round(o.v).toLocaleString('en-IN')+(el.dataset.plus!==undefined?'+':'')});});}
  if(lp<1) er.render(es,ecam);
}

}
/* ================= MACHINE ================= */
const rc=$('#rig'), stage=$('#stage');
const mr=new THREE.WebGLRenderer({canvas:rc,antialias:true,alpha:true});
mr.setPixelRatio(Math.min(devicePixelRatio,2)); mr.toneMapping=THREE.ACESFilmicToneMapping; mr.toneMappingExposure=1.05;
mr.shadowMap.enabled=true; mr.shadowMap.type=THREE.PCFSoftShadowMap;
const ms=new THREE.Scene();
ms.environment=new THREE.PMREMGenerator(mr).fromScene(new RoomEnvironment(),.04).texture;
ms.environmentIntensity=.75;
const mcam=new THREE.PerspectiveCamera(30,1,.05,50); mcam.position.set(2.9,1.75,3.1);
const controls=new OrbitControls(mcam,rc); controls.target.set(0,.72,0); controls.enableDamping=true; controls.enablePan=false; controls.enableZoom=false;
controls.minPolarAngle=.35; controls.maxPolarAngle=1.48; controls.autoRotate=!RM; controls.autoRotateSpeed=.7;

const key=new THREE.DirectionalLight(0xfff4ea,2.4); key.position.set(2.5,4.5,2.2); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-1.6,right:1.6,top:1.6,bottom:-1.6,near:.5,far:10}); key.shadow.bias=-.0004; key.shadow.radius=6; ms.add(key);
const rim=new THREE.DirectionalLight(0xc8d3ff,1.0); rim.position.set(-3,2.2,-2.6); ms.add(rim);
ms.add(new THREE.HemisphereLight(0xffffff,0x202024,.35));
const ground=new THREE.Mesh(new THREE.CircleGeometry(4,64),new THREE.ShadowMaterial({opacity:.55})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; ms.add(ground);

const M={
  frame:new THREE.MeshPhysicalMaterial({color:0x1a1b1e,metalness:.55,roughness:.46,clearcoat:.5,clearcoatRoughness:.45}),
  chrome:new THREE.MeshStandardMaterial({color:0xf2f2f2,metalness:1,roughness:.1}),
  pad:new THREE.MeshPhysicalMaterial({color:0x141415,roughness:.72,metalness:0,sheen:.6,sheenRoughness:.5,sheenColor:new THREE.Color(0x444448)}),
  rubber:new THREE.MeshStandardMaterial({color:0x0e0e0f,roughness:.92}),
  knob:new THREE.MeshStandardMaterial({color:0xd8311f,roughness:.35,metalness:.1}),
};
const blueMat=()=>new THREE.MeshPhysicalMaterial({color:0x1d4ad6,metalness:.45,roughness:.26,clearcoat:1,clearcoatRoughness:.12,emissive:0x2f5cf2,emissiveIntensity:0});
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function bent(pts,r=.07){const path=new THREE.CurvePath();let prev=pts[0].clone();
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1];const d1=b.clone().sub(a).normalize(),d2=c.clone().sub(b).normalize();const rr=Math.min(r,a.distanceTo(b)/2,b.distanceTo(c)/2);const p1=b.clone().addScaledVector(d1,-rr),p2=b.clone().addScaledVector(d2,rr);path.add(new THREE.LineCurve3(prev,p1));path.add(new THREE.QuadraticBezierCurve3(p1,b,p2));prev=p2;}
  path.add(new THREE.LineCurve3(prev,pts[pts.length-1]));return path;}
function tube(pts,rad,mat,r){const m=new THREE.Mesh(new THREE.TubeGeometry(pts.length>2?bent(pts,r):new THREE.LineCurve3(pts[0],pts[1]),pts.length>2?96:8,rad,20,false),mat);m.castShadow=m.receiveShadow=true;return m;}
function box(w,h,d,mat,pos,r=.012){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);m.position.copy(pos);m.castShadow=m.receiveShadow=true;return m;}
function cyl(r,len,mat,pos,axis='x',seg=40){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),mat);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;m.position.copy(pos);m.castShadow=m.receiveShadow=true;return m;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

const machine=new THREE.Group(); ms.add(machine);
const parts=[];
function part(name,desc,ex,anchor){const g=new THREE.Group();g.userData={name,desc,ex,anchor,base:new THREE.Vector3()};machine.add(g);parts.push(g);return g;}

// base frame
const base=part('Steel base frame','Wide footprint. Bolts to the floor if you need it to.',V(0,-.22,0),V(.46,.05,-.3));
[-.42,.42].forEach(x=>base.add(box(.07,.07,1.32,M.frame,V(x,.045,-.12))));
[-.72,.08,.46].forEach(z=>base.add(box(.92,.06,.07,M.frame,V(0,.04,z))));
base.add(box(.07,.06,1.2,M.frame,V(0,.04,-.12)));
[[-.42,-.74],[.42,-.74],[-.42,.5],[.42,.5]].forEach(([x,z])=>base.add(box(.1,.02,.1,M.rubber,V(x,.01,z),.004)));

// footplate
const foot=part('Footplate','Non-slip deck so you can brace and drive.',V(0,-.05,.38),V(.3,.14,.85));
const tread=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#151516';g.fillRect(0,0,w,h);g.fillStyle='#232325';for(let y=10;y<h;y+=18)g.fillRect(0,y,w,7);});
foot.add(box(.88,.07,.42,new THREE.MeshStandardMaterial({map:tread,roughness:.9}),V(0,.1,.72),.02));
foot.add(box(.9,.05,.44,M.frame,V(0,.05,.72),.01));
const brand=canvasTex(1024,128,(g,w,h)=>{g.fillStyle='#e9e9ea';g.font='800 74px Archivo, sans-serif';g.textAlign='right';g.textBaseline='middle';g.fillText('PRO BODYLINE',w-30,h/2+4);});
const brandPlane=new THREE.Mesh(new THREE.PlaneGeometry(.44,.055),new THREE.MeshBasicMaterial({map:brand,transparent:true}));brandPlane.position.set(.2,.09,.932);foot.add(brandPlane);

// rear uprights + pivots
const PIV=[V(-.47,1.24,-.5),V(.47,1.24,-.5)];
const uprights=part('Pivot towers','Twin uprights carry each arm on its own bearing.',V(0,0,-.32),V(.42,.45,-.72));
[-.42,.42].forEach((x,i)=>{
  uprights.add(tube([V(x,.08,-.74),V(x,.7,-.66),V(x,1.24,-.5)],.04,M.frame,.25));
  uprights.add(tube([V(x,.08,.02),V(x,.82,-.56)],.03,M.frame));
  uprights.add(cyl(.055,.16,M.frame,V(x+(i?.045:-.045),1.24,-.5)));
  uprights.add(cyl(.03,.012,M.chrome,V(x+(i?.13:-.13),1.24,-.5)));
});

// seat column (fixed) + seat (adjustable)
const column=part('Seat column','',V(0,-.1,.12),V(0,.3,.12)); column.userData.nolabel=true;
column.add(box(.075,.36,.075,M.frame,V(0,.24,.12)));
const seat=part('Contoured seat','Pop-pin height adjustment with eight positions.',V(0,.24,.32),V(.24,.6,.2));
seat.add(cyl(.026,.24,M.chrome,V(0,.42,.12),'y'));
seat.add(box(.46,.1,.4,M.pad,V(0,.56,.13),.045));
seat.add(box(.36,.02,.3,M.frame,V(0,.5,.13),.006));
seat.add(cyl(.022,.06,M.knob,V(.07,.36,.12)));

const back=part('Back and head pad','Angled to keep your shoulders set through the press.',V(0,.18,-.36),V(-.22,1.15,-.25));
back.add(tube([V(0,.08,.0),V(0,.12,-.28),V(0,1.5,-.46)],.032,M.frame,.12));
const bp=box(.42,.78,.1,M.pad,V(0,1.0,-.24),.045); bp.rotation.x=-.2; back.add(bp);
const hp=box(.28,.2,.09,M.pad,V(0,1.5,-.35),.04); hp.rotation.x=-.2; back.add(hp);

// lever arms, built in pivot-local coordinates
const levers={};
['L','R'].forEach((side,i)=>{
  const s=i?1:-1, P=PIV[i];
  const g=part(i?'Right lever arm':'Left lever arm',i?'Moves independently of the left.':'Iso-lateral, so a stronger side cannot carry a weaker one.',V(s*.42,.08,0),V(s*.12,-.42,.5));
  g.position.copy(P); g.userData.base.copy(P); g.userData.side=side; g.userData.lever=true;
  const mat=blueMat(); g.userData.mat=mat;
  const L=(x,y,z)=>V(x-P.x,y-P.y,z-P.z);
  g.add(tube([L(s*.47,1.24,-.5),L(s*.47,1.37,.12),L(s*.47,1.34,.32),L(s*.3,1.27,.46)],.03,mat,.09));
  g.add(tube([L(s*.47,1.24,-.5),L(s*.49,.6,-.12),L(s*.51,.44,-.02)],.032,mat,.12));
  g.add(tube([L(s*.39,1.305,.385),L(s*.29,1.265,.465)],.036,M.rubber));
  // generous invisible hit areas so the arms are easy to grab
  const hitMat=new THREE.MeshBasicMaterial({visible:false});
  g.add(tube([L(s*.47,1.24,-.5),L(s*.47,1.37,.12),L(s*.47,1.34,.32),L(s*.3,1.27,.46)],.09,hitMat,.09));
  g.add(tube([L(s*.47,1.24,-.5),L(s*.49,.6,-.12),L(s*.51,.44,-.02)],.08,hitMat,.12));
  g.add(cyl(.045,.05,M.frame,L(s*.52,.44,-.02)));
  g.add(cyl(.025,.3,M.chrome,L(s*.69,.44,-.02)));
  g.add(cyl(.05,.02,M.chrome,L(s*.555,.44,-.02)));
  g.add(cyl(.032,.012,M.chrome,L(s*.845,.44,-.02)));
  const rack=new THREE.Group(); rack.position.copy(L(s*.565,.44,-.02)); rack.userData.s=s; g.add(rack);
  g.userData.rack=rack; g.userData.plates=[];
  levers[side]=g;
});
const LEVER_PARTS=[levers.L,levers.R];

// plates
const PLATE={2.5:{r:.09,t:.022},5:{r:.115,t:.028},10:{r:.165,t:.036},15:{r:.2,t:.044},20:{r:.225,t:.05}};
const HORN=.27, faceMats={};
function faceMat(w){ if(faceMats[w]) return faceMats[w];
  const t=canvasTex(512,512,(g,W)=>{g.fillStyle='#121213';g.fillRect(0,0,W,W);g.strokeStyle='#2a2a2c';g.lineWidth=10;g.beginPath();g.arc(256,256,232,0,7);g.stroke();g.beginPath();g.arc(256,256,120,0,7);g.stroke();
    g.fillStyle='#e9e9ea';g.textAlign='center';g.textBaseline='middle';g.font=`800 ${w<10?70:86}px Archivo, sans-serif`;g.fillText(String(w),256,82);g.font='700 40px Archivo, sans-serif';g.fillText('KG',256,438);});
  t.center.set(.5,.5);t.rotation=-Math.PI/2;
  return faceMats[w]=new THREE.MeshStandardMaterial({map:t,roughness:.8});}
function plateMesh(w){const {r,t}=PLATE[w];const grp=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,t,72),[M.rubber,faceMat(w),faceMat(w)]);m.rotation.z=Math.PI/2;m.castShadow=m.receiveShadow=true;grp.add(m);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,t+.004,32),M.chrome);hub.rotation.z=Math.PI/2;grp.add(hub);
  grp.userData={w,t};return grp;}
const used=side=>levers[side].userData.plates.reduce((a,p)=>a+p.userData.t,0);
function addPlate(w){
  if(used('L')+PLATE[w].t>HORN) return;
  dispatchEvent(new CustomEvent('pbl:slide',{detail:{w}}));
  ['L','R'].forEach(side=>{const g=levers[side],s=g.userData.rack.userData.s,pm=plateMesh(w);
    const x=s*(used(side)+PLATE[w].t/2); pm.position.x=s*(HORN+.3); g.userData.rack.add(pm); g.userData.plates.push(pm);
    gsap.to(pm.position,{x,duration:RM?0:.6,ease:'power3.out',onComplete:()=>{if(side==='L')dispatchEvent(new CustomEvent('pbl:plate',{detail:{w}}));}}); if(!RM)gsap.from(pm.rotation,{x:Math.PI*.6,duration:.6,ease:'power3.out'});});
  updLoad();}
function clearPlates(){dispatchEvent(new CustomEvent('pbl:strip',{detail:{n:levers.L.userData.plates.length}}));['L','R'].forEach(side=>{const g=levers[side];g.userData.plates.forEach(pm=>gsap.to(pm.position,{x:g.userData.rack.userData.s*(HORN+.45),duration:RM?0:.4,ease:'power2.in',onComplete:()=>g.userData.rack.remove(pm)}));g.userData.plates=[];});updLoad();}
const perSide=()=>levers.L.userData.plates.reduce((a,p)=>a+p.userData.w,0);
function updLoad(){const k=perSide();$('#kgSide').textContent=k;$('#kgTotal').textContent=k*2;
  document.querySelectorAll('#plateBtns button').forEach(b=>b.disabled=used('L')+PLATE[b.dataset.w].t>HORN);}

// labels + part list
const labelsEl=$('#labels'), partList=$('#partList');
parts.filter(p=>!p.userData.nolabel).forEach(p=>{
  const el=document.createElement('div');el.className='lbl';el.innerHTML=`<b>${p.userData.name}</b><span>${p.userData.desc}</span>`;labelsEl.append(el);p.userData.el=el;
  const li=document.createElement('li');li.innerHTML=`<button>${p.userData.name}<i class="ph ph-crosshair"></i></button>`;partList.append(li);
  const b=li.firstChild;
  b.addEventListener('mouseenter',()=>el.classList.add('hot'));b.addEventListener('mouseleave',()=>el.classList.remove('hot'));
  b.addEventListener('click',()=>{p.updateMatrixWorld();const w=p.localToWorld(p.userData.anchor.clone());gsap.to(controls.target,{x:w.x*.5,y:clamp(w.y,.4,1.1),z:w.z*.5,duration:.8,ease:'power3.inOut'});});
});

// state
const MAX=.62;
const st={ang:{L:0,R:0},explode:0,seat:4,mode:'inspect',reps:{L:0,R:0}};
const peak={L:0,R:0};
function rep(side){st.reps[side]++;$('#rep'+side).textContent=st.reps[side];gsap.fromTo('#rep'+side,{color:'#8ea5ff'},{color:'#ecebe7',duration:.8});}

// modes
const HINTS={inspect:'Drag to turn the machine. Set the seat to your height.',train:'Grab either handle and push it up. The arms move independently.',load:'Add plates. Both horns load evenly, and the total updates live.',explode:'Every part, pulled apart. Hover a name to find it.',customise:'Pick the colours and put your gym logo on it. Every option renders live.'};
let autoTL=null;
function stopAuto(){if(autoTL){autoTL.kill();autoTL=null;gsap.to(st.ang,{L:0,R:0,duration:.5});}$('#auto').setAttribute('aria-pressed','false');}
function setMode(m){st.mode=m;
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.mode===m));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===m));
  $('#hint').textContent=HINTS[m];
  gsap.to(st,{explode:m==='explode'?1:0,duration:RM?0:1.1,ease:'power3.inOut'});
  gsap.to(mcam,{fov:m==='explode'?38:30,duration:1,ease:'power3.inOut',onUpdate:()=>mcam.updateProjectionMatrix()});
  gsap.to(controls.target,{x:0,y:m==='load'?.6:.75,z:0,duration:.8});
  if(m!=='inspect') controls.autoRotate=false;
  if(m!=='train') stopAuto();
  if(m==='load') gsap.to(mcam.position,{x:3.9,y:1.55,z:1.9,duration:1.1,ease:'power3.inOut'});
  if(m==='train') gsap.to(mcam.position,{x:2.0,y:1.9,z:3.5,duration:1.1,ease:'power3.inOut'});
  if(m==='explode') gsap.to(mcam.position,{x:3.2,y:2.0,z:3.2,duration:1.1,ease:'power3.inOut'});
}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('#seat').addEventListener('input',e=>{$('#seatV').textContent='Position '+e.target.value;gsap.to(st,{seat:+e.target.value,duration:.5,ease:'back.out(2)'});});
$('#resetView').addEventListener('click',()=>{gsap.to(mcam.position,{x:2.9,y:1.75,z:3.1,duration:1,ease:'power3.inOut'});gsap.to(controls.target,{x:0,y:.72,z:0,duration:1});});
$('#spin').addEventListener('click',e=>{controls.autoRotate=!controls.autoRotate;e.currentTarget.setAttribute('aria-pressed',controls.autoRotate);});
$('#plateBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(b)addPlate(+b.dataset.w);});
$('#clearPlates').addEventListener('click',clearPlates);
$('#zeroReps').addEventListener('click',()=>{st.reps={L:0,R:0};$('#repL').textContent=0;$('#repR').textContent=0;});
$('#auto').addEventListener('click',()=>{
  if(autoTL){stopAuto();return;}
  $('#auto').setAttribute('aria-pressed','true');
  const d=.7+perSide()/120; autoTL=gsap.timeline({repeat:-1});
  ['L','R'].forEach(s=>autoTL.to(st.ang,{[s]:MAX*.95,duration:d,ease:'power2.out'}).to(st.ang,{[s]:0,duration:d*1.2,ease:'power2.inOut',onComplete:()=>rep(s)}));
});
updLoad();

/* ================= SHOWROOM FLOOR (walk-through) ================= */
const hc=$('#hall');
const hr=new THREE.WebGLRenderer({canvas:hc,antialias:false,powerPreference:'high-performance'});
hr.setPixelRatio(Math.min(devicePixelRatio,1.25)); hr.toneMapping=THREE.ACESFilmicToneMapping; hr.toneMappingExposure=1.0;
hr.shadowMap.enabled=true; hr.shadowMap.type=THREE.PCFSoftShadowMap;
const hs=new THREE.Scene(); hs.background=new THREE.Color(0x0a0b0c); hs.fog=new THREE.Fog(0x0a0b0c,16,62);
hs.environment=new THREE.PMREMGenerator(hr).fromScene(new RoomEnvironment(),.04).texture; hs.environmentIntensity=.8;
const hcam=new THREE.PerspectiveCamera(50,1,.1,140); hcam.rotation.order='YXZ';

hs.add(new THREE.HemisphereLight(0xe4e9ff,0x222226,1.1));
const sun=new THREE.DirectionalLight(0xfff3e8,2.6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-15,right:15,top:16,bottom:-16,near:1,far:45}); sun.shadow.bias=-.0004; sun.shadow.normalBias=.03;
hs.add(sun,sun.target);
const lamp=new THREE.PointLight(0xffe6cc,60,24,1.5); hs.add(lamp);

const SR={
  charcoal:new THREE.MeshPhysicalMaterial({color:0x2b2d31,metalness:.5,roughness:.4,clearcoat:.5,clearcoatRoughness:.3}),
  alu:new THREE.MeshStandardMaterial({color:0xbcc0c7,metalness:.85,roughness:.3}),
  blue:new THREE.MeshPhysicalMaterial({color:0x1d4ad6,metalness:.45,roughness:.26,clearcoat:1,clearcoatRoughness:.12}),
  stack:new THREE.MeshStandardMaterial({color:0x1c1c1d,metalness:.6,roughness:.45}),
  screen:new THREE.MeshBasicMaterial({color:new THREE.Color(.45,.7,2.2)}),
  led:new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,1.46,1.4)}),
  ledBlue:new THREE.MeshBasicMaterial({color:new THREE.Color(.3,.55,2.2)}),
  concreteCol:new THREE.MeshStandardMaterial({color:0x2a2b2e,roughness:.8}),
};
{const bt=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#111112';g.fillRect(0,0,w,h);g.fillStyle='#202022';for(let y=0;y<h;y+=16)g.fillRect(0,y,w,5);});bt.wrapS=bt.wrapT=THREE.RepeatWrapping;bt.repeat.set(1,6);SR.belt=new THREE.MeshStandardMaterial({map:bt,roughness:.85});}

// text textures redraw once the brand font is ready
function textTex(w,h,draw){const t=canvasTex(w,h,draw);document.fonts.ready.then(()=>{draw(t.image.getContext('2d'),w,h);t.needsUpdate=true;});return t;}

// merge a modelled product into one geometry per material, then instance it
function bake(root,remap=m=>m){root.updateMatrixWorld(true);const by=new Map();
  root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.visible===false)return;
    let g=o.geometry.clone().applyMatrix4(o.matrixWorld); if(g.index)g=g.toNonIndexed();
    if(!g.attributes.uv||!g.attributes.normal)return;
    Object.keys(g.attributes).forEach(k=>{if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);});
    g.clearGroups(); const m=remap(o.material); if(!by.has(m))by.set(m,[]); by.get(m).push(g);});
  return [...by].map(([mat,gs])=>({mat,geo:mergeGeometries(gs)}));}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(1,1,1),_p=new THREE.Vector3();
function place(baked,list){baked.forEach(({mat,geo})=>{const im=new THREE.InstancedMesh(geo,mat,list.length);
  list.forEach(([x,z,ry],i)=>{_m.compose(_p.set(x,0,z),_q.setFromEuler(_e.set(0,ry,0)),_s);im.setMatrixAt(i,_m);});
  im.castShadow=im.receiveShadow=!mat.isMeshBasicMaterial; im.frustumCulled=false; hs.add(im);});}

/* ---- products (front faces +z, floor at y=0, metres) ---- */
function mkTreadmill(){const g=new THREE.Group();
  g.add(box(.86,.2,1.95,SR.charcoal,V(0,.12,0),.05));
  const belt=box(.54,.03,1.62,SR.belt,V(0,.235,-.06),.006);belt.userData.role='belt';g.add(belt);
  [-.355,.355].forEach(x=>g.add(box(.12,.035,1.72,SR.alu,V(x,.24,-.05),.008)));
  g.add(box(.86,.32,.44,SR.charcoal,V(0,.3,.8),.1));
  [-1,1].forEach(s=>{g.add(tube([V(s*.39,.42,.88),V(s*.35,1.26,.78)],.035,SR.charcoal));g.add(tube([V(s*.35,1.12,.76),V(s*.36,1.12,.18)],.02,SR.alu));});
  const con=new THREE.Group();con.position.set(0,1.36,.78);con.rotation.x=.5;g.add(con);
  con.add(box(.8,.36,.1,SR.charcoal,V(0,0,0),.04));
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.52,.22),SR.screen);scr.position.z=-.052;scr.rotation.y=Math.PI;con.add(scr);
  return g;}
function mkBike(){const g=new THREE.Group();
  [.45,-.45].forEach(z=>g.add(box(.6,.05,.08,SR.charcoal,V(0,.03,z),.02)));
  g.add(tube([V(0,.06,.45),V(0,.4,.28),V(0,.98,.4)],.038,SR.charcoal,.1));
  g.add(tube([V(0,.06,-.45),V(0,.4,-.02),V(0,.4,.28)],.038,SR.charcoal,.1));
  g.add(tube([V(0,.4,-.02),V(0,.92,-.26)],.032,SR.charcoal));
  const fw=new THREE.Group();fw.position.set(0,.36,.36);fw.userData.role='flywheel';g.add(fw);
  fw.add(cyl(.24,.05,M.chrome,V(0,0,0),'x',56));fw.add(cyl(.2,.056,SR.charcoal,V(0,0,0),'x',48));
  for(let k=0;k<3;k++){const sp=box(.06,.38,.035,M.chrome,V(0,0,0),.006);sp.rotation.x=k*Math.PI/3;fw.add(sp);}
  const cr=new THREE.Group();cr.position.set(0,.38,0);cr.userData.role='crank';g.add(cr);
  cr.add(cyl(.09,.03,SR.charcoal,V(.06,0,0),'x',32));
  [1,-1].forEach(s=>{cr.add(box(.025,.2,.035,M.chrome,V(s*.1,-s*.09,0),.006));cr.add(box(.1,.025,.07,M.rubber,V(s*.15,-s*.19,0),.008));});
  g.add(tube([V(-.22,1.0,.32),V(-.2,.99,.5),V(.2,.99,.5),V(.22,1.0,.32)],.018,M.rubber,.05));
  g.add(box(.16,.06,.27,M.pad,V(0,.96,-.3),.025));
  return g;}
function mkElliptical(){const g=new THREE.Group();
  g.add(box(.5,.08,1.8,SR.charcoal,V(0,.05,-.1),.03));
  g.add(box(.42,.62,.4,SR.charcoal,V(0,.38,.72),.12));
  [-1,1].forEach(s=>{g.add(box(.14,.04,.42,M.rubber,V(s*.13,.34,-.25),.01));g.add(tube([V(s*.13,.32,-.05),V(s*.18,.6,.5)],.025,SR.alu));g.add(tube([V(s*.18,.6,.5),V(s*.26,1.55,.36)],.022,SR.alu));});
  g.add(box(.36,.22,.08,SR.charcoal,V(0,1.25,.66),.03));
  return g;}
function mkStation(){const g=new THREE.Group();
  g.add(box(1.0,.06,1.3,M.frame,V(0,.03,-.1),.01));
  [-1,1].forEach(s=>{g.add(box(.08,2.1,.1,M.frame,V(s*.45,1.08,-.55),.01));g.add(cyl(.012,1.9,M.chrome,V(s*.1,1.05,-.55),'y',12));
    g.add(tube([V(s*.45,1.7,-.5),V(s*.43,1.45,.25),V(s*.3,1.3,.42)],.028,SR.blue,.1));});
  g.add(box(1.0,.1,.14,M.frame,V(0,2.13,-.55),.01));
  for(let i=0;i<13;i++)g.add(box(.3,.05,.16,SR.stack,V(0,.1+i*.056,-.55),.006));
  g.add(box(.075,.42,.075,M.frame,V(0,.25,.2),.01));
  g.add(box(.42,.09,.38,M.pad,V(0,.5,.22),.04));
  g.add(box(.38,.62,.09,M.pad,V(0,.98,-.14),.04));
  g.add(tube([V(0,.06,-.5),V(0,.06,-.18),V(0,.7,-.2)],.03,M.frame));
  return g;}
function mkRack(){const g=new THREE.Group();
  [[-.6,-.55],[.6,-.55],[-.6,.55],[.6,.55]].forEach(([x,z])=>g.add(box(.08,2.3,.08,M.frame,V(x,1.15,z),.01)));
  [-.55,.55].forEach(z=>g.add(box(1.28,.08,.08,M.frame,V(0,2.28,z),.01)));
  [-.6,.6].forEach(x=>{g.add(box(.08,.08,1.18,M.frame,V(x,2.28,0),.01));g.add(box(.08,.06,1.18,M.frame,V(x,.03,0),.01));g.add(box(.06,.06,.12,M.chrome,V(x,1.3,.6),.01));});
  g.add(cyl(.014,2.2,M.chrome,V(0,1.37,.62),'x',16));
  [-1,1].forEach(s=>{g.add(cyl(.026,.42,M.chrome,V(s*.92,1.37,.62),'x',16));[0,1].forEach(k=>g.add(cyl(.225,.05,M.rubber,V(s*(.78+k*.055),1.37,.62),'x',48)));});
  g.add(box(.3,.08,1.2,M.pad,V(0,.45,1.45),.03));
  [1.05,1.85].forEach(z=>{g.add(box(.08,.4,.08,M.frame,V(0,.22,z),.01));g.add(box(.5,.05,.08,M.frame,V(0,.03,z),.01));});
  return g;}
function mkDumbbells(){const g=new THREE.Group();
  [-1.3,1.3].forEach(x=>{g.add(box(.06,.95,.06,M.frame,V(x,.47,-.15),.01));g.add(box(.06,.06,.6,M.frame,V(x,.03,0),.01));});
  g.add(box(2.66,.04,.34,M.frame,V(0,.6,.08),.01)); g.add(box(2.66,.04,.3,M.frame,V(0,.9,-.2),.01));
  for(let i=0;i<9;i++){const x=-1.12+i*.28;[[.62,.08,1],[.92,-.2,.75]].forEach(([y,z,k])=>{const r=(.05+i*.007)*k;
    g.add(cyl(.016,.12,M.chrome,V(x,y+r,z),'z',10));[-1,1].forEach(s=>{const h=cyl(r,.07,M.rubber,V(x,y+r,z+s*.095),'z',6);h.rotation.z=Math.PI/6;g.add(h);});});}
  return g;}
function mkBench(){const g=new THREE.Group();
  g.add(box(.3,.08,1.2,M.pad,V(0,.45,0),.03));
  [-.4,.4].forEach(z=>{g.add(box(.08,.4,.08,M.frame,V(0,.22,z),.01));g.add(box(.5,.05,.08,M.frame,V(0,.03,z),.01));});
  return g;}

const BAKED={};
const PI2=Math.PI/2, L=PI2, R=-PI2;
const rows=(xs,zs,ry)=>xs.flatMap(x=>zs.map(z=>[x,z,ry]));
const zr=(a,n,step)=>Array.from({length:n},(_,i)=>a-i*step);
// cardio
place(BAKED.treadmill=bake(mkTreadmill()),[...rows([-4.2,-7.0],zr(2,7,1.15),L),...rows([4.2,7.0],zr(2,7,1.15),R)]);
place(BAKED.bike=bake(mkBike()),[...rows([-3.4,-4.9,-6.4,-7.9],zr(-7.5,5,1.25),L),...rows([3.4,4.9,6.4,7.9],zr(-7.5,5,1.25),R)]);
place(BAKED.elliptical=bake(mkElliptical()),[...rows([-4,-6.6],zr(-15.5,6,1.25),L),...rows([4,6.6],zr(-15.5,6,1.25),R)]);
// strength: the same press as the studio below, plus selectorised stations
const pressBaked=bake(machine,m=>LEVER_PARTS.some(l=>l.userData.mat===m)?SR.blue:m);
const FEATURED=V(3.7,1.1,-35);
place(BAKED.press=pressBaked,[...rows([-3.7,-6.6],zr(-31.5,4,3.5),L),...rows([6.6],zr(-31.5,4,3.5),R),[3.7,-31.5,R],[3.7,-35,R],[3.7,-38.5,R],[3.7,-42,R]]);
place(BAKED.station=bake(mkStation()),[...rows([-3.8,-6.9],zr(-46.5,4,3.3),L),...rows([3.8,6.9],zr(-46.5,4,3.3),R)]);
// free weights
place(BAKED.rack=bake(mkRack()),[...rows([-4.6],zr(-63,4,4.4),L),...rows([4.6],zr(-63,4,4.4),R)]);
place(BAKED.dumbbells=bake(mkDumbbells()),[...rows([-10.6],zr(-63,6,3),L),...rows([10.6],zr(-63,6,3),R)]);
place(BAKED.bench=bake(mkBench()),[...rows([-7.6],zr(-64,5,3.6),L),...rows([7.6],zr(-64,5,3.6),R)]);

/* ---- the building ---- */
const concrete=canvasTex(1024,1024,(g,W)=>{g.fillStyle='#38393c';g.fillRect(0,0,W,W);for(let i=0;i<30000;i++){const v=40+Math.random()*40|0;g.fillStyle=`rgba(${v},${v},${v+3},${Math.random()*.3})`;g.fillRect(Math.random()*W,Math.random()*W,1+Math.random()*3,1+Math.random()*3);}g.strokeStyle='rgba(18,18,20,.7)';g.lineWidth=3;g.strokeRect(0,0,W,W);});
concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping; concrete.repeat.set(6,26);
const FW=24,FL=106,FZ=-43;
const mirror=new Reflector(new THREE.PlaneGeometry(FW,FL),{textureWidth:1024,textureHeight:1024,color:0x4a4a4c,clipBias:.003});
mirror.rotation.x=-PI2; mirror.position.set(0,-.002,FZ); hs.add(mirror);
const floorTop=new THREE.Mesh(new THREE.PlaneGeometry(FW,FL),new THREE.MeshStandardMaterial({map:concrete,roughness:.55,metalness:.1,transparent:true,opacity:.9}));
floorTop.rotation.x=-PI2; floorTop.position.set(0,.002,FZ); floorTop.receiveShadow=true; hs.add(floorTop);

const wallTex=canvasTex(1024,512,(g,W,H)=>{g.fillStyle='#1d1e21';g.fillRect(0,0,W,H);g.strokeStyle='#28292d';g.lineWidth=4;for(let x=0;x<=W;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}});
wallTex.wrapS=THREE.RepeatWrapping; wallTex.repeat.set(12,1);
const wallMat=new THREE.MeshStandardMaterial({map:wallTex,roughness:.85,side:THREE.DoubleSide});
[-12,12].forEach(x=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(FL,6.2),wallMat);w.position.set(x,3.1,FZ);w.rotation.y=x<0?PI2:-PI2;w.receiveShadow=true;hs.add(w);});
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(FW,FL),new THREE.MeshStandardMaterial({color:0x0f1012,roughness:.9}));ceil.rotation.x=PI2;ceil.position.set(0,6.2,FZ);hs.add(ceil);
// front wall with the entrance
const fwMat=new THREE.MeshStandardMaterial({color:0x26272a,roughness:.8,side:THREE.DoubleSide});
[[-7.5,9],[7.5,9]].forEach(([x,w])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,6.2),fwMat);m.position.set(x,3.1,10);hs.add(m);});
const lintel=new THREE.Mesh(new THREE.PlaneGeometry(6,2.2),fwMat);lintel.position.set(0,5.1,10);hs.add(lintel);
[[-3,2,.1,4],[3,2,.1,4],[0,4,6.1,.1]].forEach(([x,y,w,h])=>hs.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,.12),SR.alu).translateX(x).translateY(y).translateZ(10)));
const outSign=textTex(2048,256,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='#fff';g.font='800 190px Archivo, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('PROBODYLINE',W/2,H/2+10);});
const os=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.7),new THREE.MeshBasicMaterial({map:outSign,transparent:true,color:new THREE.Color(2.4,2.4,2.4)}));os.position.set(0,5.25,10.03);hs.add(os);
// end wall brand
const endMat=new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:.8});
const endWall=new THREE.Mesh(new THREE.PlaneGeometry(FW,6.2),endMat);endWall.position.set(0,3.1,FZ-FL/2+.01);hs.add(endWall);
const endTex=textTex(2048,512,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='#fff';g.font='800 300px Archivo, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('PROBODYLINE',W/2,H/2-30);g.font='600 64px Archivo, sans-serif';g.fillStyle='#b9c6ff';g.fillText('IF IT’S UNIQUE, IT’S PROBODYLINE',W/2,H/2+170);});
const et=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),new THREE.MeshBasicMaterial({map:endTex,transparent:true,color:new THREE.Color(1.25,1.25,1.25)}));et.position.set(0,3.4,FZ-FL/2+.05);hs.add(et);
// lighting rigs, aisle lines, pillars
[-8,-4,0,4,8].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.07,.03,FL-4),SR.led);s.position.set(x,6.16,FZ);hs.add(s);});
[-2.3,2.3].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.05,.01,FL-6),SR.ledBlue);s.position.set(x,.008,FZ-1);hs.add(s);});
for(let z=-4;z>-92;z-=12)[-11.3,11.3].forEach(x=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.7,6.2,.7),SR.concreteCol);p.position.set(x,3.1,z);p.castShadow=p.receiveShadow=true;hs.add(p);});
// hanging zone signs
const signDark=new THREE.MeshStandardMaterial({color:0x0d0e10,roughness:.6});
function sign(text,z){const t=textTex(1024,256,(g,W,H)=>{g.fillStyle='#0d0e10';g.fillRect(0,0,W,H);g.fillStyle='#fff';let fs=150;do{g.font=`800 ${fs}px Archivo, sans-serif`;fs-=6;}while(g.measureText(text).width>W-110&&fs>40);g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2+4);g.fillStyle='#2f5cf2';g.fillRect(0,H-16,W,16);});
  const face=new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(1.5,1.5,1.5)});
  const m=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.05,.08),[signDark,signDark,signDark,signDark,face,signDark]);m.position.set(0,4.55,z);hs.add(m);
  [-1.8,1.8].forEach(x=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1.1,6),SR.alu);c.position.set(x,5.65,z);hs.add(c);});}
sign('CARDIO',3.5); sign('STRENGTH',-28); sign('FREE WEIGHTS',-59);

/* ---- post ---- */
const composer=new EffectComposer(hr);
composer.addPass(new RenderPass(hs,hcam));
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.32,.45,.9); composer.addPass(bloom);
composer.addPass(new OutputPass());
function hResize(){const w=hc.clientWidth,h=hc.clientHeight;hr.setSize(w,h,false);composer.setSize(w,h);hcam.aspect=w/h;hcam.fov=hcam.aspect<1?68:50;hcam.updateProjectionMatrix();}

/* ---- walk ---- */
const ZONES=[
  {z:99,name:'Walk the floor',desc:'45,000 sq ft, aisle by aisle. This is what is waiting for you in Jaipur.'},
  {z:4,name:'Cardio',desc:'Treadmills, spin bikes and ellipticals, all powered up and ready to try.'},
  {z:-27,name:'Strength',desc:'Plate-loaded and selectorised machines, set up in working rows.'},
  {z:-58,name:'Free weights',desc:'Racks, benches and dumbbells, from the first plate to the heaviest pair.'},
  {z:-84,name:'See it in person',desc:'Every machine on this floor is in the showroom today.'},
];
const Z0=16,Z1=-82;
let walkP=0; ScrollTrigger.create({trigger:"#walk",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>walkP=s.progress});
const zoneEl=$('#zoneT'),zoneP=$('#zoneP'),zoneBox=$('#zoneBox'),tryBtn=$('#tryPress'),visitCta=$('#floorCta');
document.querySelectorAll('#zoneNav button').forEach((b,i)=>b.addEventListener('click',()=>{const s=$('#walk');const z=ZONES[i].z>Z0?Z0:ZONES[i].z-2;scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*clamp((Z0-z)/(Z0-Z1),0,1),behavior:RM?'auto':'smooth'});}));
let zIdx=-1; const lookT=new THREE.Vector2(), lookC=new THREE.Vector2();
$('#walk').addEventListener('pointermove',e=>lookT.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5));
const fv=new THREE.Vector3();
function hallFrame(t){
  if(!RM) SR.belt.map.offset.y-=.004;
  const p=walkP, z=lerp(Z0,Z1,p);
  if(!RM) lookC.lerp(lookT,.05);
  hcam.position.set(Math.sin(p*Math.PI*3)*.35,1.68+(RM?0:Math.sin(t*.0018)*.01),z);
  hcam.rotation.set(-.05-lookC.y*.18,Math.sin(p*Math.PI*5)*.32-lookC.x*.55,0);
  sun.position.set(5,18,z-4); sun.target.position.set(0,0,z-14); lamp.position.set(0,4.6,z-7);
  let i=0; for(let k=0;k<ZONES.length;k++) if(z<=ZONES[k].z) i=k;
  if(i!==zIdx){zIdx=i; zoneEl.textContent=ZONES[i].name; zoneP.textContent=ZONES[i].desc;
    if(!RM)gsap.fromTo(zoneBox,{opacity:0,y:18},{opacity:1,y:0,duration:.6,ease:'power3.out'});
    document.querySelectorAll('#zoneNav button').forEach((b,k)=>b.setAttribute('aria-current',k===i?'true':'false'));
    visitCta.style.display=i===4?'inline-flex':'none';}
  // pin a "try it" button on the featured press
  fv.copy(FEATURED).project(hcam); const d=hcam.position.distanceTo(FEATURED);
  if(fv.z<1&&Math.abs(fv.x)<.9&&Math.abs(fv.y)<.9&&d<15&&d>2.2){tryBtn.style.opacity=1;tryBtn.style.pointerEvents='auto';tryBtn.style.transform=`translate(${(fv.x+1)/2*hc.clientWidth}px,${(1-fv.y)/2*hc.clientHeight}px) translate(-50%,-120%)`;}
  else {tryBtn.style.opacity=0;tryBtn.style.pointerEvents='none';}
  if(window.PBL&&PBL.onHallFrame)PBL.onHallFrame(t,z);
  composer.render();
}

// direct manipulation of the handles
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2();
let drag=null, hover=null;
function hitLever(e){const r=rc.getBoundingClientRect();ptr.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ptr,mcam);
  const hits=ray.intersectObjects(LEVER_PARTS,true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.lever)o=o.parent;return o;}
function setGlow(g,v){LEVER_PARTS.forEach(l=>gsap.to(l.userData.mat,{emissiveIntensity:l===g?v:0,duration:.25}));}
rc.addEventListener('pointerdown',e=>{if(st.mode==='explode')return;const g=hitLever(e);if(!g)return;
  stopAuto();
  const s=g.userData.side; drag={side:s,y:e.clientY,a:st.ang[s]};peak[s]=st.ang[s];
  controls.enabled=false;rc.setPointerCapture(e.pointerId);stage.classList.add('grabbing');setGlow(g,.35);gsap.killTweensOf(st.ang);});
rc.addEventListener('pointermove',e=>{
  if(drag){const sens=1/(1+perSide()/120);st.ang[drag.side]=clamp(drag.a+(drag.y-e.clientY)/rc.clientHeight*3.4*sens,0,MAX);peak[drag.side]=Math.max(peak[drag.side],st.ang[drag.side]);return;}
  if(st.mode==='explode'){stage.classList.remove('grab');return;}
  const g=hitLever(e);if(g!==hover){hover=g;stage.classList.toggle('grab',!!g);setGlow(g,g?.18:0);}
});
const release=()=>{if(!drag)return;const s=drag.side;if(peak[s]>MAX*.82)rep(s);
  gsap.to(st.ang,{[s]:0,duration:RM?0:.55+perSide()/160,ease:'power2.in'});drag=null;controls.enabled=true;stage.classList.remove('grabbing');setGlow(hover,hover?.18:0);};
rc.addEventListener('pointerup',release);rc.addEventListener('pointercancel',release);
let idleT;
controls.addEventListener('start',()=>{clearTimeout(idleT);controls.autoRotate=false;});
controls.addEventListener('end',()=>{clearTimeout(idleT);idleT=setTimeout(()=>{if(st.mode==='inspect'&&$('#spin').getAttribute('aria-pressed')==='true'&&!RM)controls.autoRotate=true;},5000);});

function mResize(){const w=rc.clientWidth,h=rc.clientHeight;mr.setSize(w,h,false);mcam.aspect=w/h;mcam.updateProjectionMatrix();}
const wv=new THREE.Vector3();
function machineFrame(){
  controls.update();
  const k=st.explode;
  parts.forEach(p=>p.position.copy(p.userData.base).addScaledVector(p.userData.ex,k));
  seat.position.y+=(st.seat-4)*.028;
  levers.L.rotation.x=-st.ang.L; levers.R.rotation.x=-st.ang.R;
  LEVER_PARTS.forEach(g=>g.userData.rack.position.x=g.userData.rack.userData.s*(.095+k*.22));
  altFrame(1/60);
  if(window.PBL&&PBL.onStudioFrame)PBL.onStudioFrame();
  const w=rc.clientWidth,h=rc.clientHeight;
  parts.forEach(p=>{const el=p.userData.el;if(!el)return;el.style.opacity=k>.6?(k-.6)/.4:0;if(k<.05)return;
    p.updateMatrixWorld();wv.copy(p.userData.anchor);p.localToWorld(wv);wv.project(mcam);el.style.transform=`translate(${(wv.x+1)/2*w+14}px,${(1-wv.y)/2*h-8}px)`;});
  mr.render(ms,mcam);
}


/* ================= STUDIO: every machine ================= */
const MAKERS={treadmill:mkTreadmill,bike:mkBike,elliptical:mkElliptical,station:mkStation,rack:mkRack,dumbbells:mkDumbbells,bench:mkBench};
const PRICE=(window.SITE&&SITE.prices)||{};
const PRODUCTS={
  press:{price:PRICE.press??null,name:'Iso-lateral plate-loaded press',short:'Iso-lateral press',cat:'Plate-loaded strength',g:'Strength',muscles:['chest','shoulders','arms'],blurb:'Spin it, load it, take it apart. Each arm moves on its own, exactly like the one on the showroom floor.'},
  treadmill:{price:PRICE.treadmill??null,name:'Commercial treadmills',short:'Treadmills',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','cardio'],blurb:'Set the belt speed and watch it run. Built for floors that never close.'},
  bike:{price:PRICE.bike??null,name:'Spin bikes',short:'Spin bikes',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','cardio'],blurb:'Set the cadence. The flywheel and cranks follow, the way they do in a class.'},
  elliptical:{price:PRICE.elliptical??null,name:'Cross-trainers',short:'Cross-trainers',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','arms','cardio'],blurb:'Low impact, full body. A cardio floor favourite for every age.'},
  station:{price:PRICE.station??null,name:'Selectorised stations',short:'Stations',cat:'Selectorised strength',g:'Strength',muscles:['back','chest','arms'],blurb:'Pin-loaded weight stack with guided arms. Easy for beginners, solid for regulars.'},
  rack:{price:PRICE.rack??null,name:'Power racks',short:'Power racks',cat:'Racks and rigs',g:'Strength',muscles:['legs','glutes','back','chest','core'],blurb:'Squat, bench and pull in one footprint, with a bar, plates and a bench.'},
  dumbbells:{price:PRICE.dumbbells??null,name:'Dumbbells and racks',short:'Dumbbells',cat:'Free weights',g:'Free weights',muscles:['arms','shoulders','chest','back'],blurb:'Hex dumbbells on two-tier racks, from light pairs to the heaviest ones on the floor.'},
  bench:{price:PRICE.bench??null,name:'Benches',short:'Benches',cat:'Free weights',g:'Free weights',muscles:['chest','arms'],blurb:'The simplest thing in the gym, and the one everyone queues for.'},
};
const ALT={}; let cur='press';
const TRAIN_OK={press:1,treadmill:1,bike:1}, LOAD_OK={press:1};
st.speed=8; st.rpm=80; let runKm=0;
function altGroup(key){ if(ALT[key]) return ALT[key];
  const g=MAKERS[key](); g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});
  const c=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
  g.children.forEach(ch=>{const cc=new THREE.Box3().setFromObject(ch).getCenter(new THREE.Vector3()).sub(c);cc.y=Math.max(cc.y,0)*.8+.05;
    ch.userData.base=ch.position.clone(); ch.userData.ex=cc.lengthSq()>1e-5?cc.normalize().multiplyScalar(.38):V(0,.3,0);
    if(ch.userData.role)g.userData[ch.userData.role]=ch;});
  g.visible=false; machine.parent.add(g); return ALT[key]=g; }
const railEl=$('#prodRail');
railEl.innerHTML=Object.keys(PRODUCTS).map(k=>`<button role="tab" data-p="${k}" aria-selected="${k==='press'}">${PRODUCTS[k].short}</button>`).join('');
railEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b)setProduct(b.dataset.p);});
function dimsOf(obj){const b=new THREE.Box3().setFromObject(obj),z=b.getSize(new THREE.Vector3());return z;}
function frameObj(obj,dur=1){const b=new THREE.Box3().setFromObject(obj),c=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;
  const d=r/Math.sin(THREE.MathUtils.degToRad(mcam.fov/2))*(st.mode==='explode'?1.55:1.3);const dir=V(.62,.34,.7).normalize();const p=c.clone().addScaledVector(dir,d);
  gsap.to(controls.target,{x:c.x,y:c.y,z:c.z,duration:dur,ease:'power3.inOut'});gsap.to(mcam.position,{x:p.x,y:p.y,z:p.z,duration:dur,ease:'power3.inOut'});}
function setProduct(key){ cur=key; const d=PRODUCTS[key];
  $('#mName').textContent=d.name+'.'; $('#mDesc').textContent=d.blurb;
  railEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.p===key));
  machine.visible=key==='press'; Object.entries(ALT).forEach(([k,g])=>g.visible=false);
  const obj=key==='press'?machine:altGroup(key); obj.visible=true;
  document.querySelectorAll('#machine [data-for]').forEach(el=>el.hidden=el.dataset.for!==key);
  const tb=m=>document.querySelector(`.tabs [data-mode=${m}]`);
  tb('train').disabled=!TRAIN_OK[key]; tb('load').disabled=!LOAD_OK[key];
  labelsEl.style.display=partList.style.display=key==='press'?'':'none';
  if((st.mode==='train'&&!TRAIN_OK[key])||(st.mode==='load'&&!LOAD_OK[key])) setMode('inspect'); else setMode(st.mode);
  const z=dimsOf(obj); $('#dims').textContent=`Approx. ${z.x.toFixed(2)} m wide, ${z.z.toFixed(2)} m long, ${z.y.toFixed(2)} m tall`;
  if(key==='press'){gsap.to(mcam.position,{x:2.9,y:1.75,z:3.1,duration:1,ease:'power3.inOut'});gsap.to(controls.target,{x:0,y:.72,z:0,duration:1});} else frameObj(obj);
}
const _setMode=setMode;
setMode=function(m){_setMode(m);
  if(cur!=='press'){const H={inspect:'Drag to turn it. Every product gets this studio in the live site.',train:cur==='treadmill'?'Set the belt speed. The deck runs in real time.':'Set the cadence. Flywheel and cranks follow.',explode:'Every part, pulled apart.',customise:'Pick the colours and put your gym logo on it. Every option renders live.'};$('#hint').textContent=H[m]||'';
    if(m==='explode'||m==='inspect'||m==='train') frameObj(ALT[cur],.9);}
};
document.querySelectorAll('.tabs button').forEach(b=>{const n=b.cloneNode(true);b.replaceWith(n);n.addEventListener('click',()=>{if(!n.disabled)setMode(n.dataset.mode);});});
$('#speed').addEventListener('input',e=>{st.speed=+e.target.value;$('#speedV').textContent=st.speed.toFixed(1)+' km/h';});
$('#rpm').addEventListener('input',e=>{st.rpm=+e.target.value;$('#rpmV').textContent=st.rpm+' rpm';});
$('#tryPress').addEventListener('click',()=>setProduct('press'));
{const z=dimsOf(machine);$('#dims').textContent=`Approx. ${z.x.toFixed(2)} m wide, ${z.z.toFixed(2)} m long, ${z.y.toFixed(2)} m tall`;}
function altFrame(dt){ if(cur==='press') return; const g=ALT[cur]; if(!g) return; const k=st.explode;
  g.children.forEach(ch=>{if(ch.userData.base)ch.position.copy(ch.userData.base).addScaledVector(ch.userData.ex,k);});
  const on=st.mode==='train'&&!RM;
  if(cur==='treadmill'){const v=on?st.speed:0; SR.belt.map.offset.y-=v/3.6*dt/.27; runKm+=v/3600*dt; $('#roSpeed').textContent=v.toFixed(1); $('#roDist').textContent=runKm.toFixed(2);}
  if(cur==='bike'){const r=on?st.rpm:0; g.userData.flywheel.rotation.x-=r/60*Math.PI*2*dt*2.6; g.userData.crank.rotation.x-=r/60*Math.PI*2*dt; $('#roRpm').textContent=r; $('#roWatt').textContent=Math.round(r*r*.028);}
}
window.PBL={flight:()=>fp,walk:()=>walkP,hall:{scene:hs,cam:hcam},studio:{machine,levers,st,seat,back,foot,ms,mcam,controls,get cur(){return cur},get obj(){return cur==='press'?machine:ALT[cur]}},THREE,gsap,ScrollTrigger,OrbitControls,RoomEnvironment,M,SR,BAKED,PRODUCTS,MAKERS,RM,canvasTex,
  showProduct(key){setProduct(key);document.getElementById('machine').scrollIntoView({behavior:RM?'auto':'smooth'});}};

/* ================= loop ================= */
const vis={earth:!!document.getElementById('earth'),rig:false,hall:false};
const io=new IntersectionObserver(en=>en.forEach(e=>vis[e.target.id]=e.isIntersecting));if(document.getElementById('earth'))io.observe(document.getElementById('earth'));io.observe(rc);io.observe(hc);
function resize(){eResize();mResize();hResize();}
addEventListener('resize',resize); resize();
(function loop(t){if(vis.earth&&earthFrame)earthFrame(t||0);if(vis.rig)machineFrame();if(vis.hall)hallFrame(t||0);requestAnimationFrame(loop);})(0);

