/**
 * Password Hash Lab Logic
 * Upgraded to support SHA-256 and PBKDF2 (Native Alternative to Bcrypt/Argon2)
 */

let currentAlgo = 'sha256';

// PBKDF2 Implementation
async function derivePBKDF2(password, salt = 'static-salt', iterations = 100000) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const saltBuffer = encoder.encode(salt);
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: iterations,
            hash: 'SHA-256'
        },
        passwordKey,
        256
    );

    return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Simple SHA-256
async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Master Hashing Function
async function hashPassword(password, salt = '') {
    if (currentAlgo === 'pbkdf2') {
        return await derivePBKDF2(password, salt || 'default-salt');
    }
    return await sha256(password + salt);
}

// Module 1: Live Hashing & Algo Switcher
const plainInput = document.getElementById('plain-input');
const hashOutput = document.getElementById('hash-output');
const algoTabs = document.querySelectorAll('.algo-tab');
const algoExplanation = document.getElementById('algo-explanation');

algoTabs.forEach(tab => {
    tab.addEventListener('click', async () => {
        algoTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentAlgo = tab.getAttribute('data-algo');

        if (currentAlgo === 'pbkdf2') {
            algoExplanation.innerHTML = `<strong>PBKDF2:</strong> Similar to Bcrypt/Argon2. We use <strong>100,000 iterations</strong>. This makes hashing "slow" on purpose to stop hackers from trying billions of passwords per second.`;
        } else {
            algoExplanation.innerHTML = `<strong>SHA-256:</strong> Fast and efficient, but easily cracked via Brute Force because it's *too* fast for modern GPUs.`;
        }

        // Trigger re-hash
        const hash = await hashPassword(plainInput.value);
        hashOutput.textContent = hash || '...';
    });
});

plainInput.addEventListener('input', async (e) => {
    const hash = await hashPassword(e.target.value);
    hashOutput.textContent = hash || '...';
});

// Module 2: Salting
const regenBtn = document.getElementById('regen-salts');
const commonPass = "password123";

async function updateSalts() {
    const saltA = Math.random().toString(36).substring(2, 10);
    const saltB = Math.random().toString(36).substring(2, 10);

    document.getElementById('salt-a').value = saltA;
    document.getElementById('salt-b').value = saltB;

    const hashA = await hashPassword(commonPass, saltA);
    const hashB = await hashPassword(commonPass, saltB);

    document.getElementById('hash-a').textContent = hashA;
    document.getElementById('hash-b').textContent = hashB;
}

regenBtn.addEventListener('click', updateSalts);

// Module 3: Authentication Simulator (Hardcoded to PBKDF2 for security demo)
const mockDb = [
    { username: 'admin', salt: 'x8y2', hash: '' },
    { username: 'user1', salt: 'k9p3', hash: '' }
];

async function initDb() {
    // We'll store PBKDF2 hashes in the DB for the simulation
    mockDb[0].hash = await derivePBKDF2('password123', mockDb[0].salt);
    mockDb[1].hash = await derivePBKDF2('supersecret', mockDb[1].salt);

    renderDb();
}

function renderDb() {
    const dbView = document.getElementById('db-view');
    dbView.innerHTML = `
        <div class="db-row" style="font-weight: bold; border-bottom: 2px solid var(--border)">
            <span>User</span>
            <span>Salt</span>
            <span>PBKDF2 Hash</span>
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
    loginStatus.innerHTML = '<span style="color: var(--text-muted);">Verifying... (Computing iterations)</span>';
    const input = loginPass.value;
    const user = mockDb[0];

    // Always use PBKDF2 for the login demo to show the security
    const inputHash = await derivePBKDF2(input, user.salt);

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
