// ========== CLOCK ==========
function updateClock(){
  const now=new Date();
  const opts={hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'};
  const el=document.getElementById('clock');
  if(el) el.textContent=new Intl.DateTimeFormat('id-ID',opts).format(now);
}
updateClock(); setInterval(updateClock,10000);

// ========== SCROLL DOTS ==========
const snapper=document.querySelector('.snapper');
const dots=[...document.querySelectorAll('#dots a')];
const panels=[...document.querySelectorAll('.panel')];
const io=new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      const id=en.target.id;
      dots.forEach(a=>a.classList.toggle('active',a.dataset.target===id));
    }
  });
},{root:snapper,threshold:0.55});
panels.forEach(p=>io.observe(p));
dots.forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  const t=document.getElementById(a.dataset.target);
  if(t) snapper.scrollTo({top:t.offsetTop,behavior:'smooth'});
}));

// ========== MUSIC PLAYER ==========
const audio = document.getElementById('audio');
const ppBtn = document.getElementById('pp');
const seek = document.getElementById('seek');
const vol = document.getElementById('vol');
const curEl = document.getElementById('cur');
const durEl = document.getElementById('dur');
const coverImg = document.getElementById('coverImg');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const toggleDockBtn = document.getElementById('toggleDock');
const musicDock = document.getElementById('musicDock');
const playlistRow = document.getElementById('playlistRow');

// Playlist (Track 1 wajib about-you.mp3)
const playlist = [
  {title:'About You', src:'audio/about-you.mp3', cover:'image/about-you.jpeg'},
  {title:'Track 2', src:'audio/track2.mp3', cover:'image/about-you.jpeg'},
  {title:'Track 3', src:'audio/track3.mp3', cover:'image/about-you.jpeg'},
  {title:'Track 4', src:'audio/track4.mp3', cover:'image/about-you.jpeg'},
  {title:'Track 5', src:'audio/track5.mp3', cover:'image/about-you.jpeg'},
  {title:'Track 6', src:'audio/track6.mp3', cover:'image/about-you.jpeg'}
];
let idx = 0;
let shuffleOn = false;

function fmt(s){ if(!isFinite(s)) return '0:00'; const m=Math.floor(s/60); const ss=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${ss}`; }

function loadTrack(i){
  if(i<0) i=playlist.length-1;
  if(i>=playlist.length) i=0;
  idx=i;
  audio.src = playlist[idx].src;
  coverImg.src = playlist[idx].cover || 'image/about-you.jpeg';
}

function playPause(){
  if(audio.paused){ audio.play(); ppBtn.textContent='⏸'; }
  else { audio.pause(); ppBtn.textContent='▶'; }
}

function nextTrack(){
  if(shuffleOn){
    // ambil random beda dari idx sekarang
    let n;
    do { n = Math.floor(Math.random()*playlist.length); } while(n===idx && playlist.length>1);
    idx = n;
  } else {
    idx++;
    if(idx>=playlist.length) idx=0;
  }
  loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}

function prevTrack(){
  if(audio.currentTime > 3){ audio.currentTime = 0; return; }
  idx--; if(idx<0) idx=playlist.length-1;
  loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}

function renderPlaylist(){
  playlistRow.innerHTML='';
  playlist.forEach((t,i)=>{
    const b=document.createElement('button');
    b.className='track-btn';
    b.textContent=`Track ${i+1}`;
    b.onclick=()=>{ loadTrack(i); audio.play(); ppBtn.textContent='⏸'; };
    playlistRow.appendChild(b);
  });
}

audio.addEventListener('loadedmetadata', ()=>{ durEl.textContent=fmt(audio.duration); seek.max=Math.max(1,audio.duration||1); });
audio.addEventListener('timeupdate', ()=>{ curEl.textContent=fmt(audio.currentTime); if(!seek.dragging) seek.value=audio.currentTime; });
audio.addEventListener('ended', ()=> nextTrack());
seek.addEventListener('input', ()=>{ seek.dragging=true; });
seek.addEventListener('change', ()=>{ audio.currentTime=Number(seek.value)||0; seek.dragging=false; });
vol.addEventListener('input', ()=>{ audio.volume=Number(vol.value); });
ppBtn.addEventListener('click', playPause);
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
shuffleBtn.addEventListener('click', ()=>{
  shuffleOn=!shuffleOn;
  shuffleBtn.style.background = shuffleOn ? 'rgba(10,132,255,.16)' : '';
});
toggleDockBtn.addEventListener('click', ()=>{
  musicDock.classList.toggle('mini');
  toggleDockBtn.textContent = musicDock.classList.contains('mini') ? '▶' : '◀';
});

// init player
loadTrack(0);
renderPlaylist();

// ========== FIREBASE COMMENTS ==========
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
const db=firebase.firestore();

const formEl=document.getElementById('commentForm');
const nameEl=document.getElementById('cName');
const msgEl=document.getElementById('cMsg');
const commentsList=document.getElementById('commentsList');
let isAdmin = (localStorage.getItem('isAdmin') === '1');

function renderOne(doc){
  const d=doc.data();
  const wrap=document.createElement('div'); wrap.className='comment';
  const meta=document.createElement('div'); meta.className='meta';
  meta.textContent=`@${d.name} • ${d.ts && d.ts.toDate ? d.ts.toDate().toLocaleString('id-ID',{hour12:false}) : ''}`;
  const body=document.createElement('div'); body.textContent=d.msg;
  wrap.appendChild(meta); wrap.appendChild(body);

  if(d.reply){
    const rep=document.createElement('div');
    rep.style.marginTop='8px'; rep.style.padding='10px'; rep.style.borderRadius='10px';
    rep.style.background='rgba(0,0,0,.12)';
    rep.innerHTML=`<strong>Owner Reply:</strong><div style="margin-top:6px">${d.reply}</div>`;
    wrap.appendChild(rep);
  }

  if(isAdmin){
    const row=document.createElement('div');
    row.style.marginTop='8px'; row.style.display='flex'; row.style.gap='8px';
    const inp=document.createElement('input'); inp.className='input'; inp.placeholder='Tulis balasan...';
    const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Balas';
    btn.onclick=async()=>{ const t=inp.value.trim(); if(!t) return; await db.collection('comments').doc(doc.id).update({reply:t}); inp.value=''; };
    row.appendChild(inp); row.appendChild(btn); wrap.appendChild(row);
  }

  commentsList.appendChild(wrap);
}

db.collection('comments').orderBy('ts','asc').onSnapshot(snap=>{
  commentsList.innerHTML='';
  snap.forEach(d=>renderOne(d));
  commentsList.scrollTop=commentsList.scrollHeight;
});

formEl.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name=(nameEl.value||'').trim().slice(0,32);
  const msg=(msgEl.value||'').trim().slice(0,300);
  if(!name || !msg) return;
  await db.collection('comments').add({name,msg,ts: firebase.firestore.FieldValue.serverTimestamp()});
  formEl.reset();
});

// ========== SECRET QUESTIONS & ADMIN LOGIN ==========
const stillHere=document.getElementById('stillHere');
const modalBackdrop=document.getElementById('modalBackdrop');
const modalTitle=document.getElementById('modalTitle');
const modalBody=document.getElementById('modalBody');
const modalYes=document.getElementById('modalYes');
const modalNo=document.getElementById('modalNo');
const loginBackdrop=document.getElementById('loginBackdrop');
const loginUser=document.getElementById('loginUser');
const loginPass=document.getElementById('loginPass');
const loginSubmit=document.getElementById('loginSubmit');
const loginCancel=document.getElementById('loginCancel');
const loginMsg=document.getElementById('loginMsg');

// pool pertanyaan (acak diambil 5)
const questionsPool=[
  "Eh ini bukan tombol apa2 loh udah balik aja",
  "Lah kok masih dipencet?",
  "Napa di pencet?",
  "Ku bilang jangan di pencet!!!",
  "Dey?!, ku cakap jangan di pencet laa",
  "Kamu yakin mau lanjut? (ga ada apa2 beneran)",
  "Masih mau? balik aja deh",
  "Ini cuma teks biasa kok, beneran 🙂",
  "Gak ada apa-apa di sini, janji!",
  "Terakhir nih, yakin mau terusin?"
];
function pickRandomQuestions(n=5){
  const arr=[...questionsPool]; const out=[];
  for(let i=0;i<n;i++){ const j=Math.floor(Math.random()*arr.length); out.push(arr.splice(j,1)[0]); }
  return out;
}
let secretQuestions=[]; let secretIndex=0;

stillHere.addEventListener('click', ()=>{
  secretQuestions=pickRandomQuestions(5); secretIndex=0;
  showQuestion(secretQuestions[secretIndex]);
});
function showQuestion(q){
  modalTitle.textContent='Yakinkan dulu';
  modalBody.innerHTML=`<div style="color:var(--muted)">${q}</div>`;
  modalBackdrop.style.display='flex';
}
modalNo.addEventListener('click', ()=>{ modalBackdrop.style.display='none'; });
modalYes.addEventListener('click', ()=>{
  secretIndex++;
  if(secretIndex<secretQuestions.length){ showQuestion(secretQuestions[secretIndex]); }
  else { modalBackdrop.style.display='none'; loginBackdrop.style.display='flex'; }
});
loginCancel.addEventListener('click', ()=>{ loginBackdrop.style.display='none'; });

// kredensial (hash saja yang dibandingkan)
const ADMIN_USER_PLAIN="Keyzzz1";
const ADMIN_PASS_PLAIN="Alhaarith123";
const ADMIN_PLAIN=ADMIN_USER_PLAIN+':'+ADMIN_PASS_PLAIN;
const ADMIN_HASH_FINAL = CryptoJS.SHA256(ADMIN_PLAIN).toString();

loginSubmit.addEventListener('click', ()=>{
  const u=(loginUser.value||'').trim();
  const p=(loginPass.value||'').trim();
  if(!u || !p){ loginMsg.textContent='Isi username & password'; return; }
  const attempt=CryptoJS.SHA256(u+':'+p).toString();
  if(attempt===ADMIN_HASH_FINAL){
    isAdmin=true; localStorage.setItem('isAdmin','1');
    loginMsg.style.color='lightgreen'; loginMsg.textContent='Login sukses — kamu admin';
    setTimeout(()=>{ loginBackdrop.style.display='none'; }, 600);
    // refresh tampilan komentar agar tombol balas muncul
    db.collection('comments').orderBy('ts','asc').get().then(snap=>{
      commentsList.innerHTML=''; snap.forEach(doc=>renderOne(doc));
    });
  }else{
    loginMsg.style.color='salmon'; loginMsg.textContent='Salah username/password';
  }
});

// jika sudah pernah login
if(localStorage.getItem('isAdmin')==='1'){ isAdmin=true; }
