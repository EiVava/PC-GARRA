/* ===== CONFIGURAÇÃO: cole aqui os dados do seu projeto Firebase (veja o passo a passo) ===== */
const FIREBASE_CONFIG = { ...cole aqui os campos... };
/* Exemplo: {apiKey:"...", authDomain:"...", projectId:"...", appId:"..."} */

const SITE = {nome:"GARRA", completo:"GARRA da Polícia Brasileira", servidor:"Nome do seu servidor de FiveM"};

const PAGES = {
  home:{href:"index.html",label:"Início"},
  hierarquia:{href:"hierarquia.html",label:"Hierarquia",intro:"Da maior patente para a menor. A ordem de comando segue esta lista."},
  upamentos:{href:"upamentos.html",label:"Upamentos",intro:"O que você precisa cumprir para subir de patente."},
  regras:{href:"regras.html",label:"Regulamento",intro:"Todo membro deve conhecer e cumprir estas regras."},
  membros:{href:"membros.html",label:"Membros",intro:"Lista atualizada do efetivo."},
  recrutamento:{href:"recrutamento.html",label:"Recrutamento",intro:"Siga os passos abaixo para fazer parte."}
};

/* Campos editáveis de cada página: [campo, rótulo, tipo opcional] */
const SCHEMAS = {
  home:{single:true,fields:[["slogan","Frase de apresentação"],["discord","Link do Discord"]]},
  hierarquia:{fields:[["nome","Patente"],["desc","Descrição"],["cmd","Faz parte do comando","check"]]},
  upamentos:{fields:[["para","Para a patente"],["tempo","Tempo mínimo"],["req","Requisitos"]]},
  regras:{fields:[["texto","Regra"]]},
  membros:{fields:[["nome","Nome"],["patente","Patente"],["entrada","Entrada"],["status","Status"]]},
  recrutamento:{fields:[["texto","Passo"]]}
};

const DEFAULTS = {
  home:[{slogan:"Disciplina, respeito e trabalho em equipe dentro da cidade.",discord:"https://discord.gg/SEU-CONVITE"}],
  hierarquia:[
    {nome:"Comandante",desc:"Responsável geral pelo grupamento",cmd:true},
    {nome:"Subcomandante",desc:"Auxilia o comando e assume na ausência",cmd:true},
    {nome:"Capitão",desc:"Coordena operações e equipes"},
    {nome:"Tenente",desc:"Lidera equipes em campo"},
    {nome:"Sargento",desc:"Supervisiona e orienta soldados"},
    {nome:"Cabo",desc:"Apoio direto aos sargentos"},
    {nome:"Soldado",desc:"Efetivo operacional"},
    {nome:"Recruta",desc:"Em período de formação"}],
  upamentos:[
    {para:"Soldado",tempo:"7 dias",req:"Concluir o curso de formação e ter 20 horas de patrulha"},
    {para:"Cabo",tempo:"14 dias",req:"40 horas de patrulha, 5 ocorrências registradas, sem advertências"},
    {para:"Sargento",tempo:"21 dias",req:"80 horas, prova teórica e indicação de um oficial"},
    {para:"Tenente",tempo:"30 dias",req:"120 horas, liderar 3 operações e avaliação do comando"},
    {para:"Capitão",tempo:"45 dias",req:"Indicação do subcomando e aprovação do comandante"}],
  regras:[
    {texto:"Respeite a hierarquia e as ordens dos superiores."},
    {texto:"Use o rádio e as viaturas apenas em serviço."},
    {texto:"Proibido abusar de poder ou agir fora do roleplay."},
    {texto:"Toda ocorrência deve ser registrada ao final do turno."},
    {texto:"Siga as regras gerais do servidor em qualquer situação."}],
  membros:[
    {nome:"Fulano Silva",patente:"Comandante",entrada:"01/03/2026",status:"Ativo"},
    {nome:"Ciclano Souza",patente:"Subcomandante",entrada:"10/03/2026",status:"Ativo"},
    {nome:"Mariana Costa",patente:"Soldado",entrada:"14/08/2026",status:"Afastado"}],
  recrutamento:[
    {texto:"Entre no nosso Discord e leia as regras."},
    {texto:"Preencha o formulário no canal de recrutamento."},
    {texto:"Aguarde a entrevista com um oficial."},
    {texto:"Faça o curso de formação como recruta."},
    {texto:"Após a aprovação, receba sua patente de soldado."}]
};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);
const key = document.body.dataset.key;
let db = null, auth = null, user = null, items = [], HOME = DEFAULTS.home[0], draft = null, msg = "";

/* ---------- Visual de cada página ---------- */
const R = {
  hierarquia: l => l.map((p,i)=>`<div class="rank${p.cmd?' cmd':''}"><span class="n">${i+1}</span><div><h3>${esc(p.nome)}</h3><small>${esc(p.desc)}</small></div>${p.cmd?'<span class="tag">Comando</span>':''}</div>`).join(""),
  upamentos: l => `<div class="scroll"><table><thead><tr><th>Para a patente</th><th>Tempo mínimo</th><th>Requisitos</th></tr></thead><tbody>${l.map(u=>`<tr><td><b>${esc(u.para)}</b></td><td>${esc(u.tempo)}</td><td>${esc(u.req)}</td></tr>`).join("")}</tbody></table></div>`,
  regras: l => `<ol>${l.map(r=>`<li>${esc(r.texto)}</li>`).join("")}</ol>`,
  membros: l => `<div class="scroll"><table><thead><tr><th>Nome</th><th>Patente</th><th>Entrada</th><th>Status</th></tr></thead><tbody>${l.map(m=>`<tr><td>${esc(m.nome)}</td><td>${esc(m.patente)}</td><td>${esc(m.entrada)}</td><td>${esc(m.status)}</td></tr>`).join("")}</tbody></table></div>`,
  recrutamento: l => `<ol class="steps">${l.map(s=>`<li>${esc(s.texto)}</li>`).join("")}</ol><p><a class="btn" href="${esc(HOME.discord)}">Entrar no Discord</a></p>`
};

function home(){
  const cards = Object.entries(PAGES).filter(([k])=>k!=="home").map(([k,p])=>`<a href="${p.href}"><h3>${p.label}</h3><span>${esc(p.intro)}</span></a>`).join("");
  return `<header class="hero"><h1>${esc(SITE.nome)}</h1><p>${esc(HOME.slogan)}</p><a class="btn" href="recrutamento.html">Quero entrar no grupamento</a></header><main><div class="cards">${cards}</div></main>`;
}

/* ---------- Estrutura comum ---------- */
function shell(){
  const links = Object.entries(PAGES).map(([k,p])=>`<a href="${p.href}"${k===key?' aria-current="page"':''}>${p.label}</a>`).join("");
  document.body.innerHTML = `<nav><b>${esc(SITE.nome)}</b>${links}<a href="login.html" id="auth"></a></nav><div id="view"></div><footer>${esc(SITE.completo)} · Grupamento do servidor ${esc(SITE.servidor)} · Conteúdo de roleplay, sem ligação com instituições reais.</footer>`;
  $("auth").onclick = e => { if(user){ e.preventDefault(); auth.signOut(); } };
  setAuthLabel();
}
function setAuthLabel(){ $("auth").textContent = user ? "Sair" : "Entrar"; }

/* ---------- Firebase ---------- */
const loadScript = src => new Promise((ok,err)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=err;document.head.appendChild(s);});
async function initFirebase(){
  if(!FIREBASE_CONFIG) return;
  const v="10.12.2", b=`https://www.gstatic.com/firebasejs/${v}/firebase-`;
  try{
    await loadScript(b+"app-compat.js");
    await Promise.all([loadScript(b+"auth-compat.js"),loadScript(b+"firestore-compat.js")]);
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore(); auth = firebase.auth();
    auth.onAuthStateChanged(u=>{ user=u; setAuthLabel(); if(!draft && key!=="login") render(); });
  }catch(e){ console.error(e); msg = "Não foi possível conectar ao Firebase. Mostrando o conteúdo padrão."; }
}
async function getList(k){
  if(db){ try{ const s = await db.collection("site").doc(k).get(); if(s.exists) return s.data().items; }catch(e){ console.error(e); } }
  return DEFAULTS[k];
}

/* ---------- Edição ---------- */
function editor(){
  const sc = SCHEMAS[key];
  const rows = draft.map((it,i)=>`<div class="erow" data-i="${i}">${sc.fields.map(([f,l,t])=> t==="check"
    ? `<label class="chk"><input type="checkbox" data-f="${f}" ${it[f]?"checked":""}> ${l}</label>`
    : `<label>${l}<input data-f="${f}" value="${esc(it[f])}"></label>`).join("")}${sc.single?"":`<span class="ctl"><button data-a="up" title="Subir">↑</button><button data-a="down" title="Descer">↓</button><button data-a="del">Remover</button></span>`}</div>`).join("");
  return `<div class="tools"><button class="btn" data-a="save">Salvar alterações</button><button class="btn alt" data-a="cancel">Cancelar</button>${sc.single?"":'<button class="btn alt" data-a="add">Adicionar linha</button>'}</div>${rows}`;
}
async function onClick(e){
  const a = e.target.dataset.a; if(!a) return;
  const row = e.target.closest(".erow"), i = row ? +row.dataset.i : -1;
  if(a==="edit"){ draft = JSON.parse(JSON.stringify(items)); }
  if(a==="cancel"){ draft = null; }
  if(a==="add"){ draft.push({}); }
  if(a==="del"){ draft.splice(i,1); }
  if(a==="up" && i>0){ [draft[i-1],draft[i]]=[draft[i],draft[i-1]]; }
  if(a==="down" && i<draft.length-1){ [draft[i+1],draft[i]]=[draft[i],draft[i+1]]; }
  if(a==="save"){
    try{
      await db.collection("site").doc(key).set({items:draft});
      items = draft; if(key==="home") HOME = items[0]; draft = null; msg = "Alterações salvas.";
    }catch(err){ console.error(err); msg = "Não foi possível salvar. Confira se o seu e-mail tem permissão nas regras do Firestore."; }
  }
  render();
}
function onInput(e){
  const f = e.target.dataset.f, row = e.target.closest(".erow"); if(!f||!row) return;
  draft[+row.dataset.i][f] = e.target.type==="checkbox" ? e.target.checked : e.target.value;
}

/* ---------- Telas ---------- */
function render(){
  const v = $("view");
  if(key==="home"){
    const m = msg ? `<div class="msg">${esc(msg)}</div>` : ""; msg = "";
    if(draft){ v.innerHTML = `<main><h1>Editar início</h1>${m}${editor()}</main>`; return; }
    v.innerHTML = home() + (user ? `<main>${m}<div class="tools"><button class="btn alt" data-a="edit">Editar início</button></div></main>` : ""); return;
  }
  const p = PAGES[key];
  const m = msg ? `<div class="msg">${esc(msg)}</div>` : ""; msg = "";
  const edit = user && !draft ? `<div class="tools"><button class="btn alt" data-a="edit">Editar esta página</button></div>` : "";
  v.innerHTML = `<main><h1>${p.label}</h1><p class="intro">${p.intro}</p>${m}${edit}${draft ? editor() : R[key](items)}</main>`;
}
function loginView(){
  $("view").innerHTML = `<main><h1>Entrar</h1><p class="intro">Acesso restrito ao comando.</p>${auth ? `<form class="login" id="lf"><label>E-mail<input type="email" id="em" required></label><label>Senha<input type="password" id="pw" required></label><button class="btn">Entrar</button><div id="err"></div></form>` : `<div class="msg">O login ainda não está configurado. Cole os dados do Firebase no início do arquivo app.js.</div>`}</main>`;
  if(auth) $("lf").onsubmit = async e => { e.preventDefault();
    try{ await auth.signInWithEmailAndPassword($("em").value,$("pw").value); location.href="index.html"; }
    catch(err){ $("err").innerHTML = '<div class="msg">E-mail ou senha incorretos.</div>'; } };
}

(async()=>{
  shell();
  await initFirebase();
  HOME = (await getList("home"))[0];
  if(key==="login"){ loginView(); return; }
  items = await getList(key);
  render();
  document.addEventListener("click", onClick);
  document.addEventListener("input", onInput);
})();
