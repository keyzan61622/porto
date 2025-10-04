// @ts-nocheck
/* ========= UTIL ========= */
function $(s, r = document) { return r.querySelector(s); }
function $all(s, r = document) { return Array.from(r.querySelectorAll(s)); }

/* ========= CLOCK ========= */
function updateClock() {
  var now = new Date();
  var opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' };
  var el = $('#clock');
  if (el) el.textContent = new Intl.DateTimeFormat('id-ID', opts).format(now);
}
updateClock(); setInterval(updateClock, 10000);

/* ========= DOTS NAV ========= */
var snapper = $('.snapper');
var dots = $all('#dots a');
var panels = $all('.panel');

var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (en.isIntersecting) {
      var id = en.target.id;
      dots.forEach(function (a) { a.classList.toggle('active', a.dataset.target === id); });
    }
  });
}, { root: snapper, threshold: 0.55 });

panels.forEach(function (p) { io.observe(p); });
dots.forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    var t = document.getElementById(a.dataset.target);
    if (t) snapper.scrollTo({ top: t.offsetTop, behavior: 'smooth' });
  });
});

/* ========= MUSIC PLAYER ========= */
var audio = $('#audio');
var ppBtn = $('#pp');
var seek = $('#seek');
var vol = $('#vol');
var curEl = $('#cur');
var durEl = $('#dur');
var coverImg = $('#coverImg');
var prevBtn = $('#prevBtn');
var nextBtn = $('#nextBtn');
var shuffleBtn = $('#shuffleBtn');
var toggleDockBtn = $('#toggleDock');
var musicDock = $('#musicDock');
var metaTitle = $('#metaTitle');
var metaArtist = $('#metaArtist');

var playlist = [
  { title: 'About You', artist: 'The 1975', src: 'audio/about-you.mp3', cover: 'image/about-you.jpeg' },
  { title: 'Track 2', artist: 'Unknown', src: 'audio/track2.mp3', cover: 'image/about-you.jpeg' },
  { title: 'Track 3', artist: 'Unknown', src: 'audio/track3.mp3', cover: 'image/about-you.jpeg' },
  { title: 'Track 4', artist: 'Unknown', src: 'audio/track4.mp3', cover: 'image/about-you.jpeg' },
  { title: 'Track 5', artist: 'Unknown', src: 'audio/track5.mp3', cover: 'image/about-you.jpeg' },
  { title: 'Track 6', artist: 'Unknown', src: 'audio/track6.mp3', cover: 'image/about-you.jpeg' }
];

var idx = 0;
var isShuffle = false;
var shuffledOrder = [];

function loadTrack(i) {
  if (i < 0) i = playlist.length - 1;
  if (i >= playlist.length) i = 0;
  idx = i;
  var t = playlist[idx];
  audio.src = t.src;
  coverImg.src = t.cover || 'image/about-you.jpeg';
  metaTitle.textContent = t.title;
  metaArtist.textContent = t.artist;
}

function fmt(sec) {
  if (!isFinite(sec)) return '0:00';
  var m = Math.floor(sec / 60);
  var s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' + s : s);
}

function makeShuffle() {
  shuffledOrder = playlist.map(function (_, i) { return i; }).filter(function (i) { return i !== idx; });
  for (var i = shuffledOrder.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffledOrder[i]; shuffledOrder[i] = shuffledOrder[j]; shuffledOrder[j] = tmp;
  }
}

function nextTrack() {
  if (isShuffle) {
    if (shuffledOrder.length === 0) makeShuffle();
    idx = shuffledOrder.shift();
  } else idx++;
  loadTrack(idx); audio.play(); ppBtn.textContent = '⏸';
}
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  idx--; loadTrack(idx); audio.play(); ppBtn.textContent = '⏸';
}

audio.addEventListener('loadedmetadata', function () {
  durEl.textContent = fmt(audio.duration);
  seek.max = Math.max(1, audio.duration || 1);
});
audio.addEventListener('timeupdate', function () {
  curEl.textContent = fmt(audio.currentTime);
  if (!seek.dragging) seek.value = audio.currentTime;
});
audio.addEventListener('ended', nextTrack);

seek.addEventListener('input', function () { seek.dragging = true; });
seek.addEventListener('change', function () {
  audio.currentTime = Number(seek.value) || 0;
  seek.dragging = false;
});
vol.addEventListener('input', function () { audio.volume = Number(vol.value); });

ppBtn.addEventListener('click', function () {
  if (audio.paused) { audio.play(); ppBtn.textContent = '⏸'; }
  else { audio.pause(); ppBtn.textContent = '▶'; }
});
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
shuffleBtn.addEventListener('click', function () {
  isShuffle = !isShuffle;
  shuffleBtn.style.background = isShuffle ? 'rgba(10,132,255,.24)' : 'rgba(255,255,255,.08)';
  if (isShuffle) makeShuffle();
});
toggleDockBtn.addEventListener('click', function () {
  musicDock.classList.toggle('mini');
  toggleDockBtn.textContent = musicDock.classList.contains('mini') ? '▢' : '—';
});

loadTrack(0);
if (window.innerWidth <= 640) musicDock.style.top = '16px';
window.addEventListener('resize', function () {
  musicDock.style.top = (window.innerWidth <= 640 ? '16px' : '12px');
});

/* ========= FIREBASE (COMMENTS + REPLIES) ========= */
// pastikan index.html sudah memuat firebase compat
var firebaseConfig = {
  apiKey: "AIzaSyD_9VpfQdqoTNwwF8fYY37OaQ42Ag6ImEE",
  authDomain: "call-3de3b.firebaseapp.com",
  projectId: "call-3de3b",
  storageBucket: "call-3de3b.firebasestorage.app",
  messagingSenderId: "540758179959",
  appId: "1:540758179959:web:b4201c873e3d639a160672",
  measurementId: "G-J2P0KEWSRT"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

var formEl = $('#commentForm');
var nameEl = $('#cName');
var msgEl = $('#cMsg');
var commentsList = $('#commentsList');

var isAdmin = (localStorage.getItem('isAdmin') === '1');

function renderReply(replyText) {
  var rep = document.createElement('div');
  rep.style.marginTop = '8px';
  rep.style.padding = '10px';
  rep.style.borderRadius = '10px';
  rep.style.background = 'rgba(255,255,255,.10)';
  rep.innerHTML = '<strong>Owner Reply:</strong><div style="margin-top:6px">' + replyText + '</div>';
  return rep;
}

function renderComment(doc) {
  var d = doc.data();
  var wrap = document.createElement('div'); wrap.className = 'comment';
  var meta = document.createElement('div'); meta.className = 'meta';
  var when = (d.ts && d.ts.toDate) ? d.ts.toDate().toLocaleString('id-ID', { hour12: false }) : '';
  meta.textContent = '@' + d.name + ' • ' + when;
  var body = document.createElement('div'); body.textContent = d.msg;
  wrap.appendChild(meta); wrap.appendChild(body);

  // load reply
  db.collection('replies').doc(doc.id).get().then(function (s) {
    if (s.exists && s.data().text) wrap.appendChild(renderReply(s.data().text));
  });

  if (isAdmin) {
    var row = document.createElement('div');
    row.style.marginTop = '8px'; row.style.display = 'flex'; row.style.gap = '8px';
    var input = document.createElement('input'); input.className = 'input'; input.placeholder = 'Tulis balasan...';
    var btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = 'Balas';
    btn.onclick = function () {
      var reply = (input.value || '').trim();
      if (!reply) return;
      db.collection('replies').doc(doc.id).set({
        text: reply,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () { input.value = ''; });
    };
    row.appendChild(input); row.appendChild(btn); wrap.appendChild(row);
  }

  commentsList.appendChild(wrap);
}

db.collection('comments').orderBy('ts', 'asc').onSnapshot(function (snap) {
  commentsList.innerHTML = '';
  snap.forEach(function (doc) { renderComment(doc); });
  commentsList.scrollTop = commentsList.scrollHeight;
});

if (formEl) {
  formEl.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = (nameEl.value || '').trim().slice(0, 32);
    var msg = (msgEl.value || '').trim().slice(0, 300);
    if (!name || !msg) return;
    db.collection('comments').add({
      name: name,
      msg: msg,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () { formEl.reset(); });
  });
}

/* ========= SECRET LOGIN (Q&A + SHA-256) ========= */
// butuh CryptoJS di index.html
var stillHere = $('#stillHere');
var modalBackdrop = $('#modalBackdrop');
var modalTitle = $('#modalTitle');
var modalBody = $('#modalBody');
var modalYes = $('#modalYes');
var modalNo = $('#modalNo');

var loginBackdrop = $('#loginBackdrop');
var loginUser = $('#loginUser');
var loginPass = $('#loginPass');
var loginSubmit = $('#loginSubmit');
var loginCancel = $('#loginCancel');
var loginMsg = $('#loginMsg');

var questionsPool = [
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
function pickRandomQuestions(n) {
  var arr = questionsPool.slice(), out = [], i, j;
  for (i = 0; i < n; i++) { j = Math.floor(Math.random() * arr.length); out.push(arr.splice(j, 1)[0]); }
  return out;
}
var seq = [], qi = 0;

function showQ(q) {
  modalTitle.textContent = 'Yakinkan dulu';
  modalBody.innerHTML = '<div class="muted">' + q + '</div>';
  modalBackdrop.style.display = 'flex';
}

if (stillHere) {
  stillHere.addEventListener('click', function () {
    seq = pickRandomQuestions(5); qi = 0; showQ(seq[qi]);
  });
}
if (modalNo) modalNo.addEventListener('click', function () { modalBackdrop.style.display = 'none'; });
if (modalYes) modalYes.addEventListener('click', function () {
  qi++;
  if (qi < seq.length) showQ(seq[qi]);
  else { modalBackdrop.style.display = 'none'; loginBackdrop.style.display = 'flex'; }
});

if (loginCancel) loginCancel.addEventListener('click', function () { loginBackdrop.style.display = 'none'; });

var ADMIN_HASH_HEX = "e0a495a5eea47a155bc76370d16bbfd7f3a9d5fff753f1f601f22b7365471024"; // SHA-256("Keyzzz1:Alhaarith123")

if (loginSubmit) {
  loginSubmit.addEventListener('click', function () {
    var u = (loginUser.value || '').trim();
    var p = (loginPass.value || '').trim();
    if (!u || !p) { loginMsg.textContent = 'Isi username & password'; return; }
    var attempt = CryptoJS.SHA256(u + ':' + p).toString();
    if (attempt === ADMIN_HASH_HEX) {
      isAdmin = true; localStorage.setItem('isAdmin', '1');
      loginMsg.style.color = '#9be29b'; loginMsg.textContent = 'Login sukses — mode admin aktif.';
      setTimeout(function () { loginBackdrop.style.display = 'none'; }, 700);
    } else {
      loginMsg.style.color = '#ffb4b4'; loginMsg.textContent = 'Salah username/password';
    }
  });
}
