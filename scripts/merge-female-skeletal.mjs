/** Fill the female atlas's missing skeleton by transplanting male BodyParts3D
 *  bones in anatomical groups, each registered to landmarks the female model
 *  already has (or to structures placed earlier in the same run):
 *
 *    skull + mandible + teeth + alar cartilages -> brain envelope
 *    larynx cartilages + hyoid                  -> cervical vertebrae 3-5
 *    rib N / costal cartilage N                 -> thoracic vertebra N (per level)
 *    sternum (manubrium/body/xiphoid)           -> thoracic vertebrae 2-8
 *    clavicles + scapulae                       -> thoracic vertebrae 1-2
 *    upper limbs                                -> three-segment joint fit (shoulder,
 *                                                  elbow, wrist pivots) onto the
 *                                                  female skin arm midline
 *    feet                                       -> tibia + fibula of the same side
 *    intervertebral disks                       -> the two adjacent vertebrae
 *
 *  The HRA set already contains the pelvis — as compact/trabecular tissue parts
 *  under generic names (VH_F_ilium_compact_bone_R etc.) — so no hip bones are
 *  transplanted; instead those native parts are renamed properly ("compact
 *  bone of right ilium") and grouped into Left/Right hip bone concepts.
 *
 *  Misclassified soft tissue in the male skeletal system (fibularis/tibialis,
 *  levator scapulae, subscapularis, iliotibial tract, gingiva) is NOT copied.
 *  Parts keep their shape: translation + clamped uniform scale, plus a single
 *  shoulder rotation for the arms. Both datasets are CC BY 4.0.
 *
 *  Backs up atlas-female.json first; `--undo` restores it and removes the
 *  female-skeletal-*.bin chunks. Run compress-models.mjs afterwards. */
import fs from 'node:fs';
import {createArmFits} from './arm-fit.mjs';
const base=new URL('../public/models/',import.meta.url);
const here=new URL('.',import.meta.url);
const femalePath=new URL('atlas-female.json',base);
const UNDO=process.argv.includes('--undo');
const stale=()=>fs.readdirSync(base).filter(n=>/^female-skeletal-\d+\.bin(\.gz)?$/.test(n));
if(UNDO){
 fs.copyFileSync(new URL('atlas-female.pre-skeletal.json',here),femalePath);
 for(const n of stale())fs.rmSync(new URL(n,base),{force:true});
 console.log(`Restored atlas-female.json from backup and removed ${stale().length} skeletal chunk file(s).`);
 process.exit(0);
}
const male=JSON.parse(fs.readFileSync(new URL('atlas.json',base)));
const female=JSON.parse(fs.readFileSync(femalePath));
if(female.skeletalMerged)throw new Error('Skeletal merge already applied. Run with --undo first.');
const maleBins=male.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
const femaleBins=female.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
fs.copyFileSync(femalePath,new URL('atlas-female.pre-skeletal.json',here));
for(const n of stale())fs.rmSync(new URL(n,base),{force:true});

const box=parts=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of parts)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.bounds[0][k]);hi[k]=Math.max(hi[k],p.bounds[1][k]);}return {lo,hi};};
const center=({lo,hi})=>hi.map((v,k)=>(v+lo[k])/2);
const maxSize=({lo,hi})=>Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]);
const clamp=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
const one=(atlas,name)=>{const hits=atlas.parts.filter(p=>p.name===name);if(hits.length!==1)throw new Error(`Expected exactly 1 part named ${JSON.stringify(name)} in ${atlas===male?'male':'female'}, found ${hits.length}`);return hits[0];};
const brainParts=a=>a.parts.filter(p=>p.system==='nervous'&&/brain|forebrain|cerebell|midbrain/i.test(p.name));
const ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
const cap=s=>s[0].toUpperCase()+s.slice(1);
const mVert=(region,n)=>region==='atlas'?'Atlas':region==='axis'?'Axis':`${cap(ORD[n-1])} ${region} vertebra`;
const fVert=(region,n)=>region==='atlas'?'vertebral bone 1':region==='axis'?'vertebral bone 2':region==='cervical'?`mammalian cervical vertebra ${n}`:`${region} vertebra ${n}`;
const sidePrefix=side=>side>0?'Left ':'Right ';

// ---- transplant plan: {name, m:[male landmark parts], f:[female landmark parts], group} ----
const jobs=[];
const pushGroup=(names,maleLm,femaleLm,group)=>{for(const name of names)jobs.push({name,m:maleLm,f:femaleLm,group});};
const lm=(atlas,names)=>names.flatMap(n=>atlas.parts.filter(p=>p.name===n));

const teeth=male.parts.filter(p=>p.system==='skeletal'&&/ tooth$/.test(p.name)).map(p=>p.name);
pushGroup(['Frontal bone','Left parietal bone','Right parietal bone','Left temporal bone','Right temporal bone',
 'Occipital bone','Sphenoid bone','Ethmoid','Vomer','Left maxilla','Right maxilla','Left zygomatic bone','Right zygomatic bone',
 'Left nasal bone','Right nasal bone','Left palatine bone','Right palatine bone','Mandible',
 'Left major alar cartilage','Right major alar cartilage',...teeth],
 brainParts(male),brainParts(female),'skull');

pushGroup(['Hyoid bone','Thyroid cartilage','Cricoid cartilage','Left arytenoid cartilage','Right arytenoid cartilage',
 'Left corniculate cartilage','Right corniculate cartilage','Left cuneiform cartilage','Right cuneiform cartilage'],
 lm(male,[3,4,5].map(n=>mVert('cervical',n))),lm(female,[3,4,5].map(n=>fVert('cervical',n))),'larynx');

for(let n=1;n<=12;n++)for(const side of [1,-1]){
 const names=[`${sidePrefix(side)}${ORD[n-1]} rib`];
 if(n<=7)names.push(`${sidePrefix(side)}${ORD[n-1]} costal cartilage`);
 pushGroup(names,lm(male,[mVert('thoracic',n)]),lm(female,[fVert('thoracic',n)]),'cage');
}
pushGroup(['Manubrium','Body of sternum','Xiphoid process'],
 lm(male,[2,3,4,5,6,7,8].map(n=>mVert('thoracic',n))),lm(female,[2,3,4,5,6,7,8].map(n=>fVert('thoracic',n))),'sternum');
pushGroup(['Left clavicle','Right clavicle','Left scapula','Right scapula'],
 lm(male,[mVert('thoracic',1),mVert('thoracic',2)]),lm(female,[fVert('thoracic',1),fVert('thoracic',2)]),'girdle');

const phalanxNames=side=>{const l=sidePrefix(side).toLowerCase();
 return [`Proximal phalanx of ${l}thumb`,`Distal phalanx of ${l}thumb`,
  ...['index finger','middle finger','ring finger','little finger'].flatMap(f=>['Proximal','Middle','Distal'].map(k=>`${k} phalanx of ${l}${f}`))];};
const toePhalanxNames=side=>{const l=sidePrefix(side).toLowerCase();
 return [`Proximal phalanx of ${l}big toe`,`Distal phalanx of ${l}big toe`,
  ...['second toe','third toe','fourth toe','little toe'].flatMap(t=>['Proximal','Middle','Distal'].map(k=>`${k} phalanx of ${l}${t}`))];};
for(const side of [1,-1]){
 const arm=[sidePrefix(side)+'humerus',sidePrefix(side)+'radius',sidePrefix(side)+'ulna',
  ...['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate'].map(c=>sidePrefix(side)+c),
  ...[1,2,3,4,5].map(n=>`${sidePrefix(side)}${ORD[n-1]} metacarpal bone`),...phalanxNames(side)];
 for(const name of arm){
  const segment=/humerus/i.test(name)?'upper':/ (radius|ulna)$/i.test(name)?'forearm':'hand';
  jobs.push({name,m:[],f:[],group:'arm',side,segment});
 }
 const foot=[sidePrefix(side)+'talus',sidePrefix(side)+'calcaneus',`Navicular bone of ${sidePrefix(side).toLowerCase()}foot`,
  `${sidePrefix(side)}cuboid bone`,`${sidePrefix(side)}medial cuneiform bone`,`${sidePrefix(side)}intermediate cuneiform bone`,
  `${sidePrefix(side)}lateral cuneiform bone`,
  ...[1,2,3,4,5].map(n=>`${sidePrefix(side)}${ORD[n-1]} metatarsal bone`),`Sesamoid bone of ${sidePrefix(side).toLowerCase()}foot`,
  ...toePhalanxNames(side)];
 pushGroup(foot,lm(male,[sidePrefix(side)+'tibia',sidePrefix(side)+'fibula']),lm(female,[sidePrefix(side)+'tibia',sidePrefix(side)+'fibula']),'foot');
}
// Intervertebral disks: "disk of N" sits between vertebra N and N+1.
const diskSpecs=[{name:'Intervertebral disk of axis',m:[mVert('axis',2),mVert('cervical',3)],f:[fVert('axis',2),fVert('cervical',3)]}];
for(let n=3;n<=7;n++)diskSpecs.push({name:`Intervertebral disk of ${ORD[n-1]} cervical vertebra`,
 m:[mVert('cervical',n),n<7?mVert('cervical',n+1):mVert('thoracic',1)],f:[fVert('cervical',n),n<7?fVert('cervical',n+1):fVert('thoracic',1)]});
for(let n=1;n<=11;n++)diskSpecs.push({name:`Intervertebral disk of ${ORD[n-1]} thoracic vertebra`, // T12's disk is the plain "Intervertebral disk" (T12-L1)
 m:[mVert('thoracic',n),mVert('thoracic',n+1)],f:[fVert('thoracic',n),fVert('thoracic',n+1)]});
for(let n=1;n<=5;n++)diskSpecs.push({name:`Intervertebral disk of ${ORD[n-1]} lumbar vertebra`,
 m:[mVert('lumbar',n),n<5?mVert('lumbar',n+1):'Sacrum'],f:[fVert('lumbar',n),n<5?fVert('lumbar',n+1):fVert('lumbar',6)]});
diskSpecs.push({name:'Intervertebral disk',m:[mVert('thoracic',12),mVert('lumbar',1)],f:[fVert('thoracic',12),fVert('lumbar',1)]});
for(const d of diskSpecs)pushGroup([d.name],lm(male,d.m),lm(female,d.f),'disk');
const seen=new Set();
for(const job of jobs){if(seen.has(job.name))throw new Error(`Duplicate job ${job.name}`);seen.add(job.name);
 if(!male.parts.some(p=>p.system==='skeletal'&&p.name===job.name))throw new Error(`No male part named ${JSON.stringify(job.name)}`);
 if(job.group!=='arm'&&(!job.m.length||!job.f.length))throw new Error(`Empty landmark for ${job.name}`);}

// ---- native pelvis: rename the generic tissue parts and group them per side ----
// The HRA ids carry the real structure (VH_F_ilium_compact_bone_R); the shipped
// part names ("compact bone tissue") make the pelvis unsearchable and its six
// labels identical. The hip bone is the fused ilium+ischium+pubis, so each side
// also gets one grouping concept for search and selection.
const sideWord={L:'Left ',R:'Right '};
const hipElements={L:[],R:[]};
for(const p of female.parts){
 const m=p.id.match(/^VH_F_(ilium|ischium|pubis)_(compact|spongy)_bone_([LR])$/);
 if(!m)continue;
 p.name=`${m[2]==='compact'?'compact':'trabecular'} bone of ${sideWord[m[3]].toLowerCase()}${m[1]}`;
 hipElements[m[3]].push(p.id);
}
if(hipElements.L.length!==6||hipElements.R.length!==6)throw new Error(`Expected 6 native pelvis parts per side, got L=${hipElements.L.length} R=${hipElements.R.length}`);
const nativePelvisConcepts=[
 {id:'HRA:left-hip-bone',name:'Left hip bone',elements:hipElements.L},
 {id:'HRA:right-hip-bone',name:'Right hip bone',elements:hipElements.R}];
/** Male parts for a name; BodyParts3D occasionally ships exact duplicate meshes
 *  (hyoid, cricoid) which are collapsed, while genuinely paired structures
 *  (the two big-toe sesamoids) have distinct geometry and are all kept. */
const resolveSrc=name=>{
 const parts=male.parts.filter(p=>p.system==='skeletal'&&p.name===name);
 const distinct=[];
 for(const p of parts)if(!distinct.some(q=>q.bounds.flat().every((v,k)=>Math.abs(v-p.bounds.flat()[k])<1e-3)))distinct.push(p);
 return distinct;};

// ---- arm pose: shared three-segment fit (see scripts/arm-fit.mjs) ----
// The placed scapulae only exist after placement, so the fit reads them
// lazily through scapulaBounds(side); the transform is a pure function of
// atlas data.
const armFit=createArmFits({male,maleBins,female,femaleBins,
 scapulaBounds:side=>placed.filter(p=>p.name===sidePrefix(side)+'scapula')});
const armTransformFor=side=>armFit.armTransformFor(side);

// ---- geometry plumbing ----
const segments=[];let bytes=0;const chunkRecords=[];
const append=view=>{const pad=(4-bytes%4)%4;if(pad){segments.push(Buffer.alloc(pad));bytes+=pad;}const offset=bytes;segments.push(Buffer.from(view.buffer,view.byteOffset,view.byteLength));bytes+=view.byteLength;return offset;};
const flush=()=>{if(!bytes)return;const index=female.chunks.length+chunkRecords.length;
 fs.writeFileSync(new URL(`female-skeletal-${chunkRecords.length}.bin`,base),Buffer.concat(segments));
 chunkRecords.push({url:`/models/female-skeletal-${chunkRecords.length}.bin`,bytes});segments.length=0;bytes=0;return index;};
const placed=[];const newConcepts=[];
const partIds=new Set(female.parts.map(p=>p.id)),conceptIds=new Set(female.concepts.map(c=>c.id));
const similar=job=>{const mb=box(job.m),fb=box(job.f);
 return {mc:center(mb),fc:center(fb),scale:clamp(maxSize(fb)/maxSize(mb),.85,1.25)};};
for(const job of jobs){
 let t;
 if(job.group==='arm'){
  const a=armTransformFor(job.side)[job.segment];
  t={mc:a.mc,fc:a.fc,scale:a.scale,rotate:true,theta:a.theta};
 }else{
  t=similar(job);
  if(job.group==='skull'){ // the female figure is ~6 cm shorter: keep the skull under the scalp
   const scalp=female.parts.find(p=>p.name==='skin of body');
   const cap=scalp.bounds[1][1]-.008;
   const top=Math.max(...resolveSrc(job.name).map(p=>t.fc[1]+(p.bounds[1][1]-t.mc[1])*t.scale));
   if(top>cap)t.fc[1]-=top-cap;
  }
 }
 const cos=Math.cos(t.theta||0),sin=Math.sin(t.theta||0);
 for(const part of resolveSrc(job.name)){
  const src=maleBins[part.chunk];
  const positions=new Float32Array(src.buffer,src.byteOffset+part.positions,part.vertexCount*3);
  const normals=new Int16Array(src.buffer,src.byteOffset+part.normals,part.vertexCount*3);
  const indices=new Uint32Array(src.buffer,src.byteOffset+part.indices,part.indexCount);
  const moved=new Float32Array(positions.length);
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i+=3){
   let dx=(positions[i]-t.mc[0])*t.scale,dy=(positions[i+1]-t.mc[1])*t.scale,dz=(positions[i+2]-t.mc[2])*t.scale;
   if(t.rotate){const rx=dx*cos-dy*sin;dy=dx*sin+dy*cos;dx=rx;}
   const vx=t.fc[0]+dx,vy=t.fc[1]+dy,vz=t.fc[2]+dz;
   moved[i]=vx;moved[i+1]=vy;moved[i+2]=vz;
   lo[0]=Math.min(lo[0],vx);hi[0]=Math.max(hi[0],vx);
   lo[1]=Math.min(lo[1],vy);hi[1]=Math.max(hi[1],vy);
   lo[2]=Math.min(lo[2],vz);hi[2]=Math.max(hi[2],vz);
  }
  let outNormals=normals;
  if(t.rotate){
   outNormals=new Int16Array(normals.length);
   for(let i=0;i<normals.length;i+=3){
    const nx=normals[i]/32767,ny=normals[i+1]/32767,nz=normals[i+2]/32767;
    const rx=nx*cos-ny*sin,ry=nx*sin+ny*cos,length=Math.hypot(rx,ry,nz)||1;
    outNormals[i]=Math.round(rx/length*32767);outNormals[i+1]=Math.round(ry/length*32767);outNormals[i+2]=Math.round(nz/length*32767);
   }
  }
  if(bytes>4_000_000)flush();
  const chunkIndex=female.chunks.length+chunkRecords.length;
  if(partIds.has(part.id))throw new Error(`Part id collision: ${part.id}`);
  partIds.add(part.id);
  placed.push({id:part.id,name:part.name,conceptId:part.conceptId,system:'skeletal',chunk:chunkIndex,
   positions:append(moved),normals:append(outNormals),indices:append(new Uint32Array(indices)),
   vertexCount:part.vertexCount,indexCount:part.indexCount,bounds:[lo,hi]});
  const concept=male.concepts.find(c=>c.id===part.conceptId);
  if(concept&&!conceptIds.has(concept.id)&&concept.elements.length<=4){newConcepts.push({id:concept.id,name:concept.name,elements:[part.id]});conceptIds.add(concept.id);}
 }
}
flush();
female.chunks.push(...chunkRecords);
female.parts.push(...placed);
female.concepts.push(...newConcepts,...nativePelvisConcepts);
female.triangles+=placed.reduce((n,p)=>n+p.indexCount/3,0);
const groupCounts={};for(const j of jobs)groupCounts[j.group]=(groupCounts[j.group]||0)+1;
female.skeletalMerged={source:'BodyParts3D 4.0 (male reference)',
 method:'grouped landmark registration (vertebrae, sacrum, brain, tibiae, skin arm axis)',
 parts:placed.map(p=>p.id),concepts:newConcepts.length,
 nativePelvisRenamed:{parts:hipElements.L.length+hipElements.R.length,concepts:nativePelvisConcepts.length},groups:groupCounts};
fs.writeFileSync(femalePath,JSON.stringify(female));

// ---- placement diagnostics ----
const placedByName=Object.fromEntries(placed.map(p=>[p.name,p]));
const report={parts:placed.length,concepts:newConcepts.length,teeth:teeth.length,
 chunks:chunkRecords.map(c=>c.bytes),triangles:placed.reduce((n,p)=>n+p.indexCount/3,0)};
const orbit=placedByName['Frontal bone'].bounds;
const eyeBox=box(female.parts.filter(p=>p.system==='sensory'));
report.orbitVsEyes={frontalY:[+orbit[0][1].toFixed(2),+orbit[1][1].toFixed(2)],femaleEyesY:[+eyeBox.lo[1].toFixed(2),+eyeBox.hi[1].toFixed(2)]};
const femur=one(female,'Left femur'),ilium=female.parts.find(p=>p.id==='VH_F_ilium_compact_bone_L');
report.pelvisVsFemurHead={femurHead:[+(femur.bounds[0][0]+femur.bounds[1][0]).toFixed(2)/2,+femur.bounds[1][1].toFixed(2),+(femur.bounds[0][2]+femur.bounds[1][2]).toFixed(2)/2],
 nativeIlium:[+ilium.bounds[1][0].toFixed(2),+ilium.bounds[0][1].toFixed(2),+((ilium.bounds[0][2]+ilium.bounds[1][2])/2).toFixed(2)],renamed:hipElements.L.length+hipElements.R.length};
report.arm=[armTransformFor(1).log,armTransformFor(-1).log];
report.hand=box(placed.filter(p=>/^(Proximal|Middle|Distal) phalanx of left|metacarpal bone$/.test(p.name)&&p.name.startsWith('Left'))).lo.map(v=>+v.toFixed(2));
report.leftFootVsTibia={talusY:placedByName['Left talus'].bounds.map(b=>+b[1].toFixed(2)),femaleTibiaY:one(female,'Left tibia').bounds.map(b=>+b[1].toFixed(2))};
report.sternumVsSkin={manubriumZ:placedByName['Manubrium'].bounds.map(b=>+b[2].toFixed(2))};
console.log(JSON.stringify(report,null,1));
console.log(`Merged ${placed.length} skeletal parts into ${chunkRecords.length} chunk(s). Backup: scripts/atlas-female.pre-skeletal.json. Undo: node scripts/merge-female-skeletal.mjs --undo`);
