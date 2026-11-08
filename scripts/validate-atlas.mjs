import fs from 'node:fs';
import assert from 'node:assert/strict';
const filename=process.argv[2]??'atlas.json',female=filename.includes('female'),skin=filename.includes('skin');
const base=new URL('../public/models/',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL(filename,base)));
if(skin){
 // The skin cross-section is self-contained original artwork: check structural
 // consistency rather than fixed counts.
 assert.equal(atlas.sex,'skin');assert.ok(atlas.parts.length>=15&&atlas.parts.length<50);
 const ids=new Set(atlas.parts.map(p=>p.id));assert.equal(ids.size,atlas.parts.length);
 let tris=0;
 for(const p of atlas.parts){
  assert.ok(p.name.trim());assert.ok(p.system);
  const file=fs.readFileSync(new URL(atlas.chunks[p.chunk].url.split('/').pop(),base));
  assert.ok(p.indices+p.indexCount*4<=file.length);
  const pos=new Float32Array(file.buffer,file.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(file.buffer,file.byteOffset+p.indices,p.indexCount);
  assert.ok(indices.length>=3);for(const i of indices)assert.ok(i<p.vertexCount,`${p.id}: invalid vertex`);
  for(const value of pos)assert.ok(Number.isFinite(value));
  tris+=p.indexCount/3;
 }
 for(const c of atlas.concepts){assert.ok(c.elements.length);for(const id of c.elements)assert.ok(ids.has(id),`${c.id}: missing ${id}`);}
 assert.equal(tris,atlas.triangles);
 console.log(`Verified skin cross-section: ${ids.size} parts, ${atlas.concepts.length} concepts, ${tris.toLocaleString()} triangles, every binary buffer.`);
 process.exit(0);
}
// Supplemental meshes merged in from the male BodyParts3D atlas (scripts/merge-female-*.mjs; --undo removes them).
// The skeletal merge also renames 12 native pelvis parts and adds 2 hip-bone concepts (no new parts).
const merged=(female?(atlas.endocrineMerged?4:0)+(atlas.skeletalMerged?atlas.skeletalMerged.parts.length:0)+(atlas.muscularMerged?atlas.muscularMerged.parts.length:0):0);
const mergedConcepts=(female?(atlas.endocrineMerged?4:0)+(atlas.skeletalMerged?atlas.skeletalMerged.concepts+(atlas.skeletalMerged.nativePelvisRenamed?.concepts||0):0)+(atlas.muscularMerged?atlas.muscularMerged.concepts:0):0);
assert.equal(atlas.parts.length,female?888+merged:2234);assert.equal(atlas.concepts.length,female?1073+mergedConcepts:3432);
const ids=new Set(atlas.parts.map(p=>p.id));assert.equal(ids.size,female?888+merged:2234);
const files=atlas.chunks.map(c=>{const b=fs.readFileSync(new URL(c.url.split('/').pop(),base));assert.equal(b.length,c.bytes);return b;});
if(female){assert.equal(atlas.parts.filter(p=>p.system==='pregnancy').length,8);for(const label of ['uterus','ovary','vagina'])assert.ok(atlas.parts.some(p=>p.name.toLowerCase().includes(label)));assert.ok(!atlas.parts.some(p=>/prostate|testis|penis/i.test(p.name)));}
let tris=0;
for(const p of atlas.parts){assert.ok(p.name.trim()&&p.name!=='-'&&!p.name.includes('Bounds('));assert.ok(p.conceptId!=='-');assert.ok(p.system);const b=files[p.chunk];assert.ok(p.indices+p.indexCount*4<=b.length);const pos=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);assert.ok(indices.length>=3);for(const i of indices)assert.ok(i<p.vertexCount,`${p.id}: invalid vertex`);for(const value of pos)assert.ok(Number.isFinite(value));tris+=p.indexCount/3;}
for(const c of atlas.concepts){assert.ok(c.elements.length);for(const id of c.elements)assert.ok(ids.has(id),`${c.id}: missing ${id}`);}
assert.equal(tris,atlas.triangles);
console.log(`Verified ${ids.size} individually indexed meshes, ${atlas.concepts.length} complete concept mappings, ${tris.toLocaleString()} triangles, and every binary buffer.`);
