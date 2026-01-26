import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// === KONFIGURASI FIREBASE ===
const appId = typeof __app_id !== 'undefined' ? __app_id : 'portfolio-keyzan';
const firebaseConfig = JSON.parse(__firebase_config);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let user = null;

// === INISIALISASI ===
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initAuth();
    updateClock();
    setInterval(updateClock, 1000);
});

// === OTENTIKASI ===
async function initAuth() {
    try {
        await signInAnonymously(auth);
    } catch (e) { console.error("Auth error", e); }
}

onAuthStateChanged(auth, (u) => { 
    user = u; 
    if(u) loadComments(); 
});

// === SISTEM KOMENTAR (GUESTBOOK) ===
function loadComments() {
    if (!user) return;
    const qRef = collection(db, 'artifacts', appId, 'public', 'data', 'comments');
    onSnapshot(qRef, (snapshot) => {
        const list = document.getElementById('commentsList');
        const count = document.getElementById('commentCount');
        if (!list) return;

        let docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        
        // Urutkan berdasarkan waktu di memori
        docs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        
        count.textContent = docs.length;
        list.innerHTML = docs.map(d => `
            <div class="p-6 bg-zinc-50 rounded-[30px] border border-zinc-100">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-sm text-black">${d.name}</span>
                    <span class="text-[10px] opacity-40 uppercase text-zinc-500">${d.timestamp ? new Date(d.timestamp.seconds*1000).toLocaleDateString() : 'Baru saja'}</span>
                </div>
                <p class="text-zinc-600 text-sm leading-relaxed">${d.message}</p>
            </div>
        `).join('');
        
        if(!docs.length) list.innerHTML = '<p class="text-zinc-400 text-sm italic">Belum ada pesan.</p>';
    }, (err) => console.error("Firestore Error:", err));
}

const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!user) return;
        const name = document.getElementById('cName').value;
        const msg = document.getElementById('cMsg').value;
        
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), {
                name,
                message: msg,
                timestamp: serverTimestamp()
            });
            commentForm.reset();
        } catch (e) {
            console.error("Error adding comment", e);
        }
    });
}

// === FITUR JAM ===
function updateClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// === PEMUTAR MUSIK (VISUAL) ===
// Simple playlist player with prev/next/volume controls. Uses the <audio> element added to the page.
const PLAYLIST = [
    { src: 'audio/about-you.mp3', title: 'About You', artist: 'The 1975', cover: 'image/about-you.jpeg' },
    { src: 'audio/No. 1 Party Anthem.mp3', title: 'No. 1 Party Anthem', artist: 'Various', cover: 'image/download.jpeg' },
    { src: 'audio/sekin.mp3', title: 'Sekin', artist: 'Unknown', cover: 'image/project.png' }
];

const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const coverImg = document.getElementById('coverImg');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');

let currentTrack = 0;

function updatePlayIcon(playing) {
    if (!playBtn) return;
    playBtn.innerHTML = playing ? '<i data-lucide="pause" class="w-5 h-5 fill-current"></i>' : '<i data-lucide="play" class="w-5 h-5 fill-current"></i>';
    lucide.createIcons();
}

function loadTrack(i) {
    currentTrack = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    const t = PLAYLIST[currentTrack];
    if (audio) {
        audio.src = encodeURI(t.src);
        audio.load();
    }
    if (coverImg) coverImg.src = t.cover || 'https://via.placeholder.com/48';
    if (trackTitle) trackTitle.textContent = t.title || '';
    if (trackArtist) trackArtist.textContent = t.artist || '';
    updatePlayIcon(false);
}

if (volumeSlider && audio) {
    audio.volume = parseFloat(volumeSlider.value || 0.8);
    volumeSlider.addEventListener('input', () => { audio.volume = parseFloat(volumeSlider.value); });
}

if (playBtn && audio) {
    playBtn.addEventListener('click', async () => {
        try {
            if (audio.paused) {
                await audio.play();
                updatePlayIcon(true);
                coverImg?.classList?.add('animate-spin-slow');
            } else {
                audio.pause();
                updatePlayIcon(false);
                coverImg?.classList?.remove('animate-spin-slow');
            }
        } catch (e) { console.warn('Play error', e); }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        loadTrack(currentTrack - 1);
        audio?.play().then(() => updatePlayIcon(true)).catch(()=>{});
        coverImg?.classList?.add('animate-spin-slow');
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        loadTrack(currentTrack + 1);
        audio?.play().then(() => updatePlayIcon(true)).catch(()=>{});
        coverImg?.classList?.add('animate-spin-slow');
    });
}

if (audio) {
    audio.addEventListener('ended', () => {
        loadTrack(currentTrack + 1);
        audio.play().catch(()=>{});
    });
}

// Initialize first track (if audio element exists)
if (audio && PLAYLIST.length) loadTrack(0);

// === LOGIN ADMIN (CRYPTOJS) ===
const ADMIN_HASH = "e0a495a5eea47a155bc76370d16bbfd7f3a9d5fff753f1f601f22b7365471024"; 
const stillHere = document.getElementById('stillHere');
const loginBackdrop = document.getElementById('loginBackdrop');

if (stillHere) {
    stillHere.addEventListener('click', () => {
        loginBackdrop.classList.remove('hidden');
        loginBackdrop.classList.add('flex');
    });
}

document.getElementById('loginCancel')?.addEventListener('click', () => {
    loginBackdrop.classList.add('hidden');
    loginBackdrop.classList.remove('flex');
});

document.getElementById('loginSubmit')?.addEventListener('click', () => {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    const hash = CryptoJS.SHA256(u + ':' + p).toString();
    
    if (hash === ADMIN_HASH) {
        window.location.href = "projects.html";
    } else {
        const msg = document.getElementById('loginMsg');
        if (msg) msg.textContent = "Akses ditolak. Coba lagi.";
    }
});
