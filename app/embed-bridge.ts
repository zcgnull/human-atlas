/** postMessage bridge for host systems embedding the viewer as an iframe.
 *
 *  Enabled only when the page URL carries ?embed=1. Commands arrive from the
 *  parent window as {v, channel:'atlas', type:'request', id, tool, args} and
 *  are executed through the shared command invoker (the same path the visible
 *  UI and WebMCP tools use). Responses and state events are posted back.
 *  Hosts must list their origin in ?allowOrigin=... to be accepted. */

export const EMBED_PROTOCOL={version:1,channel:'atlas'} as const;

export interface EmbedBridgeOptions {
 invoke:(tool:string,args:unknown)=>unknown;
 snapshot:()=>unknown;
}

export interface EmbedBridge {
 emitReady(snapshot:unknown):void;
 emitState(snapshot:unknown):void;
 dispose():void;
}

interface ProtocolMessage {
 v?:unknown;
 channel?:unknown;
 type?:unknown;
 id?:unknown;
 tool?:unknown;
 args?:unknown;
}

export function setupEmbedBridge(options:EmbedBridgeOptions):EmbedBridge|null{
 if(typeof window==='undefined'||typeof location==='undefined')return null;
 const params=new URLSearchParams(location.search);
 if(params.get('embed')!=='1')return null;
 if(!window.parent||window.parent===window)return null;
 const allowed=(params.get('allowOrigin')??'').split(',').map(s=>s.trim()).filter(Boolean);
 const wildcard=allowed.includes('*');
 const sameOriginOnly=allowed.length===0;
 const allowedSet=new Set(allowed);
 const accepts=(origin:string)=>wildcard||allowedSet.has(origin)||(sameOriginOnly&&origin===location.origin);
 const emitOrigin=wildcard?'*':allowed[0]??location.origin;
 const post=(message:Record<string,unknown>,targetOrigin=emitOrigin)=>{try{window.parent.postMessage({...message,v:EMBED_PROTOCOL.version,channel:EMBED_PROTOCOL.channel},targetOrigin);}catch{/* The host frame went away; nothing to deliver. */}};
 let stateTimer:ReturnType<typeof setTimeout>|undefined,pendingState:unknown=null;
 const onMessage=(event:MessageEvent)=>{
  if(!event.source||event.source!==window.parent)return;
  if(!accepts(event.origin))return;
  const message=event.data as ProtocolMessage;
  if(!message||typeof message!=='object'||message.v!==EMBED_PROTOCOL.version||message.channel!==EMBED_PROTOCOL.channel)return;
  if(message.type!=='request'||message.id===undefined)return;
  let response:Record<string,unknown>;
  try{
   const result=options.invoke(typeof message.tool==='string'?message.tool:'',message.args??{});
   response={type:'response',id:message.id,ok:true,result};
  }catch(error){
   response={type:'response',id:message.id,ok:false,error:error instanceof Error?error.message:String(error)};
  }
  post(response,event.origin);
 };
 window.addEventListener('message',onMessage);
 return {
  emitReady(snapshot){post({type:'event',event:'ready',payload:snapshot});},
  emitState(snapshot){
   pendingState=snapshot;
   clearTimeout(stateTimer);
   stateTimer=setTimeout(()=>{const payload=pendingState;pendingState=null;post({type:'event',event:'state',payload});},120);
  },
  dispose(){clearTimeout(stateTimer);window.removeEventListener('message',onMessage);},
 };
}
