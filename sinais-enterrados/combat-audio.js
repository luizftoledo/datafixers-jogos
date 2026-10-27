/* Brief event sounds. Story dialogue always has priority over combat barks. */
(()=>{'use strict';
const data=window.COMBAT_AUDIO;if(!data||!window.GameAudio)return;
let voiceAt=-Infinity;const playedAt=new Map(),bags=new Map(),previous=new Map(),counts={effects:0,barks:0,rejected:0},events={};
const caption=document.createElement('div');caption.id='combatCaption';caption.hidden=true;caption.setAttribute('aria-live','polite');document.getElementById('stage').append(caption);
const style=document.createElement('style');style.textContent='#combatCaption{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:7;max-width:85%;padding:7px 10px;background:rgba(5,8,17,.9);border:1px solid #74634b;color:#f0e2c7;font:12px/1.4 monospace;text-align:center;pointer-events:none}@media(max-width:720px){#combatCaption{bottom:8px;font-size:11px;max-width:80%}}';document.head.append(style);
function clearCaption(){caption.hidden=true;caption.textContent='';clearTimeout(clearCaption.timer);}
function pick(key,items){let bag=bags.get(key);if(!bag?.length){bag=[...items];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.length>1&&bag[bag.length-1]===previous.get(key))[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];bags.set(key,bag);}const item=bag.pop();previous.set(key,item);return item;}
function fx(names,key=names.join(','),gap=75){const t=performance.now();if(t-(events[key]??-Infinity)<gap)return;events[key]=t;const name=pick('fx:'+key,names);GameAudio.effect(name,SFX.hit,{rate:.96+Math.random()*.08,gain:1});counts.effects++;}
function say(kind){const t=performance.now();if(game.state!=='play'||t-voiceAt<9000||Math.random()>(kind==='enrage'?1:.5)){counts.rejected++;return false;}const pool=data.lines.filter(l=>l.kind===kind&&t-(playedAt.get(l.text)??-Infinity)>=60000);if(!pool.length)return false;const line=pick('voice:'+kind,pool);if(!GameAudio.bark(line.text,line.url))return false;voiceAt=t;playedAt.set(line.text,t);counts.barks++;caption.textContent='CARLÃO: '+line.text;caption.hidden=false;clearCaption.timer=setTimeout(clearCaption,2500);return true;}
const original={};for(const name of ['rec','ped','flash','chief','bossHit','processo','discurso'])original[name]=SFX[name];
for(const name of ['rec','ped','flash','chief'])SFX[name]=()=>{GameAudio.effect(({rec:'davi-rec',ped:'davi-ped',flash:'davi-flash',chief:'marta-intervene'})[name],()=>tone(name==='rec'?420:180,.08,'triangle',.08),{rate:.96+Math.random()*.08});counts.effects++;};
SFX.bossHit=()=>{fx(['boss-hurt-1','boss-hurt-2'],'boss-hurt',90);if(game.boss?._hp>0)say('hurt');};
SFX.processo=()=>{fx(['boss-processo'],'boss-projectile',100);say('attack');};
SFX.discurso=()=>{fx(['boss-discurso'],'boss-projectile',100);say('attack');};
function playerHurt(){fx(['davi-hurt-1','davi-hurt-2'],'davi-hurt',150);}
window.CombatAudio={
 playerHurt,clearCaption,
 enemyHurt(e){fx([e.kind==='assessor'?'assessor-hurt':'lobista-hurt'],'enemy-hurt',90);},
 contact(e){fx([e.kind==='assessor'?'assessor-attack':'lobista-attack'],'enemy-contact',120);playerHurt();},
 guardFlash(){if(ROOMS[game.room].entities.some(e=>e.type==='guard'&&Math.abs(e.x*TILE-game.player.x)<400))fx(['guard-stun'],'guard-stun',1500);},
 enrage(){fx(['boss-enrage'],'boss-enrage',1500);say('enrage');},
 describe:()=>({...counts,lastVoiceAt:voiceAt,caption:caption.hidden?null:caption.textContent,recent:[...playedAt.keys()]})
};
})();
