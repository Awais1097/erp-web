// js/cashbook.js
// ======================= CASHBOOK =======================
window.loadCashbookPanel = function() {
    const main = document.getElementById('mainContentPanel');
    // inject cashbook html if not exists
    if (!document.getElementById('cashbookPanel')) {
        main.innerHTML = `
            <div id="cashbookPanel">
                <div id="cashbookSummaryContainer" class="summary-grid">
                    <div style="width:100%; text-align:center; padding:1.5rem;"><i class="fas fa-spinner fa-pulse"></i> Loading summary...</div>
                </div>
                <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px;">
                    <h2 style="font-size: 1.3rem; font-weight: 600;"><i class="fas fa-book-open" style="margin-right: 10px;"></i>Cash Book <span id="cashbookDateLabel" style="background: #e4f0f3; padding: 5px 18px; border-radius: 40px; font-size: 0.85rem;"></span></h2>
                    <span id="cashbookCountChip" style="background: #dae9ef; padding: 6px 16px; border-radius: 30px; font-weight: 600;">0 entries</span>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Date</th><th>Party</th><th>Detail</th><th>Credit (₹)</th><th>Party (Dr)</th><th>Detail (Dr)</th><th>Debit (₹)</th><th>Type</th></tr></thead>
                        <tbody id="cashbookTableBody"><tr><td colspan="8" class="empty-state">Select date & load</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        document.getElementById('cashbookPanel').style.display = 'block';
    }
    window.fetchCashbookData();
};

window.fetchCashbookData = async function() {
    let base = document.getElementById('appBaseApiInput').value.trim().replace(/\/$/, '');
    const date = document.getElementById('appDateInput').value;
    if (!base || !date) return;
    const summaryUrl = `${base}/cashbook/summary?date=${date}`;
    const viewUrl = `${base}/cashbook/view?date=${date}`;
    const sumContainer = document.getElementById('cashbookSummaryContainer');
    const tableBody = document.getElementById('cashbookTableBody');
    const dateLabel = document.getElementById('cashbookDateLabel');
    const countChip = document.getElementById('cashbookCountChip');

    if (sumContainer) sumContainer.innerHTML = `<div style="width:100%; text-align:center; padding:1.5rem;"><i class="fas fa-spinner fa-pulse"></i> Loading...</div>`;
    try {
        const [summaryRes, viewRes] = await Promise.allSettled([fetch(summaryUrl), fetch(viewUrl)]);
        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
            const sjson = await summaryRes.value.json();
            if (sjson.success && sjson.data) renderCashbookSummary(sjson.data);
        } else { if (sumContainer) sumContainer.innerHTML = `<div style="color:#b34141; padding:1.5rem;">Summary failed</div>`; }
        if (viewRes.status === 'fulfilled' && viewRes.value.ok) {
            const vjson = await viewRes.value.json();
            if (vjson.success) renderCashbookTable(vjson.data?.transactions || [], vjson.data?.reportDate || date);
            else throw new Error();
        } else { if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">No transactions</td></tr>`; if (countChip) countChip.innerText = '0 entries'; }
    } catch(e) { console.error(e); }
};

function renderCashbookSummary(d) {
    const cont = document.getElementById('cashbookSummaryContainer');
    if (!cont) return;
    const html = `<div class="summary-col"><div class="summary-header">CREDIT</div>
        <div class="summary-row"><span>Cash</span><span>Rs. ${window.formatMoney(d.creditCash)}</span></div><div class="summary-row"><span>Cheque</span><span>Rs. ${window.formatMoney(d.creditCheque)}</span></div>
        <div class="summary-row"><span>Bank</span><span>Rs. ${window.formatMoney(d.creditBank)}</span></div><div class="summary-row"><span style="font-weight:700;">Total</span><span>Rs. ${window.formatMoney(d.credit)}</span></div></div>
        <div class="summary-col"><div class="summary-header">DEBIT</div><div class="summary-row"><span>Cash</span><span>Rs. ${window.formatMoney(d.debitCash)}</span></div>
        <div class="summary-row"><span>Cheque</span><span>Rs. ${window.formatMoney(d.debitCheque)}</span></div><div class="summary-row"><span>Bank</span><span>Rs. ${window.formatMoney(d.debitBank)}</span></div>
        <div class="summary-row"><span style="font-weight:700;">Total</span><span>Rs. ${window.formatMoney(d.debit)}</span></div></div>
        <div class="summary-col"><div class="summary-header">BALANCE</div><div class="summary-row"><span>Net Cash Flow</span><span>Rs. ${window.formatMoney(d.netCashFlow)}</span></div>
        <div class="summary-row"><span>Remaining</span><span style="font-size:1.2rem; font-weight:800;">Rs. ${window.formatMoney(d.remainingBalance)}</span></div>
        <div class="summary-row"><span>Balance (${d.balanceType})</span><span>Rs. ${window.formatMoney(d.balance)} <span class="${d.balanceType==='Dr'?'badge-dr':'badge-cr'}">${d.balanceType}</span></span></div></div>`;
    cont.innerHTML = html;
}

function renderCashbookTable(tx, rd) {
    const dateLabel = document.getElementById('cashbookDateLabel');
    const tableBody = document.getElementById('cashbookTableBody');
    const countChip = document.getElementById('cashbookCountChip');
    if (dateLabel) dateLabel.innerText = rd || document.getElementById('appDateInput').value;
    if (!tx.length) { if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">No transactions</td></tr>`; if (countChip) countChip.innerText = '0 entries'; return; }
    let html = ''; tx.forEach(t => {
        const date = t.date?.split('T')[0] || '—';
        html += `<tr><td>${date}</td><td><span style="background:#e1ecf0; padding:5px 12px; border-radius:50px;">${t.partyName || '—'}</span></td>
            <td>${t.creditDetail || '—'}</td><td class="amount-credit">${t.credit>0?'Rs. '+window.formatMoney(t.credit):'—'}</td>
            <td><span style="background:#fde9e9; padding:5px 12px; border-radius:50px;">${t.debitPartyName || '—'}</span></td>
            <td>${t.debitDetail || '—'}</td><td class="amount-debit">${t.debit>0?'Rs. '+window.formatMoney(t.debit):'—'}</td>
            <td><span style="background:${t.transactionType==='Credit'?'#e2f0e6':'#ffece5'}; padding:5px 14px; border-radius:50px;">${t.transactionType||(t.credit>0?'Credit':'Debit')}</span></td></tr>`;
    });
    if (tableBody) tableBody.innerHTML = html;
    if (countChip) countChip.innerText = `${tx.length} entries`;
}