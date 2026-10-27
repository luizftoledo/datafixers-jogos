/* Story text and speaker attribution. Game mechanics stay in the engine. */
(()=>{'use strict';const story=window.STORY_DATA;
const lines=name=>story[name].map(l=>({who:l.speaker?story.characters[l.speaker].label:'CONTROLES',text:l.text}));
Object.assign(ROOM_INTROS,story.room_intros);
document.querySelector('#titleScreen p').textContent=story.summary;
for(const [room,meta]of Object.entries(story.rooms))Object.assign(ROOMS[room],meta);
const editor=ROOMS.redacao.entities.find(e=>e.name==='EDITOR');editor.dialog=lines('opening');editor.displayName=story.characters['MARTA'].label;editor.characterId='MARTA';editor.spriteRow=story.characters['MARTA'].sprite_row;
const guard=ROOMS.forum.entities.find(e=>e.type==='guard');guard.dialog=lines('guard');guard.displayName=story.characters['NÁDIA'].label;guard.characterId='NÁDIA';guard.spriteRow=story.characters['NÁDIA'].sprite_row;
const source=ROOMS.campo.entities.find(e=>e.name==='FONTE');source.dialog=lines('source');source.altDialog=lines('source_alt');source.displayName=story.characters['ELIAS'].label;source.characterId='ELIAS';source.spriteRow=story.characters['ELIAS'].sprite_row;
const boss=ROOMS.confronto.entities.find(e=>e.type==='boss');boss.intro=lines('confrontation');boss.shouts=story.shouts.map(l=>l.text);
for(const room of Object.values(ROOMS))for(const e of room.entities)if(e.type==='clue')Object.assign(e,story.clues.find(c=>c.ord===e.ord));
function ending(){
 const found=new Set(game.clues.map(c=>c.ord));
 const complete=[2,3,5,6,8,10].every(n=>found.has(n));
 document.querySelector('#endScreen .tag').textContent=complete?'reportagem publicada':'reportagem não concluída';
 document.querySelector('#endScreen .end-kicker').textContent=complete?'JORNALZÃO DO CIDADÃO':'CADERNO DE APURAÇÃO';
 document.getElementById('endHead').textContent=complete?'Deputado Carlão inaugurou duas vezes centro de reabilitação que recebeu R$ 4 milhões e segue fechado':'Faltam documentos para concluir a reportagem sobre o centro anunciado por Carlão';
 document.getElementById('endDeck').textContent=complete?'Empresa de um ex-sócio do deputado apresentou cobranças por sessões de fisioterapia. Fiscalização encontrou a unidade fechada e sem equipamentos.':'Os documentos reunidos até aqui ainda não sustentam a reportagem completa.';
 document.getElementById('endByline').textContent='Por Davi · Jornalzão do Cidadão · abril de 2024 · caso fictício';
 document.getElementById('endStats').textContent=found.size+'/10 documentos encontrados';
 const article=document.getElementById('cluesRecap');article.replaceChildren();
 function paragraph(text,evidence){const p=document.createElement('p');p.className='art-p';p.textContent=text;if(evidence)p.dataset.evidence=evidence;article.append(p);}
 if(complete){
  paragraph('O deputado Carlão do Pastel participou de duas inaugurações de um centro de reabilitação que recebeu R$ 4 milhões em recursos públicos, mas ainda não atendeu pacientes encaminhados pela rede de saúde. Uma vistoria encontrou o imóvel fechado e sem os equipamentos previstos, embora a prestação de contas apresente cobranças por sessões de fisioterapia.');
  paragraph('Os dois anúncios de inauguração ocorreram com onze meses de intervalo. Nas fotos, Carlão aparece diante da mesma placa, que promete 120 atendimentos por dia. A secretaria de Saúde informou que a unidade não recebeu pacientes encaminhados pela rede.',2);
  if(found.has(1))paragraph('Uma moradora contou à reportagem que foi duas vezes ao endereço com a mãe, em busca de atendimento. Nas duas visitas, encontrou o portão fechado. A identidade da paciente e seus dados de saúde foram preservados.',1);
  paragraph('O dinheiro chegou ao Instituto Plenitude em junho de 2023, por meio de uma emenda indicada por Carlão. O plano previa instalar os equipamentos em agosto e começar o atendimento em setembro daquele ano.');
  paragraph('Em março de 2024, porém, uma equipe de fiscalização encontrou o imóvel fechado, sem pacientes e sem os equipamentos previstos no plano de trabalho. O relatório da visita inclui fotos das salas vazias.',6);
  paragraph('Questionado sobre o centro fechado, Carlão atribuiu o atraso à falta de alvará. O documento da fiscalização, no entanto, registra que a autorização já havia sido emitida em novembro de 2023, quatro meses antes da vistoria.');
  paragraph('As contas entregues ao ministério incluem sete notas da Vértice Serviços que cobram sessões de fisioterapia. Duas são de junho e julho de 2023, antes da instalação dos equipamentos prevista para agosto e do início dos atendimentos previsto para setembro. Essas cobranças não comprovam que os atendimentos aconteceram.');
  paragraph('A Vértice foi contratada pela Plenitude para gerir o centro. O proprietário da empresa foi sócio de Carlão até 2021, segundo o registro público. O contrato separa os gastos de instalação das despesas com atendimento.');
  if(found.has(4))paragraph('O Instituto Plenitude foi criado cinco meses antes de receber a verba. Seu presidente é um ex-funcionário do gabinete do deputado.');
  paragraph('Arquivos contábeis obtidos pela reportagem registram 23 transferências da Plenitude à Vértice, no total de R$ 3,4 milhões — 85% do dinheiro recebido pelo instituto. Sete comprovantes correspondem às notas entregues ao ministério. As demais transferências registradas na planilha ainda não tiveram confirmação independente.');
  if(found.has(9))paragraph('Uma lista de atendimentos entregue à reportagem repete os mesmos nomes, na mesma ordem, em dias seguidos. Os totais de sete datas coincidem com as cobranças nas notas fiscais. Os nomes foram omitidos para preservar os dados de saúde das pessoas citadas.');
  paragraph('Sobre as cobranças, Carlão disse que as contas são responsabilidade do instituto e pediu que as perguntas fossem enviadas por escrito.');
  if(found.has(7))paragraph('A fiscalização pediu à Plenitude os registros dos atendimentos e os comprovantes de entrega dos equipamentos. Segundo a análise técnica, o instituto apresentou novas notas, mas não entregou esses documentos. O caso ainda não foi julgado.');
  document.querySelector('#endScreen .end-closing').textContent='O Instituto Plenitude e a Vértice Serviços não responderam até o fechamento desta reportagem.';
 }else{
  for(const clue of story.clues)if(found.has(clue.ord))paragraph(clue.article,clue.ord);
  document.querySelector('#endScreen .end-closing').textContent='Volte à investigação para encontrar os documentos que faltam. Esta tentativa não resultou em uma matéria publicada.';
 }
 document.querySelector('#endScreen .end-paper').scrollTop=0;
}

const oldEnd=endGame;endGame=function(){oldEnd();ending();};
function bossLines(){const list=lines('confrontation');if(!game.clues.some(c=>c.ord===6))list[2]=lines('confrontation_without_inspection')[0];return list;}
window.GameStory={lines,ending,bossLines,characters:story.characters,allSpoken:[...['opening','guard','source','source_alt','confrontation','confrontation_without_inspection','shouts','closing'].flatMap(k=>story[k].filter(l=>l.speaker).map(l=>l.text))],version:'story-3'};
})();
