/** Atlas-plate label layout: names in side columns, leader lines to the
 *  structures. Text placed on a structure becomes unreadable the moment two
 *  structures are close, which in anatomy is always; a printed plate puts the
 *  names beside the figure and draws a thin line to each one. Pure geometry —
 *  the same layout serves the live overlay and any future export. */

export interface LabelAnchor{
 id:string;
 text:string;
 /** Structure position in layout units (screen pixels for the live overlay). */
 x:number;
 y:number;
 /** True when the structure is behind the camera; such a projection lies. */
 behind?:boolean;
}

export interface PlacedLabel extends LabelAnchor{
 /** Where the leader line meets the text: the column edge facing the figure. */
 labelX:number;
 labelY:number;
 side:'left'|'right';
}

export interface LabelLayoutOptions{
 width:number;
 height:number;
 /** Vertical slot each label occupies; keeps neighbours from colliding. */
 lineHeight?:number;
 /** Smallest distance from the viewport edge. */
 margin?:number;
 /** How far the columns stand off from the anatomy they name. */
 gap?:number;
 /** Text width in layout units; without it the columns ignore text extent. */
 measure?:(text:string)=>number;
}

const DEFAULTS={lineHeight:19,margin:12,gap:56};

/**
 * Two columns that face the figure: left-column labels end at their column
 * edge, right-column labels start at it, so every line stays short and the
 * names stay off the anatomy. The columns stand next to the anchors' own
 * extent — not the window edges, which on a wide screen would produce
 * metre-long lines across empty background — and only fall back to the edges
 * when the subject fills the frame.
 */
export function layoutLabels(anchors:LabelAnchor[],options:LabelLayoutOptions):PlacedLabel[]{
 const {width,height}=options,lineHeight=options.lineHeight??DEFAULTS.lineHeight,margin=options.margin??DEFAULTS.margin,gap=options.gap??DEFAULTS.gap;
 const visible=anchors.filter(a=>!a.behind&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=width&&a.y>=0&&a.y<=height);
 if(visible.length===0)return [];
 const top=margin,bottom=Math.max(height-margin,margin);
 const capacity=Math.max(Math.floor((bottom-top)/lineHeight)+1,0);
 if(capacity===0)return [];
 const leftMost=Math.min(...visible.map(a=>a.x)),rightMost=Math.max(...visible.map(a=>a.x)),midline=(leftMost+rightMost)/2;
 const columns:{left:LabelAnchor[];right:LabelAnchor[]}={left:[],right:[]};
 for(const anchor of visible){
  const side: keyof typeof columns=anchor.x<=midline?'left':'right';
  if(columns[side].length<capacity)columns[side].push(anchor);
 }
 const widthOf=(anchors:LabelAnchor[])=>options.measure?Math.max(0,...anchors.map(a=>options.measure!(a.text))):0;
 const leftBound=Math.min(margin+widthOf(columns.left),width-margin);
 const rightBound=Math.max(width-margin-widthOf(columns.right),margin);
 const leftColumn=Math.min(Math.max(leftMost-gap,leftBound),width-margin);
 const rightColumn=Math.max(Math.min(rightMost+gap,rightBound),margin);
 const place=(side:'left'|'right'):PlacedLabel[]=>{
  const placed=columns[side].map(anchor=>({...anchor,side,labelX:side==='left'?leftColumn:rightColumn,labelY:anchor.y}));
  // Two passes: walk down pushing labels below their neighbours, then back up
  // doing the reverse, so a full column ends packed rather than overflowing.
  placed.sort((a,b)=>a.y-b.y);
  let cursor=top;
  for(const label of placed){label.labelY=Math.max(label.y,cursor);cursor=label.labelY+lineHeight;}
  cursor=bottom;
  for(let i=placed.length-1;i>=0;i--){placed[i].labelY=Math.min(placed[i].labelY,cursor);cursor=placed[i].labelY-lineHeight;}
  return placed;
 };
 return [...place('left'),...place('right')];
}
