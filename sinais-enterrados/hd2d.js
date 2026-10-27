/* Full-room artwork and adult-sized actors, with stable feet and scaled combat bounds. */
(()=>{'use strict';
const data=window.HD2D_ATLAS,images={},status={loaded:[],failed:[]},rooms=['redacao','arquivo','forum','campo','confronto','publicacao'];
let now=0,readyResolve;const ready=new Promise(r=>readyResolve=r);
const loads=Object.entries(data).map(([name,atlas])=>new Promise(resolve=>{const image=new Image();images[name]=image;image.onload=()=>{status.loaded.push(name);resolve();};image.onerror=()=>{status.failed.push(name);resolve();};image.src=atlas.url;}));
Promise.all(loads).then(()=>readyResolve(status));
function available(name){return images[name]?.complete&&images[name].naturalWidth>0;}
function frame(name,index){return data[name].frames[index];}
function actor(name,index,x,feet,height,dir=1,alpha=1,tilt=0){
 if(!available(name))return false;const f=frame(name,index),row=Math.floor(index/data[name].cols);
 const reference=name==='hero'?Math.max(data.hero.rowHeights[0],data.hero.rowHeights[1],data.hero.rowHeights[2]):data[name].rowHeights[row];
 const scale=height/reference;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha*=alpha;
 // Fixed head axis and measured ground baseline: no per-frame bounding-box scaling.
 ctx.translate(x,feet);ctx.scale(dir,1);if(tilt)ctx.rotate(tilt);
 ctx.drawImage(images[name],f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.foot*scale,f.w*scale,f.h*scale);ctx.restore();return true;
}
function shadow(x,y,w){ctx.save();ctx.fillStyle='rgba(5,10,18,.38)';ctx.beginPath();ctx.ellipse(x,y,w,2.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function prop(index,x,y,size,rotation=0,alpha=1){if(!available('props'))return false;const f=frame('props',index),b=f.bounds,w=b[2]-b[0],h=b[3]-b[1],s=size/Math.max(w,h);ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.drawImage(images.props,f.x+b[0],f.y+b[1],w,h,-w*s/2,-h*s/2,w*s,h*s);ctx.restore();return true;}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function hint(label,x,y,color='#f3e8cb'){
 ctx.save();const size=Math.min(26,Math.max(14,10*(window.GameCamera?.width||960)/(cv.clientWidth||960)));
 ctx.font='bold '+size+'px JetBrains Mono';const width=ctx.measureText(label).width+12;
 const sx=Math.max(width/2+4,Math.min(W-width/2-4,x));
 ctx.fillStyle='rgba(9,17,24,.9)';ctx.fillRect(sx-width/2,y-size-5,width,size+10);
 ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(label,sx,y+1);ctx.restore();
}
const api={ready,status,actor,prop,tick(dt){now+=dt;for(const e of ROOMS[game.room].entities){if(!['enemy','boss'].includes(e.type))continue;const x=e._x??e.x*TILE;e._artDistance=(e._artDistance||0)+Math.abs(x-(e._artPreviousX??x));e._artPreviousX=x;}},player(p){
 if(!available('hero'))return false;
 const walk=Math.abs(p.vx)>.4&&p.onGround;
 const index=game.flashLight>.6?10:game.recPulse>.85?11:!p.onGround?7:walk?Math.floor((p.walkDistance||0)/24)%6:6;
 p._artFrame=index;shadow(p.x+p.w/2,p.y+p.h+1,24);
 actor('hero',index,p.x+p.w/2,p.y+p.h,160,p.dir);
 return true;
},entity(e,ex,ey){
 if(['desk','shelf','tree','car'].includes(e.type)&&available('rooms'))return true;
 if(e.type==='door'){
  const locked=e.locked==='guard'?game.guardStunned<=0:!!(e.locked&&!game.abilities[e.locked]);
  const feet=ey+32,cx=Math.max(28,Math.min(W-28,ex+16));
  ctx.save();ctx.fillStyle='#11171c';ctx.fillRect(cx-24,feet-182,48,182);
  ctx.strokeStyle=locked?'#806942':'#ac8b45';ctx.lineWidth=2;ctx.strokeRect(cx-24,feet-182,48,182);
  ctx.fillStyle='#5d5340';ctx.fillRect(cx-20,feet-178,3,174);
  ctx.fillStyle='#d4a017';ctx.beginPath();ctx.arc(cx+(e.dir==='left'?-14:14),feet-84,2.5,0,Math.PI*2);ctx.fill();
  if(Math.abs(game.player.x+game.player.w/2-cx)<70)hint(locked?'TRANCADA':'[E] '+(e.dir==='left'?'←':'→'),cx,feet-193);
  ctx.restore();return true;
 }
 if(e.type==='clue'){
  if(e._collected||(e.hidden&&!game.abilities[e.hiddenBy]))return true;
  if(!available('props'))return false;const y=ey+15+Math.sin(now*.004+e.x)*2;
  glow(ex+16,y,29,'rgba(249,195,88,.25)');prop(e.method?.includes('PENDRIVE')?4:0,ex+16,y,26);return true;
 }
 if(e.type==='ability'){
  if(game.abilities[e.key])return true;if(!available('props'))return false;const y=ey+15+Math.sin(now*.004)*3;
  glow(ex+16,y,35,'rgba(112,230,196,.28)');prop(e.key==='cam'?1:2,ex+16,y,31);return true;
 }
 if(e.type==='npc'||e.type==='guard'){
  if(!available('npcs'))return false;
  const row=e.spriteRow??(e.type==='guard'?2:e.name==='FONTE'?1:0);
  const talking=game.state==='dialog'&&(game.dialog?.currentWho||game.dialog?.who)?.includes(e.name);
  const index=row*4+(talking?[0,1,2,1][Math.floor(now/360)%4]:0);
  const dir=game.player.x<ex?-1:1,stunned=e.type==='guard'&&game.guardStunned>0;
  shadow(ex+16,ey+33,24);actor('npcs',index,ex+16,ey+32,160,dir,stunned?.8:1);
  const near=Math.abs(game.player.x+game.player.w/2-ex-16)<TILE*1.6;
  if(near||stunned)hint(stunned?'ATORDOADA':'[E] '+(e.displayName||e.name),ex+16,ey-143,stunned?'#ffe6a0':'#f3e8cb');return true;
 }
 if(e.type==='enemy'){
  if(e.defeated)return true;if(!available('enemies'))return false;
  const x=e._x??ex,stunned=(e.stunned||0)>0,row=(e.kind==='assessor'||e.name==='ASSESSOR')?1:0;
  const index=row*6+(stunned?2:Math.floor((e._artDistance||0)/24)%6);
  shadow(x+16,ey+33,24);actor('enemies',index,x+16,ey+32,160,e._dir||1,stunned?.68:1);
  if(stunned)hint('ATORDOADO',x+16,ey-143,'#ffe6a0');
  if(row===1&&(e._hp??e.hp??1)>1){ctx.save();for(let i=0;i<(e.hp||3);i++){ctx.fillStyle=i<(e._hp??e.hp)?'#d4a5ed':'#3b3148';ctx.fillRect(x+2+i*12,ey-135,9,5);}ctx.restore();}
  return true;
 }
 if(e.type==='boss'){
  if(!available('enemies'))return false;
  const target=e._targetX;
  if(e._warning||e._hidden){
   const labels={jump:'SALTO · AFASTE-SE DA MARCA',vanish:'TELEPORTE',volley:'RAJADA',dash:'INVESTIDA · PULE'};
   hint(labels[e._warning]||'REAPARECE AQUI',e._x+18,(e._y??ey)-180,'#ffe384');
   if(target!=null&&(e._hidden||['jump','vanish'].includes(e._warning))){ctx.save();ctx.strokeStyle='#ffe384';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.strokeRect(target-24,ey-145,84,177);ctx.restore();}
  }
  if(e._hidden)return true;
  if(e._invuln>0&&Math.floor(e._invuln/3)%2===0)return true;
  const x=e._x??ex,y=e._y??ey,fall=e._fall||0,stunned=(e._stunned||0)>0;
  shadow(x+18,y+32,32);actor('enemies',12+(stunned||e.defeated?2:Math.floor((e._artDistance||0)/24)%6),x+18,y+32,176,e._dir||-1,e.defeated?.65:1,e.defeated?fall*.8:0);
  hint(e.defeated?'SE RETIRA':e._enraged?'ENFURECIDO':'DEPUTADO',x+18,y-158,e._enraged?'#ffc3ab':'#f3e8cb');return true;
 }
 return false;
},projectile(p,boss=false){
 if(!available('props'))return false;const a=Math.min(1,p.life/18);
 ctx.save();if(boss){glow(p.x,p.y,20,'rgba(220,102,82,.24)');prop(p.kind==='discurso'?7:0,p.x,p.y,p.kind==='discurso'?33:22,p.rot||0,a);}else if(p.weapon==='ped'){glow(p.x,p.y,20,'rgba(249,195,88,.27)');prop(3,p.x,p.y,26,(p.age||0)*.045*(p.dir||1),a);}else{prop(7,p.x,p.y,38,0,a);}ctx.restore();return true;
},effects(){
 if(!available('props'))return;const p=game.player,x=p.x+p.w/2,y=p.y+p.h-96;
 if(game.flashLight>.1)prop(6,x+p.dir*18,y,90*game.flashLight,now*.001,Math.min(.8,game.flashLight));
 if(game.recPulse>.1)prop(7,x,y,40+(1-game.recPulse)*115,0,game.recPulse*.7);
},describe(){return {version:'hd2d-1',loaded:[...status.loaded],failed:[...status.failed],playerFrame:game.player._artFrame??null,walkingFrames:6,renderScale:'160px adult, 176px boss; full-room camera',anchors:'measured feet baseline and head axis',physics:'foot capsule for platforms; scaled body bounds for combat'};}};
window.HD2D=api;
let staticRoom=null,staticLayer=null;
for(const [i,key] of rooms.entries()){
 const fallback=ROOMS[key].bg;
 ROOMS[key].bg=()=>{
  if(!available('rooms'))return fallback();
  if(staticRoom!==key){
   const layer=document.createElement('canvas');layer.width=W;layer.height=H;const c=layer.getContext('2d');const f=frame('rooms',i);
   c.imageSmoothingEnabled=true;c.drawImage(images.rooms,f.x,f.y,f.w,f.h,0,0,W,H);c.fillStyle='rgba(5,11,20,.07)';c.fillRect(0,0,W,H);
   const map=ROOMS[key].map;
   for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(map[y][x]==='#'){
    const px=x*TILE,py=y*TILE,top=y===0||map[y-1][x]!=='#';const g=c.createLinearGradient(0,py,0,py+32);
    g.addColorStop(0,top?'#73665b':'#2b343c');g.addColorStop(.18,top?'#4c5052':'#252d35');g.addColorStop(1,'#171f29');c.fillStyle=g;c.fillRect(px,py,32,32);
    if(top){c.fillStyle='rgba(247,215,160,.65)';c.fillRect(px,py,32,2);c.fillStyle='rgba(12,17,22,.65)';c.fillRect(px,py+5,32,2);}c.fillStyle='rgba(11,17,23,.3)';c.fillRect(px+31,py,1,32);
   }
   staticLayer=layer;staticRoom=key;
  }
  ctx.drawImage(staticLayer,0,0);
 };
}
const originalTiles=drawTiles;
drawTiles=function(){if(!available('rooms')||staticRoom!==game.room)return originalTiles();};
// Descriptive room signage; architecture carries no real government names or symbols.
ROOMS.forum.title='ÓRGÃO DE CONTROLE';ROOMS.forum.sub='auditoria de recursos públicos';
})();
