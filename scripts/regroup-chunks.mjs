/** Regroup atlas chunks by anatomical system so the viewer can fetch geometry
 *  per system on demand. Pure data reshuffle: meshes, simplification, and every
 *  part's vertex data are untouched — only the chunk layout is rewritten. Run
 *  compress-models.mjs afterwards to regenerate the .gz sidecars. */
import fs from 'node:fs';
const base=new URL('../public/models/',import.meta.url);
const name=process.argv[2]??'atlas.json';
const path=new URL(name,base),atlas=JSON.parse(fs.readFileSync(path));
const oldFiles=atlas.chunks.map(c=>c.url.split('/').pop());
const prefix=oldFiles[0].split('-')[0];
const sources=atlas.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),base)));
const groups=new Map();
for(const p of atlas.parts){if(!groups.has(p.system))groups.set(p.system,[]);groups.get(p.system).push(p);}
const chunks=[];let blob=[],bytes=0;
const append=view=>{const padding=(4-bytes%4)%4;if(padding){blob.push(Buffer.alloc(padding));bytes+=padding;}const offset=bytes;blob.push(Buffer.from(view.buffer,view.byteOffset,view.byteLength));bytes+=view.byteLength;return offset;};
for(const [system,parts] of groups){
 for(const p of parts){
  const b=sources[p.chunk];
  p.chunk=chunks.length;
  p.positions=append(new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3));
  p.normals=append(new Int16Array(b.buffer,b.byteOffset+p.normals,p.vertexCount*3));
  p.indices=append(new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount));
 }
 const url=`/models/${prefix}-${system}.bin`;
 fs.writeFileSync(new URL(url.split('/').pop(),base),Buffer.concat(blob));
 chunks.push({url,bytes});blob=[];bytes=0;
}
atlas.chunks=chunks;atlas.regrouped={bySystem:true};
fs.writeFileSync(path,JSON.stringify(atlas));
for(const file of oldFiles){fs.rmSync(new URL(file,base),{force:true});fs.rmSync(new URL(file+'.gz',base),{force:true});}
console.log(JSON.stringify({name,systems:chunks.length,bytes:chunks.reduce((n,c)=>n+c.bytes,0),sizes:Object.fromEntries(chunks.map((c,i)=>[groups.keys().toArray()[i],c.bytes]))}));
