/** Reclassify the eighteen soft-tissue parts that BodyParts3D's coarse concept
 *  hierarchy left inside the male skeletal display system:
 *
 *    14 muscle bellies (fibularis longus/brevis/tertius, tibialis anterior and
 *                       posterior, subscapularis, levator scapulae per side)
 *                          -> muscular
 *    iliotibial tract (the lateral thigh's thickened fascia) -> connective
 *    gingiva of upper/lower jaw -> digestive
 *
 *  Ligaments, intervertebral disks, and costal cartilages deliberately stay in
 *  skeletal: they belong to the skeletal/joint complex. The original system of
 *  every touched part is recorded in the manifest marker so `--undo` restores
 *  it. Idempotent: running twice changes nothing further. */
import fs from 'node:fs';
const base=new URL('../public/models/',import.meta.url);
const path=new URL('atlas.json',base);
const atlas=JSON.parse(fs.readFileSync(path));
const MOVES={
 muscular:[['FJ1409','Right fibularis brevis'],['FJ1409M','Left fibularis brevis'],
  ['FJ1410','Right fibularis longus'],['FJ1410M','Left fibularis longus'],
  ['FJ1411','Right fibularis tertius'],['FJ1411M','Left fibularis tertius'],
  ['FJ1439','Right tibialis anterior'],['FJ1439M','Left tibialis anterior'],
  ['FJ1440','Right tibialis posterior'],['FJ1440M','Left tibialis posterior'],
  ['FJ1504','Right subscapularis'],['FJ1504M','Left subscapularis'],
  ['FJ1532','Right levator scapulae'],['FJ1532M','Left levator scapulae']],
 connective:[['FJ1423','Right iliotibial tract'],['FJ1423M','Left iliotibial tract']],
 digestive:[['FJ1252','Gingiva of upper jaw'],['FJ1253','Gingiva of lower jaw']],
};
const UNDO=process.argv.includes('--undo');
if(UNDO){
 const marker=atlas.softTissueReclassified;
 if(!marker)throw new Error('No soft-tissue reclassification marker to undo.');
 for(const [id,original] of Object.entries(marker.original)){
  const part=atlas.parts.find(p=>p.id===id);
  if(part)part.system=original;
 }
 delete atlas.softTissueReclassified;
 fs.writeFileSync(path,JSON.stringify(atlas));
 console.log(`Restored ${Object.keys(marker.original).length} part(s) to their original systems.`);
 process.exit(0);
}
if(atlas.softTissueReclassified){
 console.log('Already reclassified; nothing to do. Use --undo to revert.');
 process.exit(0);
}
const original={},counts={};
for(const [system,ids] of Object.entries(MOVES)){
 for(const [id,name] of ids){
  const part=atlas.parts.find(p=>p.id===id);
  if(!part||part.name!==name)throw new Error(`Expected part ${id} (${name}), found ${part?part.name:'nothing'}`);
  if(part.system===system)continue;
  original[id]=part.system;
  counts[part.system]=(counts[part.system]||0)+1;
  part.system=system;
 }
}
if(!Object.keys(original).length)throw new Error('No parts changed; expected 18.');
atlas.softTissueReclassified={reason:'BodyParts3D coarse hierarchy: muscles, fascia, and gingiva left the skeletal display system',
 original,movedAt:new Date().toISOString().slice(0,10)};
fs.writeFileSync(path,JSON.stringify(atlas));
const by={};for(const p of atlas.parts)by[p.system]=(by[p.system]||0)+1;
console.log(`Reclassified ${Object.keys(original).length} parts (${JSON.stringify(counts)} -> their new systems).`);
console.log('System totals:',JSON.stringify(by));
console.log('Undo: node scripts/reclassify-male-soft-tissue.mjs --undo');
