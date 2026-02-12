// js/ledger.js
// ======================= LEDGER =======================
// Enhanced with TREE VIEW: Type → Category → Party with subtotals
// Parties filter list fetched from static API endpoint
window.loadLedgerPanel = function() {
    const main = document.getElementById('mainContentPanel');
    main.innerHTML = `
        <div id="ledgerPanel">
            <div class="filter-bar">
                <div style="display: flex; gap: 16px; flex-wrap: wrap; width: 100%;">
                    <div class="filter-group">
                        <i class="fas fa-calendar"></i>
                        <input type="date" id="fromDate" placeholder="From Date" value="2024-01-01">
                        <span style="margin: 0 6px; color: #8aaec2;">—</span>
                        <input type="date" id="toDate" placeholder="To Date" value="2027-01-01">
                    </div>
                    <div class="filter-group"><i class="fas fa-tag"></i><select id="partyNameSelect"><option value="">All Parties</option></select></div>
                    <div class="filter-group"><i class="fas fa-layer-group"></i><select id="partyTypeSelect"><option value="">All Types</option></select></div>
                    <div class="filter-group"><i class="fas fa-list"></i><select id="partyCategSelect"><option value="">All Categories</option></select></div>
                    <button id="applyLedgerFilter" class="btn-fetch"><i class="fas fa-filter"></i> Apply</button>
                </div>
            </div>

            <!-- STANDARD LEDGER SUMMARY (Opening/closing) -->
            <div id="ledgerSummaryBox" class="summary-grid" style="margin-bottom: 1.2rem; padding: 1.2rem;">
                <div class="summary-col">
                    <div class="summary-header">LEDGER SUMMARY</div>
                    <div class="summary-row"><span>Opening Balance</span><span id="openingBalance">Rs. 0</span></div>
                    <div class="summary-row"><span>Total Debit</span><span id="totalDebitLedger">Rs. 0</span></div>
                    <div class="summary-row"><span>Total Credit</span><span id="totalCreditLedger">Rs. 0</span></div>
                    <div class="summary-row"><span>Closing Balance</span><span id="closingBalance">Rs. 0</span></div>
                </div>
            </div>

            <!-- TREE VIEW: GROUP SUMMARY – by Type > Category > Party -->
            <div id="groupSummaryContainer" class="group-ledger-summary">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:0.5rem;">
                    <i class="fas fa-sitemap" style="color:#1a5f6e;"></i>
                    <h3 style="font-size:1.2rem; font-weight:600;">Ledger Tree (Type → Category → Party)</h3>
                </div>
                <div id="groupSummaryTableWrapper" style="max-height: 500px; overflow-y: auto; border-radius: 16px;">
                    <table class="group-summary-table" style="width:100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: #dbe9f0; z-index: 10;">
                            <tr>
                                <th style="padding: 12px; text-align: left;">Hierarchy</th>
                                <th style="padding: 12px; text-align: right;">Total Debit (₹)</th>
                                <th style="padding: 12px; text-align: right;">Total Credit (₹)</th>
                                <th style="padding: 12px; text-align: right;">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody id="groupSummaryBody">
                            <tr><td colspan="4" class="empty-state">Apply filter to load ledger tree</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <h2 style="font-size: 1.2rem; margin: 24px 0 16px;"><i class="fas fa-list-ul"></i> Ledger Transactions</h2>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Date</th><th>Party</th><th>Type</th><th>Category</th><th>Detail</th><th>Amount</th><th>Dr/Cr</th><th>Balance</th></tr></thead>
                    <tbody id="ledgerTableBody"><tr><td colspan="8" class="empty-state">Apply filter to load ledger data</td></tr></tbody>
                </table>
            </div>
            <div id="ledgerTotalCount" style="margin-top: 1rem;"></div>
        </div>
    `;
    // add listeners
    document.getElementById('applyLedgerFilter')?.addEventListener('click', window.fetchLedgerTransactions);
    // fetch filter options from static API
    window.fetchLedgerFilterOptions();
};

window.fetchLedgerFilterOptions = async function() {
    const base = document.getElementById('appBaseApiInput').value.trim().replace(/\/$/, '');
    if (!base) return;
    
    try {
        // Fetch parties from static API endpoint
        const partiesRes = await fetch(`${base}/parties/static-list`, { 
            headers: { 'Accept': 'application/json' } 
        });
        
        if (partiesRes.ok) {
            const partiesJson = await partiesRes.json();
            // Handle different response formats
            let parties = [];
            if (partiesJson.success && Array.isArray(partiesJson.data)) {
                parties = partiesJson.data;
            } else if (Array.isArray(partiesJson)) {
                parties = partiesJson;
            } else if (partiesJson.parties && Array.isArray(partiesJson.parties)) {
                parties = partiesJson.parties;
            }
            
            // Extract party names from objects or use strings directly
            const partyNames = parties.map(p => {
                if (typeof p === 'string') return p;
                if (p.partyName) return p.partyName;
                if (p.name) return p.name;
                return JSON.stringify(p);
            }).filter(p => p && p !== '');
            
            populateSelect('partyNameSelect', partyNames, 'All Parties');
        } else {
            console.warn('Parties static endpoint failed, fetching from filterOptions');
            // Fallback to filterOptions endpoint
            await fetchFilterOptionsFallback(base);
        }
        
        // Fetch types and categories from filterOptions endpoint
        await fetchTypesAndCategories(base);
        
    } catch(e) { 
        console.warn('Error fetching parties from static API:', e); 
        await fetchFilterOptionsFallback(base);
        await fetchTypesAndCategories(base);
    }
};

async function fetchFilterOptionsFallback(base) {
    try {
        const res = await fetch(`${base}/ledger/filterOptions`, { 
            headers: { 'Accept': 'application/json' } 
        });
        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
                if (json.data.parties) {
                    populateSelect('partyNameSelect', json.data.parties, 'All Parties');
                }
                if (json.data.types) {
                    populateSelect('partyTypeSelect', json.data.types, 'All Types');
                }
                if (json.data.categories) {
                    populateSelect('partyCategSelect', json.data.categories, 'All Categories');
                }
            }
        } else {
            fallbackLedgerOptions();
        }
    } catch(e) {
        console.warn('Filter options fallback failed', e);
        fallbackLedgerOptions();
    }
}

async function fetchTypesAndCategories(base) {
    try {
        const res = await fetch(`${base}/ledger/filterOptions`, { 
            headers: { 'Accept': 'application/json' } 
        });
        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
                if (json.data.types) {
                    populateSelect('partyTypeSelect', json.data.types, 'All Types');
                }
                if (json.data.categories) {
                    populateSelect('partyCategSelect', json.data.categories, 'All Categories');
                }
            }
        }
    } catch(e) {
        console.warn('Could not fetch types/categories', e);
    }
}

function fallbackLedgerOptions() {
    // Only populate if selects are empty
    if (document.getElementById('partyNameSelect')?.children.length <= 1) {
        populateSelect('partyNameSelect', ['Opening','Digitex Print','Ayesha Collection St#5','Al-Jannat Arts St#6','AR Collection St#4','M.Nadeem Arts St#4-5','Rida Center St#7','Hassan Arts St#5','Bin Ejaz Arts St#6','Manzoor Silk Rawalpindi','Rashid Silk Center Sakardu','Malik Clothe Mangorah','Sher Khan/Naem Khan Swaat','Akhtar Janimaz Swaat','New Qazi Silk Center Noshehra','Chaina Silk Chalaas Gilgit','S.B Collection St#5','Dasti Chq Meezan Fk'], 'All Parties');
    }
    if (document.getElementById('partyTypeSelect')?.children.length <= 1) {
        populateSelect('partyTypeSelect', ['MILLS', 'LOCAL DEBTORS', 'DASTI RECEIVABLES'], 'All Types');
    }
    if (document.getElementById('partyCategSelect')?.children.length <= 1) {
        populateSelect('partyCategSelect', ['ASSETS', 'LIABILITIES'], 'All Categories');
    }
}

function populateSelect(id, items, def) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Preserve the "All" option
    const currentValue = el.value;
    el.innerHTML = `<option value="">${def}</option>`;
    
    if (Array.isArray(items)) {
        // Filter out empty/null values and get unique
        const validItems = items.filter(i => i && i !== '' && i !== 'null' && i !== 'undefined');
        const unique = [...new Set(validItems)];
        
        // Sort alphabetically
        unique.sort((a, b) => String(a).localeCompare(String(b)));
        
        unique.forEach(i => { 
            if (i) {
                const option = new Option(i, i);
                el.appendChild(option);
            }
        });
    }
    
    // Restore previous selection if still valid
    if (currentValue && Array.from(el.options).some(opt => opt.value === currentValue)) {
        el.value = currentValue;
    }
}

window.fetchLedgerTransactions = async function() {
    const base = document.getElementById('appBaseApiInput').value.trim().replace(/\/$/, '');
    if (!base) { 
        const tbody = document.getElementById('ledgerTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty-state">API base missing</td></tr>`; 
        return; 
    }

    const from = document.getElementById('fromDate')?.value || '2024-01-01';
    const to = document.getElementById('toDate')?.value || '2027-01-01';
    const party = document.getElementById('partyNameSelect')?.value || '';
    const type = document.getElementById('partyTypeSelect')?.value || '';
    const category = document.getElementById('partyCategSelect')?.value || '';

    let url = `${base}/account-ledger/transactions?fromDate=${from}&toDate=${to}`;
    if (party) url += `&partyName=${encodeURIComponent(party)}`;
    if (type) url += `&partyType=${encodeURIComponent(type)}`;
    if (category) url += `&partyCateg=${encodeURIComponent(category)}`;

    const tableBody = document.getElementById('ledgerTableBody');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> Loading ledger...</td></tr>`;

    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            renderLedgerTable(json.data);
            if (json.summary) {
                document.getElementById('openingBalance').innerText = `Rs. ${window.formatMoney(json.summary.openingBalance)}`;
                document.getElementById('totalDebitLedger').innerText = `Rs. ${window.formatMoney(json.summary.totalDebit)}`;
                document.getElementById('totalCreditLedger').innerText = `Rs. ${window.formatMoney(json.summary.totalCredit)}`;
                document.getElementById('closingBalance').innerText = `Rs. ${window.formatMoney(json.summary.closingBalance)}`;
            }
            document.getElementById('ledgerTotalCount').innerHTML = `<span style="background: #dae9ef; padding: 6px 16px; border-radius: 30px;">Total transactions: ${json.data.length}</span>`;

            // ========== TREE SUMMARY BY TYPE → CATEGORY → PARTY ==========
            renderTreeSummary(json.data);
        } else if (json.success && json.data?.transactions) {
            renderLedgerTable(json.data.transactions);
            if (json.data.summary || json.summary) {
                const sum = json.data.summary || json.summary;
                document.getElementById('openingBalance').innerText = `Rs. ${window.formatMoney(sum?.openingBalance)}`;
                document.getElementById('totalDebitLedger').innerText = `Rs. ${window.formatMoney(sum?.totalDebit)}`;
                document.getElementById('totalCreditLedger').innerText = `Rs. ${window.formatMoney(sum?.totalCredit)}`;
                document.getElementById('closingBalance').innerText = `Rs. ${window.formatMoney(sum?.closingBalance)}`;
            }
            renderTreeSummary(json.data.transactions || []);
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">No ledger data</td></tr>`;
            document.getElementById('groupSummaryBody').innerHTML = `<tr><td colspan="4" class="empty-state">No data for tree</td></tr>`;
        }
    } catch(e) {
        console.error(e);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">Error: ${e.message}</td></tr>`;
    }
};

function renderLedgerTable(transactions) {
    const tbody = document.getElementById('ledgerTableBody');
    if (!tbody) return;
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No transactions</td></tr>`;
        return;
    }
    let html = '';
    transactions.forEach(t => {
        const date = t.transactionDate ? t.transactionDate.split('T')[0] : (t.date ? t.date.split('T')[0] : '—');
        const amount = t.amount || 0;
        const isDebit = t.status === 'Dr' || t.transactionType === 'Debit' || t.drCr === 'Dr';
        const balance = t.balance || 0;
        const partyName = t.partyName || '—';
        const partyType = t.partyType || '—';
        const partyCateg = t.partyCateg || '—';
        const detail = t.detail || '—';
        const status = t.status || (isDebit ? 'Dr' : 'Cr');

        html += `<tr>
            <td>${date}</td>
            <td>${partyName}</td>
            <td>${partyType}</td>
            <td>${partyCateg}</td>
            <td>${detail}</td>
            <td class="${isDebit ? 'amount-debit' : 'amount-credit'}">Rs. ${window.formatMoney(amount)}</td>
            <td><span class="${status === 'Dr' ? 'badge-dr' : 'badge-cr'}">${status}</span></td>
            <td>Rs. ${window.formatMoney(balance)}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ======================= TREE VIEW: Type → Category → Party =======================
function renderTreeSummary(transactions) {
    if (!transactions || transactions.length === 0) {
        document.getElementById('groupSummaryBody').innerHTML = `<tr><td colspan="4" class="empty-state">No transactions to display tree</td></tr>`;
        return;
    }

    // Build nested structure: Type -> Category -> Party -> {debit, credit}
    const tree = new Map(); // key: type, value: Map of category -> Map of party -> totals

    transactions.forEach(t => {
        const type = t.partyType || 'UNKNOWN TYPE';
        const categ = t.partyCateg || 'UNKNOWN CATEGORY';
        const party = t.partyName || 'UNKNOWN PARTY';
        const amount = Number(t.amount) || 0;
        const isDebit = t.status === 'Dr' || t.transactionType === 'Debit' || t.drCr === 'Dr';

        // Ensure type node
        if (!tree.has(type)) {
            tree.set(type, new Map());
        }
        const categMap = tree.get(type);
        
        // Ensure category node
        if (!categMap.has(categ)) {
            categMap.set(categ, new Map());
        }
        const partyMap = categMap.get(categ);
        
        // Ensure party node
        if (!partyMap.has(party)) {
            partyMap.set(party, { debit: 0, credit: 0 });
        }
        const partyTotals = partyMap.get(party);
        
        if (isDebit) {
            partyTotals.debit += amount;
        } else {
            partyTotals.credit += amount;
        }
    });

    // Generate HTML rows with indentation to represent tree levels
    let html = '';
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    // Sort types for consistent display
    const sortedTypes = Array.from(tree.keys()).sort();

    for (const type of sortedTypes) {
        const categMap = tree.get(type);
        
        // Calculate totals for this Type (sum of all categories under it)
        let typeDebit = 0, typeCredit = 0;
        for (const categ of categMap.keys()) {
            const partyMap = categMap.get(categ);
            for (const partyTotals of partyMap.values()) {
                typeDebit += partyTotals.debit;
                typeCredit += partyTotals.credit;
            }
        }
        grandTotalDebit += typeDebit;
        grandTotalCredit += typeCredit;
        const typeNet = typeDebit - typeCredit;
        const typeNetSign = typeNet >= 0 ? 'Dr' : 'Cr';
        
        // ---- TYPE ROW (Level 1) ----
        html += `<tr style="background: #eaf2f7; font-weight: 700; border-bottom: 1px solid #b8d1da;">
            <td style="padding: 12px 8px;">
                <i class="fas fa-folder-open" style="color: #2c6c7c; margin-right: 8px;"></i> <span style="font-size: 0.95rem;">${type}</span>
            </td>
            <td style="padding: 12px 8px; text-align: right;" class="amount-debit">Rs. ${window.formatMoney(typeDebit)}</td>
            <td style="padding: 12px 8px; text-align: right;" class="amount-credit">Rs. ${window.formatMoney(typeCredit)}</td>
            <td style="padding: 12px 8px; text-align: right;">
                <span class="${typeNet >= 0 ? 'badge-dr' : 'badge-cr'}">Rs. ${window.formatMoney(Math.abs(typeNet))} (${typeNetSign})</span>
            </td>
        </tr>`;

        // Sort categories under this type
        const sortedCategs = Array.from(categMap.keys()).sort();
        
        for (const categ of sortedCategs) {
            const partyMap = categMap.get(categ);
            
            // Calculate totals for this Category
            let categDebit = 0, categCredit = 0;
            for (const partyTotals of partyMap.values()) {
                categDebit += partyTotals.debit;
                categCredit += partyTotals.credit;
            }
            const categNet = categDebit - categCredit;
            const categNetSign = categNet >= 0 ? 'Dr' : 'Cr';
            
            // ---- CATEGORY ROW (Level 2) ----
            html += `<tr style="background: #f2f8fa; border-bottom: 1px dashed #b0cfda;">
                <td style="padding: 8px 8px 8px 32px;">
                    <i class="fas fa-folder" style="color: #3f7e8c; margin-right: 10px;"></i> ${categ}
                </td>
                <td style="padding: 8px 8px; text-align: right;" class="amount-debit">Rs. ${window.formatMoney(categDebit)}</td>
                <td style="padding: 8px 8px; text-align: right;" class="amount-credit">Rs. ${window.formatMoney(categCredit)}</td>
                <td style="padding: 8px 8px; text-align: right;">
                    <span class="${categNet >= 0 ? 'badge-dr' : 'badge-cr'}">Rs. ${window.formatMoney(Math.abs(categNet))} (${categNetSign})</span>
                </td>
            </tr>`;

            // Sort parties under this category
            const sortedParties = Array.from(partyMap.keys()).sort();
            
            for (const party of sortedParties) {
                const pt = partyMap.get(party);
                const partyNet = pt.debit - pt.credit;
                const partyNetSign = partyNet >= 0 ? 'Dr' : 'Cr';
                
                // ---- PARTY ROW (Level 3) ----
                html += `<tr style="border-bottom: 1px solid #e6f0f2;">
                    <td style="padding: 6px 8px 6px 58px; color: #1a4e5c;">
                        <i class="fas fa-user" style="color: #5a7e8c; margin-right: 12px; font-size: 0.8rem;"></i> ${party}
                    </td>
                    <td style="padding: 6px 8px; text-align: right;" class="amount-debit">Rs. ${window.formatMoney(pt.debit)}</td>
                    <td style="padding: 6px 8px; text-align: right;" class="amount-credit">Rs. ${window.formatMoney(pt.credit)}</td>
                    <td style="padding: 6px 8px; text-align: right;">
                        <span class="${partyNet >= 0 ? 'badge-dr' : 'badge-cr'}" style="font-size:0.7rem;">Rs. ${window.formatMoney(Math.abs(partyNet))} (${partyNetSign})</span>
                    </td>
                </tr>`;
            }
            
            // Add a small spacer row after each category's parties for visual grouping
            html += `<tr style="background: transparent; height: 6px;"><td colspan="4" style="border-bottom: none;"></td></tr>`;
        }
    }

    // ---- GRAND TOTAL ROW ----
    const overallNet = grandTotalDebit - grandTotalCredit;
    const overallSign = overallNet >= 0 ? 'Dr' : 'Cr';
    html += `<tr style="background: #cde3e9; font-weight: 800; border-top: 2px solid #1a5f6e; border-bottom: 2px solid #1a5f6e;">
        <td style="padding: 14px 8px; font-size: 0.95rem;"><i class="fas fa-chart-pie"></i> GRAND TOTAL</td>
        <td style="padding: 14px 8px; text-align: right;" class="amount-debit">Rs. ${window.formatMoney(grandTotalDebit)}</td>
        <td style="padding: 14px 8px; text-align: right;" class="amount-credit">Rs. ${window.formatMoney(grandTotalCredit)}</td>
        <td style="padding: 14px 8px; text-align: right;">
            <span style="background: ${overallNet>=0 ? '#b34a3c' : '#1a6042'}; color: white; padding: 6px 14px; border-radius: 40px; font-weight: 700;">
                Rs. ${window.formatMoney(Math.abs(overallNet))} (${overallSign})
            </span>
        </td>
    </tr>`;

    document.getElementById('groupSummaryBody').innerHTML = html;
}

// Add a manual refresh for parties list if needed
window.refreshPartiesList = async function() {
    await window.fetchLedgerFilterOptions();
};