// script.js - Password Hashing Lab

let currentSalt = null;
let currentHash = null;

// Helper: SHA-256
async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: hex to bytes
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i*2, 2), 16);
    }
    return bytes;
}

// Basic hashing (no salt)
async function hashBasic() {
    const password = document.getElementById('basicPass').value.trim();
    if (!password) {
        alert("Please enter a password");
        return;
    }
    
    const hash = await sha256(password);
    const resultDiv = document.getElementById('basicResult');
    resultDiv.innerHTML = `
        <strong>Input Password:</strong> ${password}<br><br>
        <strong>SHA-256 Hash:</strong><br>
        <code>${hash}</code><br><br>
        <em>Try the same password again — the hash stays the same (vulnerable)</em>
    `;
    resultDiv.className = "result";
}

// Rainbow table simulation
async function simulateRainbow() {
    const commonPasswords = ["password123", "admin", "qwerty", "letmein", "123456", "password", "abc123"];
    const target = document.getElementById('commonPass').value.trim() || "password123";
    
    const resultDiv = document.getElementById('rainbowResult');
    let html = `<strong>🔍 Simulated Rainbow Table Attack</strong><br><br>`;
    
    for (let pass of commonPasswords) {
        const hash = await sha256(pass);
        html += `<strong>${pass}</strong> → ${hash.substring(0, 24)}...<br>`;
    }
    
    const targetHash = await sha256(target);
    html += `<br><span style="color:#e74c3c"><strong>✅ Target "${target}" FOUND in rainbow table!</strong></span><br>`;
    html += `Hash: ${targetHash}`;
    
    resultDiv.innerHTML = html;
    resultDiv.className = "result";
}

// Secure hashing with PBKDF2 + salt
async function hashSecure() {
    const password = document.getElementById('securePass').value.trim();
    if (!password) {
        alert("Please enter a password");
        return;
    }
    
    // Random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), 
        { name: "PBKDF2" }, false, ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    currentSalt = saltHex;
    currentHash = hashHex;
    
    const resultDiv = document.getElementById('secureResult');
    resultDiv.innerHTML = `
        <strong>Password:</strong> ${password}<br>
        <strong>Salt (hex):</strong> ${saltHex}<br><br>
        <strong>PBKDF2-SHA256 Hash:</strong><br>
        <code>${hashHex}</code><br><br>
        <em>Hash the same password again → you'll get a different salt and hash every time!</em>
    `;
    resultDiv.className = "result";
    
    // Update stored info
    document.getElementById('storedInfo').innerHTML = `
        <strong>Stored in DB:</strong><br>
        Salt: ${saltHex.substring(0, 16)}... <br>
        Hash: ${hashHex.substring(0, 16)}...
    `;
}

// Login verification
async function verifyLogin() {
    const provided = document.getElementById('loginPass').value.trim();
    const resultDiv = document.getElementById('verifyResult');
    
    if (!currentSalt || !currentHash) {
        resultDiv.innerHTML = "❗ Please generate a secure hash first in Section 4.";
        resultDiv.className = "result error";
        return;
    }
    
    if (!provided) {
        resultDiv.innerHTML = "Please enter a password";
        resultDiv.className = "result error";
        return;
    }
    
    const saltBytes = hexToBytes(currentSalt);
    
    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(provided), 
        { name: "PBKDF2" }, false, ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: saltBytes,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (computedHash === currentHash) {
        resultDiv.innerHTML = `✅ <strong>Login Successful!</strong><br><br>Welcome back! The password matched the stored hash.`;
        resultDiv.className = "result success";
    } else {
        resultDiv.innerHTML = `❌ <strong>Login Failed!</strong><br><br>Incorrect password.`;
        resultDiv.className = "result error";
    }
}

// Single Section Navigation - Show only one section at a time
function navigateTo(sectionId) {
    // Hide all sections
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Scroll to top of the section
        selectedSection.scrollIntoView({ behavior: "smooth" });
    }
    
    // Highlight active nav item (optional visual feedback)
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(`'${sectionId}'`)) {
            link.classList.add('active');
        }
    });
}

// Auto demo
window.onload = () => {
    console.log("%c✅ Password Hashing Lab loaded successfully for presentation!", "color: #27ae60; font-size: 16px; font-weight: bold");
    
    // Show only Intro section by default
    navigateTo('intro');
    
    // Optional: Pre-fill basic demo
    setTimeout(() => {
        document.getElementById('basicPass').value = "MySecretPass123";
    }, 800);
};