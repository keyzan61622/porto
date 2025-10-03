/* ===== Clock ===== */
function updateClock(){
  const now=new Date();
  const opts={hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'};
  const el=document.getElementById('clock');
  if(el) el.textContent=new Intl.DateTimeFormat('id-ID',opts).format(now);
}
updateClock(); setInterval(updateClock,10000);

/* ===== Scroll dots ===== */
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
dots.forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const t=document.getElementById(a.dataset.target);
    if(t) snapper.scrollTo({top:t.offsetTop,behavior:'smooth'});
  });
});

/* ===== Music Player ===== */
const audio=document.getElementById('audio');
const ppBtn=document.getElementById('pp');
const seek=document.getElementById('seek');
const vol=document.getElementById('vol');
const curEl=document.getElementById('cur');
const durEl=document.getElementById('dur');
const coverImg=document.getElementById('coverImg');
const prevBtn=document.getElementById('prevBtn');
const nextBtn=document.getElementById('nextBtn');
const shuffleBtn=document.getElementById('shuffleBtn');
const toggleDockBtn=document.getElementById('toggleDock');
const musicDock=document.getElementById('musicDock');
const playlistRow=document.getElementById('playlistRow');

const playlist=[
  {id:1,title:'About You',src:'audio/about-you.mp3',cover:'image/about-you.jpeg'},
  {id:2,title:'Track 2',src:'audio/track2.mp3',cover:'image/about-you.jpeg'},
  {id:3,title:'Track 3',src:'audio/track3.mp3',cover:'image/about-you.jpeg'},
  {id:4,title:'Track 4',src:'audio/track4.mp3',cover:'image/about-you.jpeg'},
  {id:5,title:'Track 5',src:'audio/track5.mp3',cover:'image/about-you.jpeg'},
  {id:6,title:'Track 6',src:'audio/track6.mp3',cover:'image/about-you.jpeg'},
];
let idx=0;
let shuffle=false;
let shuffledOrder=[];

function fmt(s){ if(!isFinite(s)) return '0:00'; const m=Math.floor(s/60); const ss=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${ss}`; }

function loadTrack(i){
  if(i<0) i=playlist.length-1;
  if(i>=playlist.length) i=0;
  idx=i;
  const tr=playlist[idx];
  audio.src=tr.src;
  coverImg.src=tr.cover||'image/about-you.jpeg';
}

function playPause(){
  if(audio.paused){ audio.play(); ppBtn.textContent='⏸'; }
  else { audio.pause(); ppBtn.textContent='▶'; }
}
function nextTrack(){
  if(shuffle){
    if(shuffledOrder.length===0) generateShuffle();
    idx=shuffledOrder.shift();
  }else{
    idx++; if(idx>=playlist.length) idx=playlist.length-1; // tidak repeat
  }
  loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}
function prevTrack(){
  if(audio.currentTime>3){ audio.currentTime=0; return; }
  idx--; if(idx<0) idx=0;
  loadTrack(idx); audio.play(); ppBtn.textContent='⏸';
}
function generateShuffle(){
  shuffledOrder=playlist.map((_,i)=>i).filter(i=>i!==idx);
  for(let i=shuffledOrder.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [shuffledOrder[i],shuffledOrder[j]]=[shuffledOrder[j],shuffledOrder[i]];
  }
}

function renderPlaylistRow(){
  playlistRow.innerHTML='';
  playlist.forEach((t,i)=>{
    const btn=document.createElement('button');
    btn.className='track-btn';
    btn.textContent=`Track ${i+1}`;
    btn.onclick=()=>{ loadTrack(i); audio.play(); ppBtn.textContent='⏸'; };
    playlistRow.appendChild(btn);
  });
}

audio.addEventListener('loadedmetadata',()=>{ durEl.textContent=fmt(audio.duration); seek.max=Math.max(1,audio.duration||1); });
audio.addEventListener('timeupdate',()=>{ curEl.textContent=fmt(audio.currentTime); if(!seek.dragging) seek.value=audio.currentTime; });
audio.addEventListener('ended',()=>{ ppBtn.textContent='▶'; /* stop (tanpa repeat) */ });
seek.addEventListener('input',()=>{ seek.dragging=true; });
seek.addEventListener('change',()=>{ audio.currentTime=Number(seek.value)||0; seek.dragging=false; });
vol.addEventListener('input',()=>{ audio.volume=Number(vol.value); });
ppBtn.addEventListener('click',playPause);
prevBtn.addEventListener('click',prevTrack);
nextBtn.addEventListener('click',nextTrack);
shuffleBtn.addEventListener('click',()=>{
  shuffle=!shuffle;
  shuffleBtn.style.background=shuffle?'rgba(10,132,255,.25)':'rgba(255,255,255,.08)';
  if(shuffle) generateShuffle();
});
toggleDockBtn.addEventListener('click',()=>{
  musicDock.classList.toggle('mini');
  toggleDockBtn.textContent=musicDock.classList.contains('mini')?'▶':'◀';
});

loadTrack(0);
renderPlaylistRow();

/* ===== Firebase (Comments) ===== */
const firebaseConfig={
  apiKey:"AIzaSyD_9VpfQdqoTNwwF8fYY37OaQ42Ag6ImEE",
  authDomain:"call-3de3b.firebaseapp.com",
  projectId:"call-3de3b",
  storageBucket:"call-3de3b.firebasestorage.app",
  messagingSenderId:"540758179959",
  appId:"1:540758179959:web:b4201c873e3d639a160672",
  measurementId:"G-J2P0KEWSRT"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();

const formEl=document.getElementById('commentForm');
const nameEl=document.getElementById('cName');
const msgEl=document.getElementById('cMsg');
const commentsList=document.getElementById('commentsList');

let isAdmin=(localStorage.getItem('isAdmin')==='1');

function renderOne(doc){
  const d=doc.data();
  const wrap=document.createElement('div'); wrap.className='comment';
  const meta=document.createElement('div'); meta.className='meta';
  meta.textContent=`@${d.name} • ${d.ts && d.ts.toDate ? d.ts.toDate().toLocaleString('id-ID',{hour12:false}) : ''}`;
  const body=document.createElement('div'); body.textContent=d.msg;
  wrap.appendChild(meta); wrap.appendChild(body);

  if(d.reply){
    const rep=document.createElement('div');
    rep.style.marginTop='8px';
    rep.style.padding='10px';
    rep.style.borderRadius='10px';
    rep.style.background='rgba(255,255,255,.06)';
    rep.innerHTML=`<strong>Owner Reply:</strong><div style="margin-top:6px">${d.reply}</div>`;
    wrap.appendChild(rep);
  }

  if(isAdmin){
    const row=document.createElement('div');
    row.style.marginTop='8px'; row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center';
    const input=document.createElement('input');
    input.className='input'; input.placeholder='Tulis balasan...';
    const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Balas';
    btn.onclick=async ()=>{
      const t=input.value.trim(); if(!t) return alert('Isi balasan dulu');
      await db.collection('comments').doc(doc.id).update({reply:t});
      input.value='';
    };
    row.appendChild(input); row.appendChild(btn); wrap.appendChild(row);
  }

  commentsList.appendChild(wrap);
}

db.collection('comments').orderBy('ts','asc').onSnapshot(snap=>{
  commentsList.innerHTML='';
  snap.forEach(renderOne);
  commentsList.scrollTop=commentsList.scrollHeight;
});

formEl.addEventListener('submit',async (ev)=>{
  ev.preventDefault();
  const name=(nameEl.value||'').trim().slice(0,32);
  const msg=(msgEl.value||'').trim().slice(0,300);
  if(!name || !msg) return;
  await db.collection('comments').add({name,msg,ts: firebase.firestore.FieldValue.serverTimestamp()});
  formEl.reset();
});

/* ===== Secret Q&A + Login (SHA-256) ===== */
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

const questionsPool=[
  "Eh ini bukan tombol apa2 loh udah balik aja",
  "Lah kok masih dipencet?",
  "Napa di pencet?",
  "Ku bilang jangan di pencet!!!",
  "Dey?!, ku cakap jangan di pencet laa",
  "Kamu yakin mau lanjut? (ga ada apa2 beneran)",
  "Masih mau? balik aja deh",
  "Serius? Ini beneran ga ada apa-apa",
  "Kok kepo sih, balik aja",
  "Iya berhenti, ini beneran ga ada apa2"
];
function pickRandomQuestions(n=5){
  const arr=[...questionsPool], out=[];
  for(let i=0;i<n;i++){ const j=Math.floor(Math.random()*arr.length); out.push(arr.splice(j,1)[0]); }
  return out;
}
let secretQuestions=[], secretIndex=0;

stillHere.addEventListener('click',()=>{
  secretQuestions=pickRandomQuestions(5);
  secretIndex=0;
  showQuestion(secretQuestions[secretIndex]);
});
function showQuestion(q){
  modalTitle.textContent='Yakinkan dulu';
  modalBody.textContent=q;
  modalBackdrop.style.display='flex';
}
modalNo.addEventListener('click',()=>{ modalBackdrop.style.display='none'; });
modalYes.addEventListener('click',()=>{
  secretIndex++;
  if(secretIndex<secretQuestions.length){
    showQuestion(secretQuestions[secretIndex]);
  }else{
    modalBackdrop.style.display='none';
    loginBackdrop.style.display='flex';
  }
});
loginCancel.addEventListener('click',()=>{ loginBackdrop.style.display='none'; });

/* Enkripsi login:
   username: Keyzzz1
   password: Alhaarith123
   Kami simpan HASH saja (SHA-256 dari "username:password") */
const ADMIN_HASH_FINAL = CryptoJS.SHA256("Keyzzz1:Alhaarith123").toString();

loginSubmit.addEventListener('click',()=>{
  const u=(loginUser.value||'').trim();
  const p=(loginPass.value||'').trim();
  if(!u||!p){ loginMsg.textContent='Isi username & password'; loginMsg.style.color='#ffdca8'; return;}
  const attempt=CryptoJS.SHA256(u+':'+p).toString();
  if(attempt===ADMIN_HASH_FINAL){
    isAdmin=true; localStorage.setItem('isAdmin','1');
    loginMsg.style.color='#9cffb7'; loginMsg.textContent='Login sukses — mode admin aktif';
    loginBackdrop.style.display='none';
    // re-render agar tombol balas muncul
    db.collection('comments').orderBy('ts','asc').get().then(snap=>{
      commentsList.innerHTML=''; snap.forEach(renderOne);
    });
  }else{
    loginMsg.style.color='#ff9f9f'; loginMsg.textContent='Salah username/password';
  }
});

/* Safety position for player on resize */
function adjustMusicPosition(){
  if(window.innerWidth>1024){
    musicDock.style.top='16px'; musicDock.style.right='12px';
  }else{
    musicDock.style.top='16px'; musicDock.style.right='12px';
  }
}
window.addEventListener('resize',adjustMusicPosition);
adjustMusicPosition();
