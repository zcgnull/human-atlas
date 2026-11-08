import {SYSTEMS,type AnatomySex,type Atlas,type Concept,type SceneState,type SystemId,type View} from './anatomy.ts';
import {LOCALES,getMessages,type Locale} from './i18n.ts';

/** Imperative camera operations implemented by the 3D scene. Zoom and framing
 *  are animated per frame, so they live outside the declarative scene state. */
export interface SceneCamera {
 zoomBy(factor:number):number;
 zoomTo(level:number):number;
 focusParts(partIds:string[]):boolean;
 /** Current screen positions of the given part ids, for label anchors. */
 screenPoints(partIds:string[]):{id:string;x:number;y:number;behind:boolean}[];
 /** Render the 3D view (without panel insets) and return a PNG data URL. */
 captureImage(scale?:number):{dataUrl:string;width:number;height:number}|null;
}

export interface ToolDefinition {
 name:string;
 description:string;
 inputSchema:object;
 readOnly:boolean;
}

export const ATLAS_CAPABILITIES=['atlas','scene','camera','ui','sim','supply'];

export interface AtlasSnapshot {
 version:1;
 capabilities:string[];
 locale:Locale;
 sex:AnatomySex;
 progress:number;
 error:string|null;
 atlas:null|{sex:AnatomySex|undefined;parts:number;concepts:number;triangles:number;systems:{id:SystemId;name:string;count:number}[]};
 scene:SceneState;
 tools:ToolDefinition[];
}

export interface ControllerDeps {
 state():SceneState;
 atlas():Atlas|null;
 sex():AnatomySex;
 locale():Locale;
 progress():number;
 error():string;
 patch(update:(state:SceneState)=>SceneState):void;
 setSex(sex:AnatomySex):void;
 setLocale(locale:Locale):void;
 choose(concept:Concept):void;
 resetScene():void;
 camera():SceneCamera|null;
}

export interface AtlasInvoker {
 invoke(tool:string,args?:unknown):unknown;
 snapshot():AtlasSnapshot;
 tools:ToolDefinition[];
}

const VIEWS:View[]=['three-quarter','front','back','side'];
const OPERATIONS=['set','add','remove','toggle'] as const;
type VisibilityOperation=typeof OPERATIONS[number];

function record(input:unknown):Record<string,unknown>{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object.');
 return input as Record<string,unknown>;
}
function str(value:unknown,message:string):string{
 if(typeof value!=='string'||!value.trim())throw new Error(message);
 return value.trim();
}
function num(value:unknown,message:string):number{
 if(typeof value!=='number'||!Number.isFinite(value))throw new Error(message);
 return value;
}
function oneOf<T extends string>(value:unknown,values:readonly T[],message:string):T{
 if(typeof value!=='string'||!values.includes(value as T))throw new Error(message);
 return value as T;
}
function systemIds(value:unknown):SystemId[]{
 const known=new Set(SYSTEMS.map(s=>s.id));
 if(!Array.isArray(value)||value.length<1)throw new Error('A nonempty systems array is required.');
 return value.map(v=>{
  if(typeof v!=='string'||!known.has(v as SystemId))throw new Error(`Unknown system '${String(v)}'. Known systems: ${[...known].join(', ')}.`);
  return v as SystemId;
 });
}

export function applyVisibility(current:SystemId[],operation:VisibilityOperation,systems:SystemId[]):SystemId[]{
 switch(operation){
  case 'set':return [...systems];
  case 'add':return [...current,...systems.filter(s=>!current.includes(s))];
  case 'remove':return current.filter(s=>!systems.includes(s));
  case 'toggle':return [...current.filter(s=>!systems.includes(s)),...systems.filter(s=>!current.includes(s))];
 }
}

function resolveConcept(atlas:Atlas,id:string):Concept|null{
 const direct=atlas.concepts.find(c=>c.id===id);
 if(direct)return direct;
 const part=atlas.parts.find(p=>p.id===id);
 return part?{id:part.conceptId,name:part.name,elements:[part.id]}:null;
}

/** Supply fold-in: the atlas is organised by system, but anatomy is studied by
 *  territory — isolating a structure leaves its vessels behind in other layers.
 *  A structure joins the study set when its bounds meet the set's envelope,
 *  expanded by 4% of the set's largest dimension (proportional, so it means the
 *  same thing at every scale). A bounding box is not a shape: a vessel that
 *  merely passes nearby is collected too, which costs one removal — a vessel
 *  that serves the organ and is missed costs a structure the student never
 *  learns was there. Proximity is the honest rule only because the atlas
 *  segments vessels anatomically, not as one continuous mesh. */

const SUPPLY_KINDS=['vascular','neural'] as const;
type SupplyKind=typeof SUPPLY_KINDS[number];
const SUPPLY_SYSTEM_FOR_KIND:Partial<Record<SystemId,SupplyKind>>={arterial:'vascular',venous:'vascular',nervous:'neural'};

export function collectSupply(atlas:Atlas,studyIds:string[],kinds:ReadonlyArray<SupplyKind>):{added:string[];vascular:number;neural:number}{
 const wanted=new Set(kinds);
 const boundsById=new Map(atlas.parts.map(p=>[p.id,p.bounds]));
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 let measured=false;
 for(const id of studyIds){
  const b=boundsById.get(id);
  if(!b)continue;
  measured=true;
  for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],b[0][k]);hi[k]=Math.max(hi[k],b[1][k]);}
 }
 if(!measured)return {added:[],vascular:0,neural:0};
 const margin=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])*.04;
 for(let k=0;k<3;k++){lo[k]-=margin;hi[k]+=margin;}
 const already=new Set(studyIds),added:string[]=[];
 let vascular=0,neural=0;
 for(const part of atlas.parts){
  const kind=SUPPLY_SYSTEM_FOR_KIND[part.system];
  if(!kind||!wanted.has(kind)||already.has(part.id))continue;
  const b=part.bounds;
  const reaches=b[0][0]<=hi[0]&&b[1][0]>=lo[0]&&b[0][1]<=hi[1]&&b[1][1]>=lo[1]&&b[0][2]<=hi[2]&&b[1][2]>=lo[2];
  if(reaches){added.push(part.id);if(kind==='vascular')vascular++;else neural++;}
 }
 return {added,vascular,neural};
}

const TOOL_DEFINITIONS:ToolDefinition[]=[
 {name:'atlas_find',readOnly:true,
  description:'Find anatomical structures by name or source atlas identifier. Returns matching concepts with their identifiers, which other tools accept.',
  inputSchema:{type:'object',properties:{query:{type:'string',minLength:1}},required:['query'],additionalProperties:false}},
 {name:'atlas_get_state',readOnly:true,
  description:'Read the complete viewer snapshot: current sex, scene state (visible systems, selection, isolation, explode level, view), atlas counts, and the available tool manifest with capabilities.',
  inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'atlas_inspect',readOnly:false,
  description:'Select an anatomical structure by concept or part identifier and open its detail panel. Use atlas_find first to resolve a name.',
  inputSchema:{type:'object',properties:{id:{type:'string',minLength:1}},required:['id'],additionalProperties:false}},
 {name:'atlas_focus',readOnly:false,
  description:'Focus the camera on a structure. mode "frame" keeps surrounding anatomy visible and moves the camera; mode "isolate" hides everything else and frames the structure beside its detail panel.',
  inputSchema:{type:'object',properties:{id:{type:'string',minLength:1},mode:{type:'string',enum:['frame','isolate'],default:'frame'}},required:['id'],additionalProperties:false}},
 {name:'atlas_reset',readOnly:false,
  description:'Reset the viewer: reassemble anatomy, restore default layers for the current sex, clear selection, and return to the default view.',
  inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'visibility_set',readOnly:false,
  description:'Control which anatomical systems are shown. operation "set" replaces the visible layers, "add" and "remove" change them, "toggle" flips each listed system.',
  inputSchema:{type:'object',properties:{operation:{type:'string',enum:['set','add','remove','toggle']},systems:{type:'array',items:{type:'string'},minItems:1}},required:['operation','systems'],additionalProperties:false}},
 {name:'structure_hide',readOnly:false,
  description:'Hide or restore individual structures inside the visible systems. Without arguments it hides the currently selected structure (the way the "Hide from model" button does). Pass id to hide one structure, restore:true with id to bring one back, or restore:true alone to bring every hidden structure back. Layer changes and atlas_reset also restore hidden structures.',
  inputSchema:{type:'object',properties:{id:{type:'string',minLength:1},restore:{type:'boolean'}},additionalProperties:false}},
 {name:'camera_zoom',readOnly:false,
  description:'Zoom the camera. Provide "by" (a factor above 1 zooms in, below 1 zooms out) or "to" (a level from 0, whole body, to 1, close detail), not both.',
  inputSchema:{type:'object',properties:{by:{type:'number',exclusiveMinimum:0},to:{type:'number',minimum:0,maximum:1}},additionalProperties:false}},
 {name:'camera_set_view',readOnly:false,
  description:'Turn the body to a standard view: three-quarter, front, side, or back.',
  inputSchema:{type:'object',properties:{view:{type:'string',enum:['three-quarter','front','side','back']}},required:['view'],additionalProperties:false}},
 {name:'camera_rotate',readOnly:false,
  description:'Start or stop the slow auto-rotation of the body. Rotation pauses automatically while anatomy is separated.',
  inputSchema:{type:'object',properties:{on:{type:'boolean'}},required:['on'],additionalProperties:false}},
 {name:'explode_set',readOnly:false,
  description:'Set how far the anatomy is separated, from 0 (assembled) to 1 (every visible piece spaced out in a grid).',
  inputSchema:{type:'object',properties:{level:{type:'number',minimum:0,maximum:1}},required:['level'],additionalProperties:false}},
 {name:'body_set_sex',readOnly:false,
  description:'Switch the anatomy catalogue: the male BodyParts3D body, the female Human Reference Atlas body, or the original schematic skin cross-section. The catalogue reloads; other scene state resets.',
  inputSchema:{type:'object',properties:{sex:{type:'string',enum:['male','female','skin']}},required:['sex'],additionalProperties:false}},
 {name:'ui_set_locale',readOnly:false,
  description:'Switch the viewer interface language (for example "en" or "zh"). Anatomy structure names stay in the source dataset language.',
  inputSchema:{type:'object',properties:{locale:{type:'string',enum:LOCALES.map(l=>l.id)}},required:['locale'],additionalProperties:false}},
 {name:'supply_collect',readOnly:false,
  description:'Fold the blood vessels and nerves that reach the studied structure into the selection. Proximity-based (bounding boxes with a 4% margin), so a vessel that merely passes nearby may be included.',
  inputSchema:{type:'object',properties:{id:{type:'string',minLength:1},kinds:{type:'array',items:{type:'string',enum:['vascular','neural']}}},additionalProperties:false}},
 {name:'sim_set_heartbeat',readOnly:false,
  description:'Start or stop the illustrative heartbeat: a pulse of light leaves the heart with each beat, travels out through the arteries, and the veins carry a slow glow back. Not a simulation of flow.',
  inputSchema:{type:'object',properties:{on:{type:'boolean'}},required:['on'],additionalProperties:false}},
 {name:'scene_capture_image',readOnly:false,
  description:'Capture the current 3D view as a PNG data URL, at 1x-3x resolution, without the interface panels. Useful for verifying what a command actually changed.',
  inputSchema:{type:'object',properties:{scale:{type:'number',minimum:1,maximum:3}},additionalProperties:false}},
];

export function createInvoker(deps:ControllerDeps):AtlasInvoker{
 const requireAtlas=()=>{const atlas=deps.atlas();if(!atlas)throw new Error('The anatomy catalogue is still loading. Try atlas_get_state to check progress.');return atlas;};
 const requireCamera=()=>{const camera=deps.camera();if(!camera)throw new Error('The 3D scene is not ready yet.');return camera;};
 const snapshot=():AtlasSnapshot=>{
  const atlas=deps.atlas(),locale=deps.locale(),names=getMessages(locale).systemNames;
  return {
   version:1,
   capabilities:ATLAS_CAPABILITIES,
   locale,
   sex:deps.sex(),
   progress:deps.progress(),
   error:deps.error()||null,
   atlas:atlas?{
    sex:atlas.sex,
    parts:atlas.parts.length,
    concepts:atlas.concepts.length,
    triangles:atlas.triangles,
    systems:SYSTEMS.map(s=>({id:s.id,name:names[s.id],count:atlas.parts.filter(p=>p.system===s.id).length})).filter(s=>s.count>0),
   }:null,
   scene:deps.state(),
   tools:TOOL_DEFINITIONS,
  };
 };
 const resolve=(id:string)=>{const concept=resolveConcept(requireAtlas(),id);if(!concept)throw new Error(`'${id}' is not present in this atlas. Use atlas_find to list matching structures.`);return concept;};
 const handlers:Record<string,(input:unknown)=>unknown>={
  atlas_find(input){
   const query=str(record(input).query,'A nonempty query is required.');
   const q=query.toLowerCase();
   const results=requireAtlas().concepts.filter(c=>c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q)).slice(0,30).map(c=>({id:c.id,name:c.name,pieces:c.elements.length}));
   return {query,results};
  },
  atlas_get_state(){return snapshot();},
  atlas_inspect(input){
   const concept=resolve(str(record(input).id,'An atlas identifier is required.'));
   deps.choose(concept);
   return {id:concept.id,name:concept.name,selectedPieces:concept.elements.length};
  },
  atlas_focus(input){
   const data=record(input);
   const concept=resolve(str(data.id,'An atlas identifier is required.'));
   const mode=data.mode===undefined?'frame':oneOf(data.mode,['frame','isolate'],'mode must be "frame" or "isolate".');
   deps.choose(concept);
   if(mode==='isolate')deps.patch(s=>({...s,isolate:true,explode:0}));
   const framed=mode==='frame'?requireCamera().focusParts(concept.elements):true;
   return {id:concept.id,name:concept.name,mode,selectedPieces:concept.elements.length,framed};
  },
  atlas_reset(){deps.resetScene();return {reset:true};},
  visibility_set(input){
   const data=record(input);
   const operation=oneOf(data.operation,OPERATIONS,'operation must be one of set, add, remove, toggle.');
   const systems=systemIds(data.systems);
   const next=applyVisibility(deps.state().visible,operation,systems);
   deps.patch(s=>({...s,visible:next,selected:[],isolate:false}));
   const present=new Set((deps.atlas()?.parts??[]).map(p=>p.system));
   const absent=systems.filter(s=>!present.has(s));
   return {visible:next,absentSystems:absent};
  },
  structure_hide(input){
   const data=record(input);
   const restore=data.restore===undefined?false:Boolean(data.restore);
   if(data.id===undefined){
    if(!restore)throw new Error('Select a structure first, or pass id, or pass restore:true to bring hidden structures back.');
    deps.patch(s=>({...s,hidden:[]}));
    return {hidden:[],restored:'all'};
   }
   const concept=resolve(str(data.id,'An atlas identifier is required.'));
   const state=deps.state();
   const hidden=new Set(state.hidden??[]);
   if(restore){
    for(const id of concept.elements)hidden.delete(id);
    deps.patch(s=>({...s,hidden:[...hidden]}));
   }else{
    for(const id of concept.elements)hidden.add(id);
    deps.patch(s=>({...s,hidden:[...hidden],selected:[],isolate:false}));
   }
   return {id:concept.id,name:concept.name,pieces:concept.elements.length,hidden:[...hidden],restored:restore};
  },
  camera_zoom(input){
   const data=record(input);
   const hasBy='by'in data,hasTo='to'in data;
   if(hasBy===hasTo)throw new Error('Provide exactly one of "by" (positive zoom factor) or "to" (level from 0 to 1).');
   if(hasBy){
    const by=num(data.by,'"by" must be a number.');
    if(!(by>0.1&&by<=10))throw new Error('"by" must be between 0.1 and 10.');
    return {distance:requireCamera().zoomBy(by)};
   }
   const to=num(data.to,'"to" must be a number.');
   if(!(to>=0&&to<=1))throw new Error('"to" must be between 0 and 1.');
   return {distance:requireCamera().zoomTo(to)};
  },
  camera_set_view(input){
   const view=oneOf(record(input).view,VIEWS,'view must be three-quarter, front, side, or back.');
   deps.patch(s=>({...s,view,reset:s.reset+1,rotate:false}));
   return {view};
  },
  camera_rotate(input){
   const on=record(input).on;
   if(typeof on!=='boolean')throw new Error('"on" must be true or false.');
   if(on&&deps.state().explode>=.4)throw new Error('Auto rotation is unavailable while the anatomy is separated. Use explode_set to reassemble first.');
   deps.patch(s=>({...s,rotate:on}));
   return {rotate:on};
  },
  explode_set(input){
   const level=num(record(input).level,'"level" must be a number between 0 and 1.');
   if(!(level>=0&&level<=1))throw new Error('"level" must be between 0 and 1.');
   deps.patch(s=>({...s,explode:level,view:level>0.8?'front':s.view,rotate:false}));
   return {explode:level};
  },
  body_set_sex(input){
   const sex=oneOf(record(input).sex,['male','female','skin'],'sex must be "male", "female", or "skin".');
   deps.setSex(sex);
   return {sex};
  },
  ui_set_locale(input){
   const ids=LOCALES.map(l=>l.id);
   const locale=oneOf(record(input).locale,ids,`locale must be one of: ${ids.join(', ')}.`);
   deps.setLocale(locale);
   return {locale};
  },
  supply_collect(input){
   const data=record(input);
   const kinds=data.kinds===undefined?[...SUPPLY_KINDS]:(()=>{const value=data.kinds;if(!Array.isArray(value)||value.length<1)throw new Error('"kinds" must be a nonempty array of "vascular" and/or "neural".');return value.map(v=>oneOf(v,SUPPLY_KINDS,'"kinds" may only contain "vascular" and "neural".'));})();
   const atlas=requireAtlas();
   let studyIds=deps.state().selected;
   if(typeof data.id==='string'&&data.id.trim()){
    studyIds=resolve(data.id).elements;
   }
   if(studyIds.length<1)throw new Error('Nothing is selected. Pass an id or select a structure first.');
   const {added,vascular,neural}=collectSupply(atlas,studyIds,kinds);
   if(added.length>0)deps.patch(s=>({...s,selected:[...s.selected,...added]}));
   return {studied:studyIds.length,added:added.length,vascular,neural,selected:studyIds.length+added.length};
  },
  sim_set_heartbeat(input){
   const on=record(input).on;
   if(typeof on!=='boolean')throw new Error('"on" must be true or false.');
   deps.patch(s=>({...s,heartbeat:on}));
   return {heartbeat:on};
  },
  scene_capture_image(input){
   const data=record(input);
   const scale=data.scale===undefined?2:num(data.scale,'"scale" must be a number.');
   if(!(scale>=1&&scale<=3))throw new Error('"scale" must be between 1 and 3.');
   const image=requireCamera().captureImage(scale);
   if(!image)throw new Error('The view could not be captured.');
   return {dataUrl:image.dataUrl,width:image.width,height:image.height};
  },
 };
 return {
  tools:TOOL_DEFINITIONS,
  snapshot,
  invoke(tool,args){
   const handler=handlers[tool];
   if(!handler)throw new Error(`Unknown tool '${tool}'. Available tools: ${TOOL_DEFINITIONS.map(t=>t.name).join(', ')}.`);
   return handler(args??{});
  },
 };
}
