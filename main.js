/**
 * Password Hash Lab Logic
 * Using Web Crypto API for high-performance hashing.
 */

// Utility: Hash a string using SHA-256
async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Module 1: Live Hashing
const plainInput = document.getElementById('plain-input');
const hashOutput = document.getElementById('hash-output');

plainInput.addEventListener('input', async (e) => {
    const hash = await sha256(e.target.value);
    hashOutput.textContent = hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
});

// Module 2: Salting
const regenBtn = document.getElementById('regen-salts');
const commonPass = "password123";

async function updateSalts() {
    const saltA = Math.random().toString(36).substring(2, 10);
    const saltB = Math.random().toString(36).substring(2, 10);
    
    document.getElementById('salt-a').value = saltA;
    document.getElementById('salt-b').value = saltB;
    
    const hashA = await sha256(commonPass + saltA);
    const hashB = await sha256(commonPass + saltB);
    
    document.getElementById('hash-a').textContent = hashA;
    document.getElementById('hash-b').textContent = hashB;
}

regenBtn.addEventListener('click', updateSalts);

// Module 3: Authentication Simulator
const mockDb = [
    { username: 'admin', salt: 'x8y2', hash: '' },
    { username: 'user1', salt: 'k9p3', hash: '' }
];

async function initDb() {
    // We'll "store" the hash for 'password123' for admin
    mockDb[0].hash = await sha256('password123' + mockDb[0].salt);
    mockDb[1].hash = await sha256('supersecret' + mockDb[1].salt);
    
    renderDb();
}

function renderDb() {
    const dbView = document.getElementById('db-view');
    dbView.innerHTML = `
        <div class="db-row" style="font-weight: bold; border-bottom: 2px solid var(--border)">
            <span>User</span>
            <span>Salt</span>
            <span>Hashed Password</span>
        </div>
    `;
    mockDb.forEach(user => {
        dbView.innerHTML += `
            <div class="db-row">
                <span>${user.username}</span>
                <span style="color: var(--accent)">${user.salt}</span>
                <span style="color: var(--text-muted); font-size: 0.6rem;">${user.hash.substring(0, 20)}...</span>
            </div>
        `;
    });
}

const loginBtn = document.getElementById('btn-login');
const loginPass = document.getElementById('login-pass');
const loginStatus = document.getElementById('login-status');

loginBtn.addEventListener('click', async () => {
    const input = loginPass.value;
    const user = mockDb[0]; // Testing against admin
    
    // THE CORE LOGIC: Salt the input, hash it, compare to stored hash
    const inputHash = await sha256(input + user.salt);
    
    if (inputHash === user.hash) {
        loginStatus.innerHTML = '<span class="status-badge status-valid">ACCESS GRANTED</span>';
        loginStatus.style.color = 'var(--success)';
    } else {
        loginStatus.innerHTML = '<span class="status-badge status-invalid">ACCESS DENIED</span>';
        loginStatus.style.color = 'var(--error)';
    }
});

// Module 4: Rainbow Table Visualization
const rainbowViz = document.getElementById('rainbow-table-viz');
const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'admin', 'welcome', 'login', 'letmein'];

async function startRainbowSimulation() {
    let i = 0;
    setInterval(async () => {
        const pass = commonPasswords[Math.floor(Math.random() * commonPasswords.length)];
        const hash = await sha256(pass);
        const entry = document.createElement('div');
        entry.style.opacity = '0.7';
        entry.innerHTML = `[MATCH] ${pass} &rarr; ${hash.substring(0, 32)}...`;
        rainbowViz.prepend(entry);
        
        if (rainbowViz.childNodes.length > 10) {
            rainbowViz.removeChild(rainbowViz.lastChild);
        }
    }, 1000);
}

// Navigation Logic
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.lab-section');

function switchSection(targetId) {
    if (!targetId) return;
    
    // Support both ID and Hash (#ID)
    const id = targetId.startsWith('#') ? targetId.substring(1) : targetId;
    
    // Update Nav Links
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-target') === id);
    });
    
    // Update Sections
    sections.forEach(section => {
        section.classList.toggle('active', section.id === id);
    });

    // Update URL hash without jumping if possible, or just let it update
    if (window.location.hash !== '#' + id) {
        history.pushState(null, null, '#' + id);
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        switchSection(targetId);
    });
});

// Handle Back/Forward buttons and direct links
window.addEventListener('hashchange', () => {
    switchSection(window.location.hash);
});

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
    updateSalts();
    initDb();
    startRainbowSimulation();

    // Persist state: Check URL hash first, then default to hashing
    const currentHash = window.location.hash;
    if (currentHash && document.querySelector(currentHash)) {
        switchSection(currentHash);
    } else {
        switchSection('module-hashing');
    }
});
