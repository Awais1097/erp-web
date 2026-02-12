// js/invoice.js
// ======================= INVOICE (greysale) with modal =======================
window.loadInvoicePanel = function() {
    const main = document.getElementById('mainContentPanel');
    main.innerHTML = `
        <div id="invoicePanel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.4rem; font-weight: 600;"><i class="fas fa-file-invoice"></i> Greysale Invoices</h2>
                <span id="invoiceTotalCountChip" class="invoice-stat">0 invoices</span>
            </div>
            <!-- invoice summary cards -->
            <div id="invoiceSummaryContainer" class="summary-grid" style="margin-bottom: 1.5rem;">
                <div class="summary-col">
                    <div class="summary-header"><i class="fas fa-chart-simple"></i> INVOICE SUMMARY</div>
                    <div class="summary-row"><span>Total Invoices</span><span id="invTotalInvoices">0</span></div>
                    <div class="summary-row"><span>Total Amount</span><span id="invTotalAmount">Rs. 0</span></div>
                    <div class="summary-row"><span>Total Net Amt</span><span id="invTotalNetAmount">Rs. 0</span></div>
                    <div class="summary-row"><span>Commission</span><span id="invCommission">Rs. 0</span></div>
                </div>
                <div class="summary-col">
                    <div class="summary-header"><i class="fas fa-cubes"></i> ITEMS</div>
                    <div class="summary-row"><span>Total Items</span><span id="invTotalItems">0</span></div>
                    <div class="summary-row"><span>Total Quantity</span><span id="invTotalQuantity">0</span></div>
                    <div class="summary-row"><span>Net Mtr</span><span id="invNetMtr">0</span></div>
                </div>
            </div>

            <!-- filter row -->
            <div class="filter-bar" style="justify-content: space-between;">
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <div class="filter-group" style="min-width: 120px;">
                        <i class="fas fa-list-ol"></i>
                        <select id="invoicePageSize">
                            <option value="20">20 per page</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                    <div class="filter-group" style="background: white;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="invoiceSearchParty" placeholder="Party name" style="width: 160px;">
                    </div>
                </div>
                <button id="fetchInvoiceBtn" class="btn-fetch"><i class="fas fa-rotate-right"></i> Load invoices</button>
            </div>

            <!-- Invoice table: click on vocno -->
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr><th>Inv#</th><th>Date</th><th>Party</th><th>Description</th><th>Qty</th><th>Net Amt</th><th>Total</th><th>Due</th><th>Type</th></tr>
                    </thead>
                    <tbody id="invoiceTableBody">
                        <tr><td colspan="9" class="empty-state">Click "Load invoices"</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="invoicePaginationInfo" style="margin-top: 1rem; display: flex; gap: 20px; align-items: center;">
                <span id="invoicePageIndicator" style="font-weight: 500;">Page 1</span>
                <div style="display: flex; gap: 12px;">
                    <button id="prevInvoicePage" class="btn-fetch" style="padding: 8px 20px;"><i class="fas fa-chevron-left"></i> Prev</button>
                    <button id="nextInvoicePage" class="btn-fetch" style="padding: 8px 20px;">Next <i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    `;

    // pagination state
    window.invoiceCurrentPage = 1;
    window.invoicePageSize = 20;
    window.invoiceTotalPages = 1;
    window.invoiceTotalCount = 0;

    // attach listeners
    document.getElementById('fetchInvoiceBtn').addEventListener('click', ()=>{
        window.invoicePageSize = parseInt(document.getElementById('invoicePageSize').value, 10);
        window.invoiceCurrentPage = 1;
        window.fetchInvoiceData(window.invoiceCurrentPage, window.invoicePageSize);
    });
    document.getElementById('prevInvoicePage').addEventListener('click', ()=>{
        if (window.invoiceCurrentPage > 1) {
            window.invoiceCurrentPage--;
            window.fetchInvoiceData(window.invoiceCurrentPage, parseInt(document.getElementById('invoicePageSize').value,10));
        }
    });
    document.getElementById('nextInvoicePage').addEventListener('click', ()=>{
        if (window.invoiceCurrentPage < window.invoiceTotalPages) {
            window.invoiceCurrentPage++;
            window.fetchInvoiceData(window.invoiceCurrentPage, parseInt(document.getElementById('invoicePageSize').value,10));
        }
    });
    document.getElementById('invoicePageSize').addEventListener('change', ()=>{
        window.invoicePageSize = parseInt(document.getElementById('invoicePageSize').value,10);
        window.invoiceCurrentPage = 1;
        if (document.getElementById('invoicePanel').style.display !== 'none')
            window.fetchInvoiceData(window.invoiceCurrentPage, window.invoicePageSize);
    });

    // initial fetch
    window.fetchInvoiceData(1, 20);
};

window.fetchInvoiceData = async function(page, size) {
    let base = document.getElementById('appBaseApiInput').value.trim().replace(/\/$/, '');
    if (!base) return;
    const url = `${base}/greysale?pageNumber=${page}&pageSize=${size}`;
    const tableBody = document.getElementById('invoiceTableBody');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-spinner fa-pulse"></i> loading invoices...</td></tr>`;
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const json = await res.json();
        if (json.success && json.data) {
            const d = json.data;
            const items = d.data || [];
            renderInvoiceTable(items);
            if (d.summary) {
                document.getElementById('invTotalInvoices').innerText = d.summary.totalInvoices ?? 0;
                document.getElementById('invTotalAmount').innerText = `Rs. ${window.formatMoney(d.summary.totalAmount)}`;
                document.getElementById('invTotalNetAmount').innerText = `Rs. ${window.formatMoney(d.summary.totalNetAmount)}`;
                document.getElementById('invCommission').innerText = `Rs. ${window.formatMoney(d.summary.totalCommission)}`;
                document.getElementById('invTotalItems').innerText = d.summary.totalItems ?? 0;
                document.getElementById('invTotalQuantity').innerText = d.summary.totalQuantity ?? 0;
                document.getElementById('invNetMtr').innerText = d.summary.totalNetMtr ?? 0;
            }
            window.invoiceTotalCount = d.totalCount || items.length;
            window.invoiceTotalPages = d.totalPages || 1;
            window.invoiceCurrentPage = d.pageNumber || page;
            document.getElementById('invoicePageIndicator').innerText = `Page ${window.invoiceCurrentPage} of ${window.invoiceTotalPages}`;
            document.getElementById('invoiceTotalCountChip').innerText = `${window.invoiceTotalCount} invoices`;
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="empty-state">No invoice data</td></tr>`;
        }
    } catch(e) {
        console.error(e);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="empty-state">Error: ${e.message}</td></tr>`;
    }
};

function renderInvoiceTable(invoices) {
    const tbody = document.getElementById('invoiceTableBody');
    if (!tbody) return;
    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No invoices found</td></tr>`;
        return;
    }
    let html = '';
    invoices.forEach(inv => {
        const date = inv.date ? inv.date.split('T')[0] : '—';
        const due = inv.due ? inv.due.split('T')[0] : '—';
        const vocNo = inv.vocNo || inv.id || '—';
        html += `<tr>
            <td><strong><a href="#" onclick="window.viewInvoiceDetail(${vocNo}); return false;" style="color: #134b5f; text-decoration: underline; text-underline-offset: 3px; font-weight:700;">${vocNo}</a></strong></td>
            <td>${date}</td>
            <td>${inv.partyName || '—'}</td>
            <td>${inv.partyDesc || '—'}</td>
            <td>${inv.totalQuantity ?? inv.itemCount ?? 0}</td>
            <td class="amount-credit">Rs. ${window.formatMoney(inv.totalNetAmount)}</td>
            <td class="amount-debit">Rs. ${window.formatMoney(inv.totalAmount)}</td>
            <td>${due}</td>
            <td><span class="badge-cr" style="background:#e6ecf0;">${inv.type || 'GS'}</span></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// Invoice detail modal
window.viewInvoiceDetail = async function(vocNo) {
    if (!vocNo) return;
    const base = document.getElementById('appBaseApiInput').value.trim().replace(/\/$/, '');
    const url = `${base}/greysale/by-vocno/${vocNo}`;
    const modal = document.getElementById('invoiceDetailModal');
    const modalBody = document.getElementById('modalInvoiceDetailBody');
    modalBody.innerHTML = `<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-pulse"></i> Loading detail...</div>`;
    modal.style.display = 'flex';
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const json = await res.json();
        if (json.success && json.data) {
            renderInvoiceDetailModal(json.data);
        } else {
            modalBody.innerHTML = `<div style="color: #b34141; padding: 2rem; text-align: center;"><i class="fas fa-circle-exclamation"></i> Detail not found</div>`;
        }
    } catch(e) {
        modalBody.innerHTML = `<div style="color: #b34141; padding: 2rem;">Error: ${e.message}</div>`;
    }
};

function renderInvoiceDetailModal(inv) {
    let saleRows = '';
    if (inv.saleList && inv.saleList.length) {
        inv.saleList.forEach(item => {
            saleRows += `<tr>
                <td>${item.prodName || '—'}</td>
                <td>${item.gradeName || '—'}</td>
                <td>${item.designNo || '—'}</td>
                <td>${item.qty ?? 0}</td>
                <td>${item.sizeMtr ?? 0}</td>
                <td>${item.netMtr ?? 0}</td>
                <td>${item.rate ?? 0}</td>
                <td class="amount-debit">Rs. ${window.formatMoney(item.amount)}</td>
                <td class="amount-credit">Rs. ${window.formatMoney(item.netAmt)}</td>
            </tr>`;
        });
    } else saleRows = `<tr><td colspan="9" class="empty-state">No sale items</td></tr>`;

    const date = inv.date ? inv.date.split('T')[0] : '—';
    const due = inv.due ? inv.due.split('T')[0] : '—';
    const html = `
        <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; background: #f6fbfc; padding: 1.5rem; border-radius: 24px; margin-bottom: 1.5rem;">
            <div style="min-width: 200px;"><strong>Voc#</strong> ${inv.vocNo}</div>
            <div><strong>Date</strong> ${date}</div>
            <div><strong>Due</strong> ${due}</div>
            <div><strong>Party</strong> ${inv.partyName || inv.partyDesc || '—'}</div>
            <div><span class="badge-invoice-type">${inv.type || 'GS'}</span></div>
        </div>
        <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem; background: white; padding: 1.2rem; border-radius: 20px;">
            <div><span style="color: #3a6178;">Total Amount</span> <span style="font-weight: 800;">Rs. ${window.formatMoney(inv.totalAmount)}</span></div>
            <div><span style="color: #3a6178;">Net Amount</span> <span style="font-weight: 800;">Rs. ${window.formatMoney(inv.totalNetAmount)}</span></div>
            <div><span style="color: #3a6178;">Commission</span> Rs. ${window.formatMoney(inv.totalCommission)}</div>
            <div><span style="color: #3a6178;">Total Qty</span> ${inv.totalQuantity ?? 0}</div>
            <div><span style="color: #3a6178;">Net Mtr</span> ${inv.totalNetMtr ?? 0}</div>
        </div>
        <h4 style="font-size:1.1rem; margin:1rem 0 0.7rem;"><i class="fas fa-list"></i> Sale Items</h4>
        <div class="table-wrapper">
            <table>
                <thead><tr><th>Product</th><th>Grade</th><th>Design</th><th>Qty</th><th>SizeMtr</th><th>NetMtr</th><th>Rate</th><th>Amount</th><th>Net Amt</th></tr></thead>
                <tbody>${saleRows}</tbody>
            </table>
        </div>
    `;
    document.getElementById('modalInvoiceDetailBody').innerHTML = html;
}

// modal close
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('invoiceDetailModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', function() { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
});