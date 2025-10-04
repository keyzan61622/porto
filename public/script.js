// @ts-nocheck
/* ========= UTIL ========= */
const $ = (s, r=document)=>r.querySelector(s);
const $all = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* ========= CLOCK ========= */
function updateClock(){
  const now = new Date();
  const opts = { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Jakarta' };
  const el = $('#clock');
  if (el) el.textContent = new Intl.DateTimeFormat('id-ID', opts).format(now);
}
updateClock(); setInterval(updateClock, 10000);

/* ========= DOTS NAV ========= (snap lock dimatiin, tapi titik tetap bisa klik) */
const snapper = $('.snapper');
const dots = $all('#dots a');
const panels = $all('.panel');
const io = new IntersectionObserver((entries)=>{
  entries.forEach((en)=>{
    if(en.isIntersecting){
      const id = en.target.id;
      dots.forEach(a=>a.classList.toggle('active', a.dataset.target===id));
    }
  });
},{ root:snapper, threshold:0.55 });
panels.forEach(p=>io.observe(p));
dots.forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const t = document.getElementById(a.dataset.target);
    if (t) snapper.scrollTo({ top:t.offsetTop, behavior:'smooth' });
  });
});

/* ========= MUSIC PLAYER ========= */
const audio = $('#audio');
const ppBtn = $('#pp');
const seek = $('#seek');
const vol = $('#vol');
const curEl = $('#cur');
const durEl = $('#dur');
const coverImg = $('#coverImg');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const shuffleBtn = $('#shuffleBtn');
const toggleDockBtn = $('#toggleDock');
const musicDock = $('#musicDock');
const metaTitle = $('#metaTitle');
const metaArtist = $('#metaArtist');

const playlist = [
  { title:'About You', artist:'The 1975', src:'audio/about-you.mp3', cover:'image/about-you.jpeg' },
  { title:'Track 2', artist:'Unknown', src:'audio/track2.mp3', cover:'image/about-you.jpeg' },
  { title:'Track 3', artist:'Unknown', src:'audio/track3.mp3', cover:'image/about-you.jpeg' },
  { title:'Track 4', artist:'Unknown', src:'audio/track4.mp3', cover:'image/about-you.jpeg' },
  { title:'Track 5', artist:'Unknown', src:'audio/track5.mp3', cover:'image/about-you.jpeg' },
  { title:'Track 6', artist:'Unknown', src:'audio/track6.mp3', cover:'image/about-you.jpeg' }
];

let idx = 0;
let isShuffle = false;
let shuffledOrder = [];

function loadTrack(i){
  if (i<0) i = playlist.length-1;
  if (i>=playlist.length) i = 0;
  idx = i;
  const t = playlist[idx];
  audio.src = t.src;
  coverImg.src = t.cover || 'image/about-you.jpeg';
  metaTitle.textContent = t.title;
  metaArtist.textContent = t.artist;
}
function fmt(sec){
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return m + ':' + (s<10 ? '0'+s : s);
}
function makeShuffle(){
  shuffledOrder = playlist.map((_,i)=>i).filter(i=>i!==idx);
  for (let i=shuffledOrder.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [shuffledOrder[i],shuffledOrder[j]] = [shuffledOrder[j],shuffledOrder[i]];
  }
}
function nextTrack(){
  if (isShuffle){
    if (shuffledOrder.length===0) makeShuffle();
    idx = shuffledOrder.shift();
  } else idx++;
  loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}
function prevTrack(){
  if (audio.currentTime>3){ audio.currentTime=0; return; }
  idx--; loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}

audio.addEventListener('loadedmetadata', ()=>{
  durEl.textContent = fmt(audio.duration);
  seek.max = Math.max(1, audio.duration || 1);
});
audio.addEventListener('timeupdate', ()=>{
  curEl.textContent = fmt(audio.currentTime);
  if (!seek.dragging) seek.value = audio.currentTime;
});
audio.addEventListener('ended', nextTrack);

seek.addEventListener('input', ()=>{ seek.dragging = true; });
seek.addEventListener('change', ()=>{
  audio.currentTime = Number(seek.value) || 0;
  seek.dragging = false;
});
vol.addEventListener('input', ()=>{ audio.volume = Number(vol.value); });

ppBtn.addEventListener('click', ()=>{
  if (audio.paused){ audio.play(); ppBtn.textContent='⏸'; }
  else { audio.pause(); ppBtn.textContent='▶'; }
});
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
shuffleBtn.addEventListener('click', ()=>{
  isShuffle = !isShuffle;
  shuffleBtn.style.background = isShuffle ? 'rgba(10,132,255,.24)' : 'rgba(255,255,255,.08)';
  if (isShuffle) makeShuffle();
});
toggleDockBtn.addEventListener('click', ()=>{
  musicDock.classList.toggle('mini');
  toggleDockBtn.textContent = musicDock.classList.contains('mini') ? '▢' : '—';
});

loadTrack(0);
if (window.innerWidth<=640) musicDock.style.top='16px';
window.addEventListener('resize', ()=>{
  musicDock.style.top = (window.innerWidth<=640 ? '16px' : '12px');
});

/* ========= FIREBASE (COMMENTS + BALAS) ========= */
const firebaseConfig = {
  apiKey: "AIzaSyD_9VpfQdqoTNwwF8fYY37OaQ42Ag6ImEE",
  authDomain: "call-3de3b.firebaseapp.com",
  projectId: "call-3de3b",
  storageBucket: "call-3de3b.firebasestorage.app",
  messagingSenderId: "540758179959",
  appId: "1:540758179959:web:b4201c873e3d639a160672",
  measurementId: "G-J2P0KEWSRT"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const formEl = $('#commentForm');
const nameEl = $('#cName');
const msgEl = $('#cMsg');
const commentsList = $('#commentsList');

let isAdmin = (localStorage.getItem('isAdmin') === '1');

function renderReply(replyText){
  const rep = document.createElement('div');
  rep.style.marginTop='8px';
  rep.style.padding='10px';
  rep.style.borderRadius='10px';
  rep.style.background='rgba(255,255,255,.10)';
  rep.innerHTML = '<strong>Owner Reply:</strong><div style="margin-top:6px">'+ replyText +'</div>';
  return rep;
}

function commentRowForAdmin(docId){
  const row = document.createElement('div');
  row.style.marginTop='8px';
  row.style.display='flex';
  row.style.gap='8px';
  const input = document.createElement('input');
  input.className='input';
  input.placeholder='Tulis balasan...';
  const btn = document.createElement('button');
  btn.className='btn primary';
  btn.textContent='Balas';
  btn.onclick = ()=>{
    const reply = (input.value||'').trim();
    if(!reply) return;
    db.collection('replies').doc(docId).set({
      text: reply,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    }).then(()=>{ input.value=''; });
  };
  row.appendChild(input); row.appendChild(btn);
  return row;
}

function renderComment(doc){
  const d = doc.data();
  const wrap = document.createElement('div'); wrap.className='comment';
  const meta = document.createElement('div'); meta.className='meta';
  const when = (d.ts && d.ts.toDate) ? d.ts.toDate().toLocaleString('id-ID',{hour12:false}) : '';
  meta.textContent = '@'+d.name+' • '+when;
  const body = document.createElement('div'); body.textContent = d.msg;
  wrap.appendChild(meta); wrap.appendChild(body);

  // muat balasan jika ada
  db.collection('replies').doc(doc.id).get().then(s=>{
    if (s.exists && s.data().text) wrap.appendChild(renderReply(s.data().text));
  });

  if (isAdmin) wrap.appendChild(commentRowForAdmin(doc.id));
  commentsList.appendChild(wrap);
}

function rerenderAll(snapshot){
  commentsList.innerHTML='';
  snapshot.forEach(doc=>renderComment(doc));
  commentsList.scrollTop = commentsList.scrollHeight;
}

let lastSnap = null;
db.collection('comments').orderBy('ts','asc').onSnapshot((snap)=>{
  lastSnap = snap;
  rerenderAll(snap);
});

if (formEl){
  formEl.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const name = (nameEl.value||'').trim().slice(0,32);
    const msg = (msgEl.value||'').trim().slice(0,300);
    if(!name || !msg) return;
    db.collection('comments').add({
      name, msg, ts: firebase.firestore.FieldValue.serverTimestamp()
    }).then(()=>formEl.reset());
  });
}

/* ========= SECRET LOGIN (Q&A + SHA-256) ========= */
const stillHere = $('#stillHere');
const modalBackdrop = $('#modalBackdrop');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalYes = $('#modalYes');
const modalNo = $('#modalNo');

const loginBackdrop = $('#loginBackdrop');
const loginUser = $('#loginUser');
const loginPass = $('#loginPass');
const loginSubmit = $('#loginSubmit');
const loginCancel = $('#loginCancel');
const loginMsg = $('#loginMsg');

const questionsPool = [
  "Eh ini bukan tombol apa2 loh, balik aja.",
  "Masih dipencet? ga ada apa-apa kok.",
  "Serius nih mau lanjut?",
  "Ku bilang jangan di pencet!!!",
  "Oke kalo yakin, lanjut?",
  "Kepo bener ya? 😅",
  "Salah tombol kayanya.",
  "Terakhir nih, yakin?",
  "Yah masih lanjut juga…",
  "Oke… ayo login."
];
function pickRandomQuestions(n){
  const arr = questionsPool.slice(), out=[];
  for(let i=0;i<n;i++){ const j=Math.floor(Math.random()*arr.length); out.push(arr.splice(j,1)[0]); }
  return out;
}
let seq=[], qi=0;
function showQ(q){
  modalTitle.textContent='Yakinkan dulu';
  modalBody.innerHTML='<div class="muted">'+q+'</div>';
  modalBackdrop.style.display='flex';
}
if (stillHere){
  stillHere.addEventListener('click', ()=>{
    seq = pickRandomQuestions(5); qi=0; showQ(seq[qi]);
  });
}
if (modalNo) modalNo.addEventListener('click', ()=>{ modalBackdrop.style.display='none'; });
if (modalYes) modalYes.addEventListener('click', ()=>{
  qi++;
  if (qi<seq.length) showQ(seq[qi]);
  else { modalBackdrop.style.display='none'; loginBackdrop.style.display='flex'; }
});
if (loginCancel) loginCancel.addEventListener('click', ()=>{ loginBackdrop.style.display='none'; });

const ADMIN_HASH_HEX = "e0a495a5eea47a155bc76370d16bbfd7f3a9d5fff753f1f601f22b7365471024"; // SHA-256("Keyzzz1:Alhaarith123")

if (loginSubmit){
  loginSubmit.addEventListener('click', ()=>{
    const u = (loginUser.value||'').trim();
    const p = (loginPass.value||'').trim();
    if(!u || !p){ loginMsg.textContent='Isi username & password'; return; }
    const attempt = CryptoJS.SHA256(u+':'+p).toString();
    if (attempt===ADMIN_HASH_HEX){
      isAdmin = true;
      localStorage.setItem('isAdmin','1');
      loginMsg.style.color='#9be29b';
      loginMsg.textContent='Login sukses — mode admin aktif.';
      setTimeout(()=>{ loginBackdrop.style.display='none'; }, 700);

      // ⟶ Penting: refresh komentar agar UI BALAS muncul setelah login
      if (lastSnap) rerenderAll(lastSnap);
    } else {
      loginMsg.style.color='#ffb4b4';
      loginMsg.textContent='Salah username/password';
    }
  });
}
