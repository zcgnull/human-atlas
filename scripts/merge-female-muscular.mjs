/** Fill the female atlas's missing muscles by transplanting the male
 *  BodyParts3D muscular meshes (minus ones the HRA female already ships: the
 *  twelve extraocular muscles, both rectus femoris muscles and their quadriceps
 *  tendons, and the three papillary muscles), registered per part to the bones
 *  each muscle overlaps in the male atlas:
 *
 *    overlapping arm bones  -> the shared three-segment arm transform of
 *                              scripts/arm-fit.mjs (same as the placed arm
 *                              bones, so muscles hug the placed bones)
 *    any other overlap      -> bbox registration against the same-named female
 *                              counterparts (placed ribs/skull/girdle, native
 *                              vertebrae, femur/tibia/patella), with the male
 *                              hip bone mapped to the native pelvis tissues and
 *                              vertebrae via the same name rules as the
 *                              skeletal merge
 *
 *  Parts with no overlapping landmark even after iterative bbox expansion are
 *  skipped and counted. Backs up atlas-female.json first; `--undo` restores it
 *  and removes the female-muscular-*.bin chunks. Run compress-models.mjs after. */
import fs from 'node:fs';
import {createArmFits,armSegmentFor} from './arm-fit.mjs';
const base=new URL('../public/models/',import.meta.url);
const here=new URL('.',import.meta.url);
const femalePath=new URL('atlas-female.json',base);
const UNDO=process.argv.includes('--undo');
const stale=()=>fs.readdirSync(base).filter(n=>/^female-muscular-\d+\.bin(\.gz)?$/.test(n));
if(UNDO){
 fs.copyFileSync(new URL('atlas-female.pre-muscular.json',here),femalePath);
 for(const n of stale())fs.rmSync(new URL(n,base),{force:true});
 console.log(`Restored atlas-female.json from backup and removed ${stale().length} muscular chunk file(s).`);
 process.exit(0);
}
const male=JSON.parse(fs.readFileSync(new URL('atlas.json',base)));
const female=JSON.parse(fs.readFileSync(femalePath));
if(female.muscularMerged)throw new Error('Muscular merge already applied. Run with --undo first.');
const maleBins=male.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
const femaleBins=female.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
fs.copyFileSync(femalePath,new URL('atlas-female.pre-muscular.json',here));
for(const n of stale())fs.rmSync(new URL(n,base),{force:true});

const box=parts=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of parts)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.bounds[0][k]);hi[k]=Math.max(hi[k],p.bounds[1][k]);}return {lo,hi};};
const boxToArray=parts=>{const b=box(parts);return [b.lo,b.hi];};
const center=({lo,hi})=>hi.map((v,k)=>(v+lo[k])/2);
const maxSize=({lo,hi})=>Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]);
const clamp=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
const vol=b=>Math.max(0,b[1][0]-b[0][0])*Math.max(0,b[1][1]-b[0][1])*Math.max(0,b[1][2]-b[0][2]);
const overlapVolume=(a,b)=>Math.max(0,Math.min(a[1][0],b[1][0])-Math.max(a[0][0],b[0][0]))
 *Math.max(0,Math.min(a[1][1],b[1][1])-Math.max(a[0][1],b[0][1]))
 *Math.max(0,Math.min(a[1][2],b[1][2])-Math.max(a[0][2],b[0][2]));
const ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
const cap=s=>s[0].toUpperCase()+s.slice(1);
const mVert=(region,n)=>region==='atlas'?'Atlas':region==='axis'?'Axis':`${cap(ORD[n-1])} ${region} vertebra`;
const fVert=(region,n)=>region==='atlas'?'vertebral bone 1':region==='axis'?'vertebral bone 2':region==='cervical'?`mammalian cervical vertebra ${n}`:`${region} vertebra ${n}`;
const sidePrefix=side=>side>0?'Left ':'Right ';
const VERT_RE=/^(Atlas|Axis|(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth) (cervical|thoracic|lumbar) vertebra)$/;

/** Male skeletal part name -> female counterpart names (placed or native). */
const femaleCounterparts=(name,side=0)=>{
 if(VERT_RE.test(name)){
  const region=name==='Atlas'?'atlas':name==='Axis'?'axis':name.split(' ')[1];
  const n=name==='Atlas'||name==='Axis'?1:ORD.indexOf(name.split(' ')[0].toLowerCase())+1;
  return [fVert(region,n)];
 }
 if(name==='Sacrum')return ['fused sacrum'];
 if(name==='Left hip bone'||name==='Right hip bone'){
  const l=name.startsWith('Left')?'L':'R';
  return ['ilium','ischium','pubis'].flatMap(bone=>['compact','spongy'].map(t=>`VH_F_${bone}_${t}_bone_${l}`));
 }
 return [name];
};
const femaleByName=new Map();
for(const p of female.parts){
 if(!femaleByName.has(p.name))femaleByName.set(p.name,[]);
 femaleByName.get(p.name).push(p);
}
const femaleLandmark=name=>femaleByName.get(name)??[];
const maleSkeletal=male.parts.filter(p=>p.system==='skeletal');
// Skip parts the HRA female already ships (extraocular muscles, rectus femoris,
// quadriceps tendons, papillary muscles).
const existing=new Set(female.parts.filter(p=>p.system==='muscular').map(p=>p.name.toLowerCase()));
// Superficial thoracic and abdominal wall muscles are omitted on the female
// figure: their male geometry (BodyParts3D has no female muscles) conflicts
// with the native breast structures and the female torso silhouette. Deep,
// bone-hugging muscles (intercostals, transversus thoracis, subclavius,
// diaphragm) are kept. The male set has no rectus abdominis or internal
// oblique; its external oblique is the only abdominal-wall muscle and is
// omitted as well.
const TRUNK_WALL_SKIP=/pectoralis|serratus anterior|external oblique/i;
const armFit=createArmFits({male,maleBins,female,femaleBins,
 scapulaBounds:side=>femaleLandmark(sidePrefix(side)+'scapula')});
const ARM_BONE_RE=/humerus| (radius|ulna)$/i;

const segments=[];let bytes=0;const chunkRecords=[];
const append=view=>{const pad=(4-bytes%4)%4;if(pad){segments.push(Buffer.alloc(pad));bytes+=pad;}const offset=bytes;segments.push(Buffer.from(view.buffer,view.byteOffset,view.byteLength));bytes+=view.byteLength;return offset;};
const flush=()=>{if(!bytes)return;
 fs.writeFileSync(new URL(`female-muscular-${chunkRecords.length}.bin`,base),Buffer.concat(segments));
 chunkRecords.push({url:`/models/female-muscular-${chunkRecords.length}.bin`,bytes});segments.length=0;bytes=0;};
const placed=[],newConcepts=[],skipped=[],byRule={arm:0,landmark:0};
const partIds=new Set(female.parts.map(p=>p.id)),conceptIds=new Set(female.concepts.map(c=>c.id));

for(const muscle of male.parts.filter(p=>p.system==='muscular')){
 if(existing.has(muscle.name.toLowerCase())||TRUNK_WALL_SKIP.test(muscle.name))continue;
 // which male bones does this muscle overlap? (expand the muscle box until it
 // touches something, at most ~6 cm, so thin muscles find their attachments)
 let hits=[],expand=0;
 const grown=()=>[[muscle.bounds[0][0]-expand,muscle.bounds[0][1]-expand,muscle.bounds[0][2]-expand],
  [muscle.bounds[1][0]+expand,muscle.bounds[1][1]+expand,muscle.bounds[1][2]+expand]];
 while(expand<=.06){
  const mb=grown();
  hits=maleSkeletal.filter(s=>overlapVolume(mb,s.bounds)>0.15*Math.min(vol(mb),vol(s.bounds)));
  if(hits.length)break;
  expand+=.015;
 }
 if(!hits.length){
  // thin deep muscles (interspinales, rhomboid minor...) may not intersect
  // any bone box: fall back to the nearest male bone within 8 cm
  const mb=grown();
  let best=null,bestGap=Infinity;
  for(const s of maleSkeletal){
   const gap=Math.hypot(...[0,1,2].map(k=>Math.max(mb[0][k]-s.bounds[1][k],s.bounds[0][k]-mb[1][k],0)));
   if(gap<bestGap){bestGap=gap;best=s;}
  }
  if(best&&bestGap<.08)hits=[best];
 }
 // the anal sphincter has no bony overlap at all; the female coccyx is its anchor
 const forcedLandmark=/anal sphincter/i.test(muscle.name)?femaleLandmark('coccyx'):null;
 if(!hits.length&&!forcedLandmark){skipped.push(muscle.name);continue;}
 const armBones=hits.filter(s=>ARM_BONE_RE.test(s.name)||/metacarpal|phalanx/i.test(s.name));
 let t;
 if(armBones.length&&overlapVolume(muscle.bounds,boxToArray(armBones))>overlapVolume(muscle.bounds,boxToArray(hits.filter(s=>!armBones.includes(s))))*0.5){
  const segment=armSegmentFor(armBones);
  const a=armFit.armTransformFor(armBones[0].name.startsWith('Left')?1:-1)[segment];
  t={mc:a.mc,fc:a.fc,scale:a.scale,rotate:true,theta:a.theta};
  byRule.arm++;
 }else{
  const landmarkNames=forcedLandmark&&forcedLandmark.length?null:[...new Set(hits.flatMap(s=>femaleCounterparts(s.name)))];
  const fParts=forcedLandmark&&forcedLandmark.length?forcedLandmark:landmarkNames.flatMap(n=>femaleLandmark(n));
  if(!fParts.length){skipped.push(muscle.name);continue;}
  const mBox=forcedLandmark&&forcedLandmark.length?box([muscle]):box(hits);
  const fBox=box(fParts);
  t={mc:center(mBox),fc:center(fBox),scale:clamp(maxSize(fBox)/maxSize(mBox),.8,1.3)};
  byRule.landmark++;
 }
 const src=maleBins[muscle.chunk];
 const positions=new Float32Array(src.buffer,src.byteOffset+muscle.positions,muscle.vertexCount*3);
 const normals=new Int16Array(src.buffer,src.byteOffset+muscle.normals,muscle.vertexCount*3);
 const indices=new Uint32Array(src.buffer,src.byteOffset+muscle.indices,muscle.indexCount);
 const cos=Math.cos(t.theta||0),sin=Math.sin(t.theta||0);
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
 if(partIds.has(muscle.id))throw new Error(`Part id collision: ${muscle.id}`);
 partIds.add(muscle.id);
 placed.push({id:muscle.id,name:muscle.name,conceptId:muscle.conceptId,system:'muscular',chunk:chunkIndex,
  positions:append(moved),normals:append(outNormals),indices:append(new Uint32Array(indices)),
  vertexCount:muscle.vertexCount,indexCount:muscle.indexCount,bounds:[lo,hi]});
 const concept=male.concepts.find(c=>c.id===muscle.conceptId);
 if(concept&&!conceptIds.has(concept.id)&&concept.elements.length<=4){newConcepts.push({id:concept.id,name:concept.name,elements:[muscle.id]});conceptIds.add(concept.id);}
}
flush();
female.chunks.push(...chunkRecords);
female.parts.push(...placed);
female.concepts.push(...newConcepts);
female.triangles+=placed.reduce((n,p)=>n+p.indexCount/3,0);
female.muscularMerged={source:'BodyParts3D 4.0 (male reference)',
 method:'per-part registration to overlapping bones (arm segments via scripts/arm-fit.mjs)',
 parts:placed.map(p=>p.id),concepts:newConcepts.length,
 skipped:skipped.map(n=>n),rules:byRule};
fs.writeFileSync(femalePath,JSON.stringify(female));

// ---- placement diagnostics: muscle-bone alignment sanity ----
const report={parts:placed.length,concepts:newConcepts.length,skipped:skipped.length,
 rules:byRule,triangles:placed.reduce((n,p)=>n+p.indexCount/3,0),chunkBytes:chunkRecords.map(c=>c.bytes)};
const byName=id=>female.parts.find(p=>p.id===id);
const biceps=placed.find(p=>/biceps brachii/i.test(p.name)&&p.name.startsWith('Left'));
const humerus=femaleByName.get('Left humerus')?.[0];
if(biceps&&humerus)report.leftBicepsVsHumerus={bicepsCenter:((biceps.bounds[0][0]+biceps.bounds[1][0])/2).toFixed(2)+'/'+((biceps.bounds[0][1]+biceps.bounds[1][1])/2).toFixed(2),
 humerusCenter:((humerus.bounds[0][0]+humerus.bounds[1][0])/2).toFixed(2)+'/'+((humerus.bounds[0][1]+humerus.bounds[1][1])/2).toFixed(2)};
const gastro=placed.find(p=>/gastrocnemius/i.test(p.name)&&p.name.startsWith('Left'));
const tibia=femaleByName.get('Left tibia')?.[0];
if(gastro&&tibia)report.leftGastrocnemiusVsTibia={gastroY:[+gastro.bounds[0][1].toFixed(2),+gastro.bounds[1][1].toFixed(2)],tibiaY:[+tibia.bounds[0][1].toFixed(2),+tibia.bounds[1][1].toFixed(2)]};
const pec=placed.find(p=>/pectoralis major/i.test(p.name)&&p.name.startsWith('Left'));
if(pec)report.leftPectoralisBbox=pec.bounds.map(b=>b.map(v=>+v.toFixed(2)));
if(skipped.length)report.skippedNames=skipped;
console.log(JSON.stringify(report,null,1));
console.log(`Merged ${placed.length} muscular parts into ${chunkRecords.length} chunk(s). Backup: scripts/atlas-female.pre-muscular.json. Undo: node scripts/merge-female-muscular.mjs --undo`);
