import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createExplosionLayout} from '../app/explosion-layout.ts';
import {PointerTap} from '../app/pointer-tap.ts';
import {atlasTools} from '../app/agent-tools.ts';
import {applyVisibility,createInvoker} from '../app/commands.ts';
import {EMBED_PROTOCOL,setupEmbedBridge} from '../app/embed-bridge.ts';
import {localeParityIssues} from '../app/i18n.ts';
import {translateStructureName,translationCoverage} from '../app/i18n-terms.ts';

/** In-memory controller double: records camera calls, holds mutable scene state. */
function harness(initialAtlas){
 let atlas=initialAtlas,sex='male',locale='en',chosen=null,camera=null;
 const cameraCalls=[];
 let state={explode:0,visible:['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'],selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,heartbeat:false};
 const invoker=createInvoker({
  state:()=>state,atlas:()=>atlas,sex:()=>sex,locale:()=>locale,progress:()=>100,error:()=>'',
  patch:update=>{state=update(state);},
  setSex:value=>{sex=value;},
  setLocale:value=>{locale=value;},
  choose:concept=>{chosen=concept;state={...state,selected:concept.elements,isolate:false,rotate:false};},
  resetScene:()=>{state={...state,explode:0,selected:[],isolate:false,hidden:[],view:'three-quarter',rotate:false,reset:state.reset+1,heartbeat:false};},
  camera:()=>camera,
 });
 return {
  invoker,cameraCalls,
  get state(){return state;},get chosen(){return chosen;},get sex(){return sex;},get locale(){return locale;},
  set atlas(value){atlas=value;},get atlas(){return atlas;},
  attachCamera(){camera={zoomBy(factor){cameraCalls.push(['zoomBy',factor]);return 1;},zoomTo(level){cameraCalls.push(['zoomTo',level]);return 1;},focusParts(ids){cameraCalls.push(['focusParts',ids]);return ids.length>0;},screenPoints(ids){return ids.map((id,i)=>({id,x:i*10,y:i*10,behind:false}));},captureImage(scale){cameraCalls.push(['captureImage',scale]);return {dataUrl:'data:image/png;base64,AAAA',width:640*scale,height:360*scale};}};},
 };
}

// Visibility algebra used by visibility_set.
assert.deepEqual(applyVisibility(['a'],'set',['b']),['b']);
assert.deepEqual(applyVisibility(['a'],'add',['a','b']),['a','b']);
assert.deepEqual(applyVisibility(['a','b'],'remove',['a']),['b']);
assert.deepEqual(applyVisibility(['a','b'],'toggle',['b','c']),['a','c']);

// Every locale implements the full message contract (functions and objects alike).
assert.deepEqual(localeParityIssues(),[]);

// Structure-name translation: compositional rules, all-or-nothing fallback, English stays itself.
assert.equal(translateStructureName('zh','Sternocostal Part Of Left Pectoralis Major'),'左胸大肌胸肋部');
assert.equal(translateStructureName('zh','heart'),'心脏');
assert.equal(translateStructureName('zh','internal carotid artery'),'颈内动脉');
assert.equal(translateStructureName('zh','right anterior cerebral artery'),'右大脑前动脉');
assert.equal(translateStructureName('zh','head of pancreas'),'胰头');
assert.equal(translateStructureName('zh','left femur'),'左股骨');
assert.equal(translateStructureName('zh','totally unknown madeup structure'),'totally unknown madeup structure');
assert.equal(translateStructureName('en','heart'),'heart');

// Tool manifest hygiene: unique grouped names, descriptions, object schemas, honest read-only flags.
{
 const sample=harness(null);
 const names=sample.invoker.tools.map(t=>t.name);
 assert.equal(new Set(names).size,names.length);
 for(const tool of sample.invoker.tools){
  assert.match(tool.name,/^[a-z]+(_[a-z0-9]+)+$/,`tool name should be group_action: ${tool.name}`);
  assert.ok(tool.description.length>20,tool.name);
  assert.equal(tool.inputSchema.type,'object');
  assert.equal(typeof tool.readOnly,'boolean');
 }
 assert.equal(sample.invoker.tools.find(t=>t.name==='atlas_find').readOnly,true);
 assert.equal(sample.invoker.tools.find(t=>t.name==='atlas_get_state').readOnly,true);
 assert.equal(sample.invoker.tools.find(t=>t.name==='visibility_set').readOnly,false);
}

// The embed bridge stays inert outside a browser/embed URL, and the shipped SDK speaks the same protocol version and channel.
assert.equal(setupEmbedBridge({invoke:()=>{},snapshot:()=>({})}),null);
assert.equal(EMBED_PROTOCOL.version,1);
assert.equal(EMBED_PROTOCOL.channel,'atlas');
const sdk=await readFile(new URL('../public/embed/human-atlas-sdk.js',import.meta.url),'utf8');
assert.ok(sdk.includes('PROTOCOL_VERSION = 1')&&sdk.includes("CHANNEL = 'atlas'"),'SDK must embed the current protocol constants');
const example=await readFile(new URL('../examples/embed-host.html',import.meta.url),'utf8');
assert.ok(example.includes('HumanAtlas.embedUrl'),'example host must build its embed URL through embedUrl');

for (const file of ['atlas.json','atlas-female.json']) {
  const atlas=JSON.parse(await readFile(new URL(`../public/models/${file}`,import.meta.url)));
  const groups=[atlas.parts,...[...new Set(atlas.parts.map(p=>p.system))].map(system=>atlas.parts.filter(p=>p.system===system))];
  for(const group of groups) for(const aspect of [.46,1,1.7]) {
    const layout=createExplosionLayout(group,aspect),cells=[...layout.cells.values()];
    assert.equal(cells.length,group.length);
    for(let i=0;i<cells.length;i++) {
      const a=cells[i];
      assert.ok(Math.abs(a.x)+a.width/2<=layout.width/2+1e-8);
      assert.ok(Math.abs(a.y)+a.height/2<=layout.height/2+1e-8);
      for(let j=i+1;j<cells.length;j++) {
        const b=cells[j];
        assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2-1e-8 || Math.abs(a.y-b.y)>=(a.height+b.height)/2-1e-8,'Exploded pieces overlap');
      }
    }
  }

  const h=harness(atlas),invoker=h.invoker;
  // Search and inspection contracts.
  const found=invoker.invoke('atlas_find',{query:'femur'});
  assert.ok(found.results.length>0);
  invoker.invoke('atlas_inspect',{id:found.results[0].id});
  assert.equal(h.chosen.id,found.results[0].id);
  assert.ok(h.state.selected.length>0);
  const previous=h.chosen;
  assert.throws(()=>invoker.invoke('atlas_inspect',{id:'nonexistent-structure'}));
  assert.equal(h.chosen,previous);
  assert.throws(()=>invoker.invoke('atlas_find',{query:' '}));
  assert.throws(()=>invoker.invoke('no_such_tool',{}));
  // Focus: frame drives the camera handle, isolate drives scene state.
  assert.throws(()=>invoker.invoke('camera_zoom',{by:2}),'camera commands must fail before the scene registers a handle');
  h.attachCamera();
  const framed=invoker.invoke('atlas_focus',{id:found.results[0].id,mode:'frame'});
  assert.equal(framed.framed,true);
  assert.deepEqual(h.cameraCalls.at(-1),['focusParts',h.chosen.elements]);
  invoker.invoke('atlas_focus',{id:found.results[0].id,mode:'isolate'});
  assert.equal(h.state.isolate,true);
  assert.equal(h.state.explode,0);
  // Visibility operations.
  invoker.invoke('visibility_set',{operation:'set',systems:['skeletal']});
  assert.deepEqual(h.state.visible,['skeletal']);
  invoker.invoke('visibility_set',{operation:'add',systems:['muscular']});
  assert.deepEqual(h.state.visible,['skeletal','muscular']);
  invoker.invoke('visibility_set',{operation:'remove',systems:['skeletal']});
  assert.deepEqual(h.state.visible,['muscular']);
  invoker.invoke('visibility_set',{operation:'toggle',systems:['muscular','cardiac']});
  assert.deepEqual(h.state.visible,['cardiac']);
  assert.throws(()=>invoker.invoke('visibility_set',{operation:'set',systems:['not-a-system']}));
  assert.throws(()=>invoker.invoke('visibility_set',{operation:'set'}));
  // Camera and explode contracts.
  assert.deepEqual(invoker.invoke('camera_zoom',{by:2}),{distance:1});
  assert.deepEqual(invoker.invoke('camera_zoom',{to:.9}),{distance:1});
  assert.throws(()=>invoker.invoke('camera_zoom',{by:2,to:.5}));
  assert.throws(()=>invoker.invoke('camera_zoom',{}));
  assert.throws(()=>invoker.invoke('camera_zoom',{by:99}));
  invoker.invoke('camera_set_view',{view:'back'});
  assert.equal(h.state.view,'back');
  assert.equal(h.state.rotate,false);
  assert.throws(()=>invoker.invoke('camera_set_view',{view:'above'}));
  invoker.invoke('explode_set',{level:.5});
  assert.equal(h.state.explode,.5);
  assert.throws(()=>invoker.invoke('camera_rotate',{on:true}),'rotation must be refused while separated');
  invoker.invoke('explode_set',{level:0});
  invoker.invoke('camera_rotate',{on:true});
  assert.equal(h.state.rotate,true);
  assert.throws(()=>invoker.invoke('camera_rotate',{on:'yes'}));
  // Reset, sex switching, and the snapshot.
  invoker.invoke('atlas_reset');
  assert.equal(h.state.isolate,false);
  assert.equal(h.state.explode,0);
  assert.equal(h.state.rotate,false);
  invoker.invoke('body_set_sex',{sex:'female'});
  assert.equal(h.sex,'female');
  assert.throws(()=>invoker.invoke('body_set_sex',{sex:'child'}));
  // The skin cross-section is a third catalogue choice.
  invoker.invoke('body_set_sex',{sex:'skin'});
  assert.equal(h.sex,'skin');
  invoker.invoke('body_set_sex',{sex:'male'});
  // Locale switching changes the snapshot language, including system names.
  invoker.invoke('ui_set_locale',{locale:'zh'});
  assert.equal(h.locale,'zh');
  assert.throws(()=>invoker.invoke('ui_set_locale',{locale:'fr'}));
  const localized=invoker.invoke('atlas_get_state');
  assert.equal(localized.locale,'zh');
  assert.equal(localized.atlas.systems.find(s=>s.id==='skeletal').name,'骨骼系统');
  const snapshot=invoker.invoke('atlas_get_state');
  // Supply fold-in: proximity collects vessels and nerves around the selection.
  // The female atlas has no limb vessels, so each atlas is probed where vessels exist.
  invoker.invoke('visibility_set',{operation:'set',systems:['skeletal']});
  assert.throws(()=>invoker.invoke('supply_collect',{kinds:['vascular']}),'supply without a selection or id must fail');
  const supplyName=file.includes('female')?'uterus':'femur';
  const supplyConcept=invoker.invoke('atlas_find',{query:supplyName}).results.find(r=>r.name===supplyName)??invoker.invoke('atlas_find',{query:supplyName}).results[0];
  const supply=invoker.invoke('supply_collect',{id:supplyConcept.id});
  assert.ok(supply.added>0,`${file}: supply should collect neighbouring vessels for ${supplyName}`);
  assert.ok(supply.selected>supply.studied);
  const supplySystems=new Set(h.state.selected.slice(supply.studied).map(id=>atlas.parts.find(p=>p.id===id)?.system));
  assert.ok([...supplySystems].every(s=>['arterial','venous','nervous'].includes(s)),'only vessels and nerves may be collected');
  const neuralOnly=invoker.invoke('supply_collect',{id:supplyConcept.id,kinds:['neural']});
  assert.equal(neuralOnly.vascular,0);
  assert.throws(()=>invoker.invoke('supply_collect',{id:supplyConcept.id,kinds:['lymph']}));
  // Per-structure hiding: hide by id, restore one, restore everything.
  invoker.invoke('atlas_reset');
  const hideConcept=invoker.invoke('atlas_find',{query:supplyName}).results.find(r=>r.name===supplyName);
  invoker.invoke('structure_hide',{id:hideConcept.id});
  assert.equal(h.state.hidden.length,hideConcept.pieces,`${file}: hide should record every piece of the concept`);
  assert.deepEqual([...new Set(h.state.hidden)],h.state.hidden,'hidden must stay a set');
  assert.ok(h.state.hidden.every(id=>atlas.parts.some(p=>p.id===id)),'hidden ids must exist in the atlas');
  assert.equal(h.state.selected.length,0,'hiding clears the selection');
  assert.ok(invoker.invoke('atlas_get_state').scene.hidden.length>0,'snapshot carries the hidden list');
  assert.throws(()=>invoker.invoke('structure_hide',{}),'hide without a selection or id must fail');
  assert.throws(()=>invoker.invoke('structure_hide',{id:'no-such-structure'}));
  const restoreOne=invoker.invoke('structure_hide',{id:hideConcept.id,restore:true});
  assert.equal(restoreOne.restored,true);
  const afterOne=h.state.hidden.length;
  invoker.invoke('structure_hide',{restore:true});
  assert.equal(h.state.hidden.length,0);
  assert.ok(afterOne>=0);
  invoker.invoke('atlas_reset');
  // Heartbeat and capture contracts.
  invoker.invoke('sim_set_heartbeat',{on:true});
  assert.equal(h.state.heartbeat,true);
  assert.throws(()=>invoker.invoke('sim_set_heartbeat',{on:'yes'}));
  const image=invoker.invoke('scene_capture_image',{scale:2});
  assert.equal(image.width,1280);
  assert.throws(()=>invoker.invoke('scene_capture_image',{scale:9}));
  invoker.invoke('atlas_reset');
  assert.equal(h.state.heartbeat,false);
  const finalSnapshot=invoker.invoke('atlas_get_state');
  assert.equal(finalSnapshot.version,1);
  assert.ok(finalSnapshot.capabilities.includes('camera'));
  assert.ok(finalSnapshot.capabilities.includes('sim'));
  assert.ok(finalSnapshot.capabilities.includes('supply'));
  assert.equal(finalSnapshot.atlas.parts,atlas.parts.length);
  assert.equal(finalSnapshot.atlas.concepts,atlas.concepts.length);
  assert.equal(finalSnapshot.scene.visible,h.state.visible);
  assert.ok(finalSnapshot.tools.some(t=>t.name==='camera_zoom'));
  assert.ok(finalSnapshot.tools.some(t=>t.name==='supply_collect'));
  assert.ok(finalSnapshot.scene.heartbeat===false);
  // Loading guard: every atlas-dependent tool reports a readable error.
  h.atlas=null;
  assert.throws(()=>invoker.invoke('atlas_find',{query:'heart'}));
  assert.throws(()=>invoker.invoke('atlas_inspect',{id:'heart'}));
  // WebMCP wrapper exposes the same registry with executable handlers.
  const tools=atlasTools(h.invoker);
  assert.equal(tools.length,h.invoker.tools.length);
  assert.ok(tools.every(t=>typeof t.execute==='function'&&typeof t.description==='string'&&typeof t.annotations.readOnlyHint==='boolean'));
  h.atlas=atlas;
  assert.ok(tools.find(t=>t.name==='atlas_find').execute({query:'femur'}).results.length>0);
  const coverage=translationCoverage('zh',[...new Set(atlas.concepts.map(c=>c.name))]);
  assert.ok(coverage.translated/coverage.total>0.3,`${file}: structure translation coverage collapsed to ${(100*coverage.translated/coverage.total).toFixed(1)}%`);
  console.log(`${file}: packing, search, tool contracts, embed protocol, and ${coverage.translated}/${coverage.total} translated structure names passed.`);
}
const tap=new PointerTap();
tap.down(1,10,10,5);assert.equal(tap.up(1,12,11),true);
tap.down(1,10,10,5);tap.move(1,40,10);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,12);tap.down(2,20,20,12);assert.equal(tap.up(2,20,20),false);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,5);tap.cancel(1);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,5);assert.equal(tap.up(1,10,10),true);
assert.equal(createExplosionLayout([]).cells.size,0);
console.log('Tap, drag, multitouch, cancellation, and empty-view checks passed.');
