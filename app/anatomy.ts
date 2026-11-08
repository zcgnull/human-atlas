export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac'|'pregnancy';
/** The catalogue choice: the two body atlases plus the original skin
 *  cross-section (a schematic, not a sexed body). */
export type AnatomySex='male'|'female'|'skin';
/** Display names and descriptions live in app/i18n.ts, keyed by system id. */
export const SYSTEMS: {id:SystemId;color:string}[] = [
 {id:'skeletal',color:'#e2d9ba'},
 {id:'muscular',color:'#a85b50'},
 {id:'cardiac',color:'#b96760'},
 {id:'sensory',color:'#b0c8ce'},
 {id:'arterial',color:'#c05245'},
 {id:'venous',color:'#527c9f'},
 {id:'nervous',color:'#d8b565'},
 {id:'respiratory',color:'#b98991'},
 {id:'digestive',color:'#b8916b'},
 {id:'urinary',color:'#b47961'},
 {id:'lymphatic',color:'#879f7c'},
 {id:'endocrine',color:'#c5a09a'},
 {id:'reproductive',color:'#bda098'},
 {id:'integumentary',color:'#ba9b7d'},
 {id:'pregnancy',color:'#b88380'},
 {id:'connective',color:'#aec3bb'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:AnatomySex;source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;hidden?:string[];view:View;rotate:boolean;reset:number;heartbeat:boolean}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
