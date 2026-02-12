// js/auth.js
// ======================= AUTH GLOBALS & LOGIN =======================
window.authToken = null;
window.currentUser = null;
window.firmId = 0;
window.firmImageBase64 = null;

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const loginApiBase = document.getElementById('loginApiBase');
const appBaseInput = document.getElementById('appBaseApiInput');
const appDateInput = document.getElementById('appDateInput');

// Helper
function hideError(cont) { cont?.classList.add('hidden'); cont.innerHTML = ''; }
function showError(cont, msg) { if (cont) { cont.classList.remove('hidden'); cont.innerHTML = `<div class="error-message"><i class="fas fa-circle-exclamation"></i> ${msg}</div>`; } }

// LOGIN
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const apiBase = loginApiBase.value.trim();
    if (!username || !password) { showError(loginError, 'Username and password required'); return; }
    if (!apiBase) { showError(loginError, 'API base URL required'); return; }
    hideError(loginError);
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;
    try {
        const response = await fetch('https://localhost:7193/api/Users/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!json.success) throw new Error(json.message || 'Login failed');

        window.authToken = json.token;
        window.currentUser = json.user;
        window.firmId = json.user.firmId || 0;
        window.firmImageBase64 = json.user.imageBase64 || null;

        // set base URL into main app readonly field
        appBaseInput.value = apiBase;

        document.getElementById('firmNameDisplay').innerText = json.user.firmName || 'Cash Book & Ledger';
        document.getElementById('userNameDisplay').innerHTML = `<i class="fas fa-user"></i> ${json.user.username || username}`;
        document.getElementById('firmAddressDisplay').innerHTML = `<i class="fas fa-map-pin"></i> ${json.user.address || ''}`;
        document.getElementById('headerUsername').innerText = json.user.username || username;
        document.getElementById('userAvatar').innerText = (json.user.username || 'AD').substring(0,2).toUpperCase();

        loginScreen.style.display = 'none';
        appScreen.style.display = 'block';

        // Set default dates
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        appDateInput.value = todayStr;

        // load default cashbook panel
        window.loadCashbookPanel();
        window.setActiveMenu('cashbook');
    } catch (err) { showError(loginError, err.message || 'Login error'); }
    finally { loginBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Login'; loginBtn.disabled = false; }
}

function handleLogout() {
    window.authToken = null; window.currentUser = null;
    appScreen.style.display = 'none';
    loginScreen.style.display = 'block';
    hideError(loginError);
}

// menu activation and global state
window.setActiveMenu = function(menuId) {
    const menuCashbook = document.getElementById('menuCashbook');
    const menuLedger = document.getElementById('menuLedger');
    const menuInvoice = document.getElementById('menuInvoice');
    [menuCashbook, menuLedger, menuInvoice].forEach(b => b?.classList.remove('active'));

    if (menuId === 'cashbook') {
        menuCashbook?.classList.add('active');
        window.loadCashbookPanel();
    } else if (menuId === 'ledger') {
        menuLedger?.classList.add('active');
        window.loadLedgerPanel();
    } else if (menuId === 'invoice') {
        menuInvoice?.classList.add('active');
        window.loadInvoicePanel();
    }
};

// event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
document.getElementById('username')?.addEventListener('keypress', e => { if(e.key === 'Enter') handleLogin(); });
document.getElementById('password')?.addEventListener('keypress', e => { if(e.key === 'Enter') handleLogin(); });
document.getElementById('menuCashbook')?.addEventListener('click', () => window.setActiveMenu('cashbook'));
document.getElementById('menuLedger')?.addEventListener('click', () => window.setActiveMenu('ledger'));
document.getElementById('menuInvoice')?.addEventListener('click', () => window.setActiveMenu('invoice'));

// date change for cashbook
appDateInput?.addEventListener('change', () => {
    if (document.getElementById('cashbookPanel')?.style.display !== 'none') window.fetchCashbookData();
});

window.formatMoney = function(amt) {
    if (amt === null || amt === undefined) return '0';
    return Number(amt).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};