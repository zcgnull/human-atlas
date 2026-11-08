import type {AtlasInvoker} from './commands.ts';
export interface Tool{name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown}
export function atlasTools(invoker:AtlasInvoker):Tool[]{
 return invoker.tools.map(tool=>({name:tool.name,description:tool.description,inputSchema:tool.inputSchema,annotations:{readOnlyHint:tool.readOnly},execute:input=>invoker.invoke(tool.name,input)}));
}
export function registerAtlasTools(invoker:AtlasInvoker){
 const context=(document as Document&{modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!context?.registerTool)return;const lifecycle=new AbortController();
 for(const tool of atlasTools(invoker)){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability; the visible UI remains available. */}}
 return()=>lifecycle.abort();
}
