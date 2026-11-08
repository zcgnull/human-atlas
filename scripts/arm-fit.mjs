/** Shared arm-pose fit for the female atlas transplants. The figure's arms
 *  bend outward at the elbow, unlike the nearly straight male stance, so the
 *  male limb chain is fitted to the female skin arm midline in three segments:
 *  the humerus pivots at the placed glenoid and aims at the skin elbow band,
 *  radius+ulna pivot at the male elbow and aim at the skin wrist band, and the
 *  hand pivots at the male wrist and reaches the skin fingertip. Both the
 *  skeletal and the muscular merge apply these identical transforms so placed
 *  bones and the muscles hugging them stay aligned. Pure function of the atlas
 *  data; cached per side. */
const clampOf=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
const boxOf=parts=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of parts)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.bounds[0][k]);hi[k]=Math.max(hi[k],p.bounds[1][k]);}return {lo,hi};};
const glenoidOf=(scapulaBox,side)=>[side>0?scapulaBox.hi[0]:scapulaBox.lo[0],
 (scapulaBox.hi[1]+scapulaBox.lo[1])/2+(scapulaBox.hi[1]-scapulaBox.lo[1])*.1,(scapulaBox.hi[2]+scapulaBox.lo[2])/2];
/** Ordered shoulder->hand centerline: equal-span bands along the principal
 *  axis (oriented downward), centroid per band. Equal span, not equal count —
 *  bone vertices crowd into the hand and would pile bands at the wrist. */
const midline=(pts,n)=>{
 const c=[0,0,0];for(const p of pts){c[0]+=p[0]/pts.length;c[1]+=p[1]/pts.length;c[2]+=p[2]/pts.length;}
 let xx=0,xy=0,yy=0;for(const p of pts){const x=p[0]-c[0],y=p[1]-c[1];xx+=x*x;xy+=x*y;yy+=y*y;}
 const tr=xx+yy,disc=Math.sqrt(Math.max(0,tr*tr-4*(xx*yy-xy*xy)));
 const l1=(tr+disc)/2;
 let vx=xy,vy=l1-xx;const nl=Math.hypot(vx,vy)||1;vx/=nl;vy/=nl;
 if(vy>0){vx=-vx;vy=-vy;}
 const proj=pts.map(p=>(p[0]-c[0])*vx+(p[1]-c[1])*vy);
 const pmin=Math.min(...proj),pmax=Math.max(...proj);
 const bands=[];
 for(let k=0;k<n;k++){
  const lo=pmin+(pmax-pmin)*k/n,hi=k===n-1?Infinity:pmin+(pmax-pmin)*(k+1)/n;
  const sel=pts.filter((_,i)=>proj[i]>=lo&&proj[i]<hi);
  if(!sel.length)throw new Error(`Empty midline band ${k} of ${n}`);
  bands.push([sel.reduce((a,p)=>a+p[0]/sel.length,0),sel.reduce((a,p)=>a+p[1]/sel.length,0),sel.reduce((a,p)=>a+p[2]/sel.length,0)]);
 }
 return bands;
};
const sidePrefix=side=>side>0?'Left ':'Right ';
/** Arm bone names of one side, exactly the set the skeletal merge transplants. */
export const armPartNames=function(male,side){
 const ORD=['first','second','third','fourth','fifth'];
 const l=sidePrefix(side).toLowerCase();
 return [sidePrefix(side)+'humerus',sidePrefix(side)+'radius',sidePrefix(side)+'ulna',
  ...['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate'].map(c=>sidePrefix(side)+c),
  ...ORD.map(o=>`${sidePrefix(side)}${o} metacarpal bone`),
  `Proximal phalanx of ${l}thumb`,`Distal phalanx of ${l}thumb`,
  ...['index finger','middle finger','ring finger','little finger'].flatMap(f=>['Proximal','Middle','Distal'].map(k=>`${k} phalanx of ${l}${f}`))];
};
export function createArmFits({male,maleBins,female,femaleBins,scapulaBounds,clamp=clampOf}){
 // scapulaBounds(side) -> the female scapula parts of that side, already placed
 // (read lazily so callers can place them after creating the fit).
 const skin=female.parts.find(p=>p.name==='skin of body');
 if(!skin)throw new Error('skin of body is required for the arm fit.');
 const skinChunk=femaleBins[skin.chunk];
 const skinPos=new Float32Array(skinChunk.buffer,skinChunk.byteOffset+skin.positions,skin.vertexCount*3);
 const armBoneParts=side=>male.parts.filter(p=>p.system==='skeletal'&&armPartNames(male,side).includes(p.name));
 const transforms={};
 const armTransformFor=side=>{
  if(transforms[side])return transforms[side];
  const armParts=armBoneParts(side);
  const mGlen=glenoidOf(boxOf(male.parts.filter(p=>p.system==='skeletal'&&p.name===sidePrefix(side)+'scapula')),side);
  const fGlen=glenoidOf(boxOf(scapulaBounds(side)),side);
  const centroid=pts=>pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length,a[2]+p[2]/pts.length],[0,0,0]);
  const segPts=keep=>{const pts=[];
   for(const part of armParts)if(keep(part.name)){
    const src=maleBins[part.chunk];
    const pos=new Float32Array(src.buffer,src.byteOffset+part.positions,part.vertexCount*3);
    for(let i=0;i<pos.length;i+=3)pts.push([pos[i],pos[i+1],pos[i+2]]);}
   return pts;};
  const forePts=segPts(n=>/ (radius|ulna)$/i.test(n));
  const mElbow=centroid([...forePts].sort((a,b)=>b[1]-a[1]).slice(0,Math.max(1,Math.floor(forePts.length*.08))));
  const mWrist=centroid(segPts(n=>/^(Left|Right) (scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$/.test(n)));
  const mHandBox=boxOf(armParts.filter(p=>!/humerus| (radius|ulna)$/i.test(p.name)));
  const mTip=[(mHandBox.lo[0]+mHandBox.hi[0])/2,mHandBox.lo[1],(mHandBox.lo[2]+mHandBox.hi[2])/2];
  const skinPts=[];
  for(let i=0;i<skinPos.length;i+=3){const x=skinPos[i],y=skinPos[i+1],z=skinPos[i+2];
   if(side*x>.26&&y>.4&&y<1.42&&z>-.13)skinPts.push([x,y,z]);}
  if(skinPts.length<200)throw new Error(`Arm fit sample too small (${skinPts.length} skin points)`);
  const fLine=midline(skinPts,12);
  const fElbowTgt=fLine[5],fWristTgt=fLine[8];
  // skin fingertip: mean of the 20 lowest sample points (the arm axis points
  // down; band 11 is a band centroid and stops short of the tips)
  const fEnd=centroid([...skinPts].sort((a,b)=>a[1]-b[1]).slice(0,20));
  const dist2d=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
  const aim=(m,v)=>Math.atan2(m[0]*v[1]-m[1]*v[0],m[0]*v[0]+m[1]*v[1]);
  const sUp=clamp(dist2d(fGlen,fElbowTgt)/dist2d(mGlen,mElbow),.85,1.2);
  const sLo=clamp(dist2d(fElbowTgt,fWristTgt)/dist2d(mElbow,mWrist),.75,1.1);
  const upTheta=aim([mElbow[0]-mGlen[0],mElbow[1]-mGlen[1]],[fElbowTgt[0]-fGlen[0],fElbowTgt[1]-fGlen[1]]);
  const upCos=Math.cos(upTheta),upSin=Math.sin(upTheta);
  const fElbow=[fGlen[0]+sUp*((mElbow[0]-mGlen[0])*upCos-(mElbow[1]-mGlen[1])*upSin),
   fGlen[1]+sUp*((mElbow[0]-mGlen[0])*upSin+(mElbow[1]-mGlen[1])*upCos),fGlen[2]+sUp*(mElbow[2]-mGlen[2])];
  const loTheta=aim([mWrist[0]-mElbow[0],mWrist[1]-mElbow[1]],[fWristTgt[0]-fElbow[0],fWristTgt[1]-fElbow[1]]);
  const loCos=Math.cos(loTheta),loSin=Math.sin(loTheta);
  const fWrist=[fElbow[0]+sLo*((mWrist[0]-mElbow[0])*loCos-(mWrist[1]-mElbow[1])*loSin),
   fElbow[1]+sLo*((mWrist[0]-mElbow[0])*loSin+(mWrist[1]-mElbow[1])*loCos),fElbow[2]+sLo*(mWrist[2]-mElbow[2])];
  const sHa=clamp(dist2d(fWrist,fEnd)/dist2d(mWrist,mTip),.6,1);
  const haTheta=aim([mTip[0]-mWrist[0],mTip[1]-mWrist[1]],[fEnd[0]-fWrist[0],fEnd[1]-fWrist[1]]);
  return transforms[side]={
   upper:{mc:mGlen,fc:fGlen,scale:sUp,rotate:true,theta:upTheta},
   forearm:{mc:mElbow,fc:fElbow,scale:sLo,rotate:true,theta:loTheta},
   hand:{mc:mWrist,fc:fWrist,scale:sHa,rotate:true,theta:haTheta},
   log:{side:side>0?'left':'right',upDeg:+(upTheta*180/Math.PI).toFixed(1),loDeg:+(loTheta*180/Math.PI).toFixed(1),haDeg:+(haTheta*180/Math.PI).toFixed(1),
    sUp:+sUp.toFixed(2),sLo:+sLo.toFixed(2),sHa:+sHa.toFixed(2),
    skinElbow:fElbowTgt.map(v=>+v.toFixed(2)),skinWrist:fWristTgt.map(v=>+v.toFixed(2)),skinEnd:fEnd.map(v=>+v.toFixed(2)),
    fElbow:fElbow.map(v=>+v.toFixed(2)),fWrist:fWrist.map(v=>+v.toFixed(2))}};
 };
 return {armTransformFor,armBoneParts};
}
/** Segment transform for a muscle whose overlap arm bones are given: the
 *  segment with the greatest overlap volume carries the muscle. */
export function armSegmentFor(overlappingArmBones){
 let best=null,bestVolume=-1;
 for(const part of overlappingArmBones){
  const segment=/humerus/i.test(part.name)?'upper':/ (radius|ulna)$/i.test(part.name)?'forearm':'hand';
  const s=part.bounds,vol=Math.max(0,s[1][0]-s[0][0])*Math.max(0,s[1][1]-s[0][1])*Math.max(0,s[1][2]-s[0][2]);
  if(vol>bestVolume){bestVolume=vol;best=segment;}
 }
 return best;
}
