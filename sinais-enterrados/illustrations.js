/* Narrative images load on demand; no new animation or collision work. */
(()=>{'use strict';
const base='art/story/';
const images={
 inauguration:{file:'inauguracao.webp',alt:'Carlão posa ao lado da placa do centro de reabilitação.'},
 closed:{file:'centro-fechado.webp',alt:'Uma mulher e sua mãe encontram o portão do centro fechado.'},
 inspection:{file:'vistoria.webp',alt:'Sala vazia do centro registrada durante a vistoria.'}
};
const style=document.createElement('style');style.textContent=`
.evidence-image{margin:0 0 12px;text-align:center}.evidence-image img{display:block;width:100%;max-height:260px;object-fit:contain;border:1px solid #726448;background:#14191d}.evidence-image figcaption{font-size:10px;line-height:1.5;color:#c7bfa9;margin-top:6px;letter-spacing:0}
.dialog.illustrated{z-index:30;max-height:85dvh;overflow-y:auto;overscroll-behavior:contain}
@media(max-width:720px),(max-height:500px){.dialog.illustrated{position:fixed;top:50%;bottom:auto;left:50%;transform:translate(-50%,-50%);width:min(640px,94vw);max-width:94vw;max-height:88dvh;box-sizing:border-box}.evidence-image img{max-height:38dvh}.dialog.illustrated .text{font-size:13px;line-height:1.45}}
`;document.head.append(style);
const dialog=document.getElementById('dialog'),figure=document.createElement('figure');figure.className='evidence-image';figure.hidden=true;const img=document.createElement('img'),caption=document.createElement('figcaption');img.decoding='async';figure.append(img,caption);document.getElementById('dlgText').before(figure);
const cache=new Map();function get(key){if(!cache.has(key)){const image=new Image();image.src=base+images[key].file;cache.set(key,image);}return cache.get(key);}
function display(text){let key=null;
 if(text===GameStory.lines('opening')[0].text)key='inauguration';
 for(const room of Object.values(ROOMS))for(const e of room.entities)if(e.type==='clue'&&e.text===text)key=({1:'closed',2:'inauguration',6:'inspection'})[e.ord]||null;
 figure.hidden=!key;dialog.classList.toggle('illustrated',!!key);dialog.scrollTop=0;
 if(key){img.src=base+images[key].file;img.alt=images[key].alt;caption.textContent=images[key].alt;}
}
const previousEnd=endGame;endGame=function(){previousEnd();const found=new Set(game.clues.map(c=>c.ord));for(const [ord,key] of [[2,'inauguration'],[6,'inspection']])if(found.has(ord)){const f=document.createElement('figure');f.className='evidence-image';const photo=document.createElement('img');photo.src=base+images[key].file;photo.alt=images[key].alt;photo.loading='lazy';f.append(photo);document.getElementById('cluesRecap').append(f);}};
// Archive prints and framed office photographs are decorative, behind actors.
const placements={redacao:[{key:'inauguration',x:245,y:305,w:76,h:51}],arquivo:[{key:'inauguration',x:104,y:318,w:96,h:64}],forum:[{key:'inspection',x:210,y:320,w:80,h:54}],confronto:[{key:'inauguration',x:650,y:310,w:100,h:67}]};
for(const [name,prints]of Object.entries(placements)){const previous=ROOMS[name].bg;ROOMS[name].bg=function(){previous();for(const p of prints){const photo=get(p.key);if(!photo.complete||!photo.naturalWidth)continue;ctx.save();ctx.fillStyle='#322a21';ctx.fillRect(p.x-3,p.y-3,p.w+6,p.h+6);ctx.imageSmoothingEnabled=true;ctx.drawImage(photo,p.x,p.y,p.w,p.h);ctx.restore();}};}
window.GameIllustrations={dialog:display,images};
})();
