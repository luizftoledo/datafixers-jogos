/* Local, generated audio. No credentials or runtime synthesis requests. */
(()=>{'use strict';
const manifest=window.GAME_AUDIO||{voices:{},sfx:{}},voice=new Audio();voice.preload='none';
let voiceToken=0,activeVoice=null,voiceVolume=.85,effectsVolume=.65;
try{voiceVolume=+(localStorage.getItem('se-voice')??.85);effectsVolume=+(localStorage.getItem('se-effects')??.65);}catch{}
const buffers=new Map(),loading=new Map(),active=new Set(),last=new Map(),stats={played:0,failed:0,voices:0};
function stopVoice(){Music.setDucked(false);voiceToken++;activeVoice=null;voice.pause();voice.removeAttribute('src');voice.load();}
function sync(){voice.muted=!soundOn;voice.volume=Math.max(0,Math.min(1,voiceVolume));for(const a of active)a.gain.gain.value=soundOn?effectsVolume*.6:0;if(!soundOn)stopVoice();}
function speak(text){stopVoice();if(!soundOn||document.hidden||voiceVolume===0)return;const path=manifest.voices[text];if(!path)return;const token=voiceToken;activeVoice=text;voice.src=path;Music.setDucked(true);sync();voice.play().then(()=>{if(token===voiceToken)stats.voices++;}).catch(()=>{if(token===voiceToken){activeVoice=null;Music.setDucked(false);stats.failed++;}});}
voice.onended=()=>{activeVoice=null;Music.setDucked(false);};voice.onerror=()=>{activeVoice=null;Music.setDucked(false);};
async function buffer(name){if(buffers.has(name))return buffers.get(name);if(loading.has(name))return loading.get(name);const url=manifest.sfx[name];if(!url)return null;const pending=fetch(url).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(b=>ensureAudio().decodeAudioData(b)).then(b=>{buffers.set(name,b);return b;}).finally(()=>loading.delete(name));loading.set(name,pending);return pending;}
function effect(name,fallback){if(!soundOn||document.hidden||effectsVolume===0)return;const t=performance.now();if(t-(last.get(name)||-1000)<65||active.size>=6)return;last.set(name,t);const context=ensureAudio();if(!context)return;const began=t;
 const play=b=>{if(!b||!soundOn||document.hidden||performance.now()-began>180||active.size>=6)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=b;gain.gain.value=effectsVolume*.6;source.connect(gain).connect(context.destination);const slot={source,gain};active.add(slot);source.onended=()=>{active.delete(slot);source.disconnect();gain.disconnect();};source.start();stats.played++;};
 if(buffers.has(name))play(buffers.get(name));else{fallback?.();buffer(name).catch(()=>stats.failed++);}
}
function stopAll(){stopVoice();for(const a of active){try{a.source.stop();}catch{}}}
const aliases={jump:'jump',land:'land',clue:'clue',ability:'clue',hit:'hit',flash:'flash',rec:'rec',enemyDown:'hit',door:'door',ped:'ped',chief:'chief',bossHit:'hit',bossDie:'bossLand',processo:'ped',bossIntro:'door',bossGo:'chief',bossJump:'jump',bossLand:'bossLand',discurso:'rec',gameOver:'bossLand',win:'chief'};
for(const [key,name] of Object.entries(aliases)){const fallback=SFX[key];SFX[key]=()=>effect(name,fallback);}
SFX.dialog=()=>{};
// Fetch/decode only short effects after the first gesture; speech remains on demand.
function warm(){if(!soundOn)return;const names=Object.keys(manifest.sfx);let i=0;const next=()=>{if(i>=names.length||document.hidden)return;buffer(names[i++]).catch(()=>{}).finally(()=>setTimeout(next,150));};next();}
document.addEventListener('pointerdown',()=>{unlockAudio();Music.resume();warm();},{once:true});
function setting(label,key,value,update){const row=document.createElement('label');row.className='ap-row';row.innerHTML='<span>'+label+'</span><input aria-label="'+label+'" type="range" min="0" max="1" step="0.05" value="'+value+'">';row.querySelector('input').addEventListener('input',e=>{update(+e.target.value);try{localStorage.setItem(key,e.target.value);}catch{}sync();});document.querySelector('#audioPanel').append(row);}
setting('Falas','se-voice',voiceVolume,v=>voiceVolume=v);setting('Efeitos','se-effects',effectsVolume,v=>effectsVolume=v);
addEventListener('pagehide',()=>{stopAll();Music.suspend();});
window.GameAudio={speak,stopVoice,stopAll,sync,describe:()=>({activeEffects:active.size,decodedEffects:buffers.size,activeVoice,voiceVolume,effectsVolume,...stats})};sync();
})();
