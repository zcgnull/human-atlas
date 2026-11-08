import {useEffect,useRef} from 'react';
import {layoutLabels} from './labels';

/** Live atlas-plate labels: an SVG layer over the canvas whose nodes are
 *  written to directly from a requestAnimationFrame loop. Sixty React renders
 *  a second to move text would cost more than the text is worth, so React only
 *  creates the layer; the loop owns its children. */

interface Props {
 active:boolean;
 partIds:string[];
 /** Resolves current screen anchors; null while the scene is unavailable. */
 points:()=>{id:string;x:number;y:number;behind:boolean}[]|null;
 textFor:(id:string)=>string;
}

const SVG='http://www.w3.org/2000/svg';

export default function LabelOverlay({active,partIds,points,textFor}:Props){
 const host=useRef<SVGSVGElement>(null);
 const idsKey=partIds.join(',');
 useEffect(()=>{
  const svg=host.current;
  if(!svg||!active||!idsKey)return;
  const measure=document.createElement('canvas').getContext('2d');
  if(measure)measure.font='11px system-ui,sans-serif';
  const nodes=new Map<string,{line:SVGLineElement;text:SVGTextElement}>();
  const children=[...svg.children] as SVGElement[];
  for(const child of children)svg.removeChild(child);
  const ensure=(id:string)=>{
   let entry=nodes.get(id);
   if(!entry){
    const line=document.createElementNS(SVG,'line');
    line.setAttribute('class','label-line');
    const text=document.createElementNS(SVG,'text');
    text.setAttribute('class','label-text');
    svg.appendChild(line);svg.appendChild(text);
    entry={line,text};nodes.set(id,entry);
   }
   return entry;
  };
  let frame=0,alive=true;
  const draw=()=>{
   if(!alive)return;
   frame=requestAnimationFrame(draw);
   const svgBounds=svg.getBoundingClientRect();
   if(svgBounds.width<2||svgBounds.height<2)return;
   const current=points();
   if(!current)return;
   const anchors=current.map(p=>({id:p.id,text:textFor(p.id),x:p.x,y:p.y,behind:p.behind}));
   const placed=layoutLabels(anchors,{width:svgBounds.width,height:svgBounds.height,measure:measure?text=>measure.measureText(text).width:undefined});
   const present=new Set(placed.map(p=>p.id));
   for(const [id,entry] of nodes)if(!present.has(id)){entry.line.remove();entry.text.remove();nodes.delete(id);}
   for(const label of placed){
    const {line,text}=ensure(label.id);
    line.setAttribute('x1',String(label.x));line.setAttribute('y1',String(label.y));
    line.setAttribute('x2',String(label.labelX));line.setAttribute('y2',String(label.labelY));
    text.textContent=label.text;
    text.setAttribute('x',String(label.side==='left'?label.labelX-6:label.labelX+6));
    text.setAttribute('y',String(label.labelY+4));
    text.setAttribute('text-anchor',label.side==='left'?'end':'start');
   }
  };
  draw();
  return()=>{alive=false;cancelAnimationFrame(frame);nodes.clear();};
 },[active,idsKey,points,textFor]);
 if(!active||!idsKey)return null;
 return <svg className="label-layer" ref={host} aria-hidden="true"/>;
}
