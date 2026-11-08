/** Fill the female atlas's missing endocrine system by transplanting the four
 *  male BodyParts3D endocrine meshes (pineal body, pituitary gland, both
 *  adrenal glands), registered against female anatomical landmarks rather than
 *  pasted at male coordinates:
 *
 *    adrenal glands  -> the kidney of the same side (matched by x sign)
 *    pituitary/pineal -> the brain region (union of brain-named nervous parts)
 *
 *  Each part keeps its shape and is uniformly scaled by the landmark size ratio
 *  (clamped) and translated so its offset from the landmark matches the male
 *  anatomy. Plain translation+scale, no warping; both datasets are CC BY 4.0.
 *
 *  Backs up atlas-female.json before writing. `--undo` restores the backup and
 *  removes the transplanted chunk. Run compress-models.mjs afterwards. */
import fs from 'node:fs';
const base=new URL('../public/models/',import.meta.url);
const here=new URL('.',import.meta.url);
const femalePath=new URL('atlas-female.json',base);
const UNDO=process.argv.includes('--undo');
if(UNDO){
 fs.copyFileSync(new URL('atlas-female.pre-endocrine.json',here),femalePath);
 fs.rmSync(new URL('female-endocrine.bin',base),{force:true});
 fs.rmSync(new URL('female-endocrine.bin.gz',base),{force:true});
 console.log('Restored atlas-female.json from backup and removed female-endocrine.bin(.gz).');
 process.exit(0);
}
const male=JSON.parse(fs.readFileSync(new URL('atlas.json',base)));
const female=JSON.parse(fs.readFileSync(femalePath));
const maleBins=male.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
const box=parts=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of parts)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.bounds[0][k]);hi[k]=Math.max(hi[k],p.bounds[1][k]);}return {lo,hi};};
const center=({lo,hi})=>hi.map((v,k)=>(v+lo[k])/2);
const maxSize=({lo,hi})=>Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]);
const clamp=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
const byName=(a,name)=>a.parts.filter(p=>p.name.toLowerCase()===name);
const brainParts=a=>a.parts.filter(p=>p.system==='nervous'&&/brain|forebrain|cerebell|midbrain/i.test(p.name));
const kidneyBySide=(a,positiveX)=>{const caps=byName(a,'kidney capsule');const fallback=a.parts.filter(p=>/kidney/i.test(p.name));const pool=caps.length===2?caps:fallback.filter(p=>/capsule|cortex/i.test(p.name));const sides=pool.map(p=>({p,x:(p.bounds[0][0]+p.bounds[1][0])/2})).sort((u,v)=>u.x-v.x);return (positiveX?sides[1]:sides[0]).p;};
const wanted=['FJ3129','FJ3130','FJ1796','FJ1795'];
const partsToMerge=male.parts.filter(p=>wanted.includes(p.id));
if(partsToMerge.length!==4)throw new Error(`Expected 4 male endocrine parts, found ${partsToMerge.length}: ${partsToMerge.map(p=>p.id).join(', ')}`);
const landmarkFor=part=>{
 if(part.id==='FJ3129')return {male:byName(male,'left kidney'),female:[kidneyBySide(female,true)]};
 if(part.id==='FJ3130')return {male:byName(male,'right kidney'),female:[kidneyBySide(female,false)]};
 if(part.id==='FJ1795'||part.id==='FJ1796')return {male:brainParts(male),female:brainParts(female)};
 throw new Error(`No landmark for ${part.id}`);
};
const blob=[];let bytes=0;
const append=view=>{const pad=(4-bytes%4)%4;if(pad){blob.push(Buffer.alloc(pad));bytes+=pad;}const offset=bytes;blob.push(Buffer.from(view.buffer,view.byteOffset,view.byteLength));bytes+=view.byteLength;return offset;};
const newParts=[],newConcepts=[];
const chunkIndex=female.chunks.length;
for(const part of partsToMerge){
 const src=maleBins[part.chunk];
 const positions=new Float32Array(src.buffer,src.byteOffset+part.positions,part.vertexCount*3);
 const normals=new Int16Array(src.buffer,src.byteOffset+part.normals,part.vertexCount*3);
 const indices=new Uint32Array(src.buffer,src.byteOffset+part.indices,part.indexCount);
 const pair=landmarkFor(part);
 const mBox=box(pair.male),fBox=box(pair.female);
 const mCenter=center(mBox),fCenter=center(fBox);
 const ratio=clamp(maxSize(fBox)/maxSize(mBox),.85,1.25);
 const origin=center(box([part]));
 const moved=new Float32Array(positions.length);
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i+=3){
  for(let k=0;k<3;k++){
   const value=fCenter[k]+(positions[i+k]-mCenter[k])*ratio;
   moved[i+k]=value;
   const axis=k===0?0:k===1?1:2;
   lo[axis]=Math.min(lo[axis],value);hi[axis]=Math.max(hi[axis],value);
  }
 }
 newParts.push({id:part.id,name:part.name,conceptId:part.conceptId,system:'endocrine',chunk:chunkIndex,positions:append(moved),normals:append(new Int16Array(normals)),indices:append(new Uint32Array(indices)),vertexCount:part.vertexCount,indexCount:part.indexCount,bounds:[lo,hi]});
 const concept=male.concepts.find(c=>c.id===part.conceptId)||male.concepts.find(c=>c.elements.includes(part.id));
 if(concept&&!newConcepts.some(c=>c.id===concept.id)&&concept.elements.length<=4)newConcepts.push({id:concept.id,name:concept.name,elements:[part.id]});
 console.log(JSON.stringify({part:part.name,organCenter:origin.map(v=>+v.toFixed(3)),placed:center({lo,hi}).map(v=>+v.toFixed(3)),landmark:{male:mCenter.map(v=>+v.toFixed(3)),female:fCenter.map(v=>+v.toFixed(3))},ratio:+ratio.toFixed(3)}));
}
fs.writeFileSync(new URL('female-endocrine.bin',base),Buffer.concat(blob));
fs.copyFileSync(femalePath,new URL('./atlas-female.pre-endocrine.json',here));
female.chunks.push({url:'/models/female-endocrine.bin',bytes});
female.parts.push(...newParts);
female.concepts.push(...newConcepts);
female.triangles+=newParts.reduce((n,p)=>n+p.indexCount/3,0);
female.endocrineMerged={source:'BodyParts3D 4.0 (male reference)',method:'landmark registration (kidneys, brain)',parts:newParts.map(p=>p.id)};
fs.writeFileSync(femalePath,JSON.stringify(female));
console.log(`Merged ${newParts.length} endocrine parts (${bytes} bytes) into chunk ${chunkIndex}. Backup: scripts/atlas-female.pre-endocrine.json. Undo: node scripts/merge-female-endocrine.mjs --undo`);
