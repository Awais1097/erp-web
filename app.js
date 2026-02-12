// js/app.js
// ======================= APP INIT =======================
// This file glues everything together, sets up global listeners and default states

(function() {
    "use strict";

    // ensure global functions are attached to window
    window.loadCashbookPanel = window.loadCashbookPanel || function() { console.warn('cashbook not loaded'); };
    window.loadLedgerPanel = window.loadLedgerPanel || function() {};
    window.loadInvoicePanel = window.loadInvoicePanel || function() {};
    window.fetchCashbookData = window.fetchCashbookData || function() {};
    window.fetchLedgerTransactions = window.fetchLedgerTransactions || function() {};
    window.fetchLedgerFilterOptions = window.fetchLedgerFilterOptions || function() {};
    window.fetchInvoiceData = window.fetchInvoiceData || function() {};
    window.viewInvoiceDetail = window.viewInvoiceDetail || function() {};

    // default date on load (already in auth but ensure)
    window.addEventListener('load', function() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const fromDate = document.getElementById('fromDate');
        const toDate = document.getElementById('toDate');
        const appDate = document.getElementById('appDateInput');
        if (fromDate && !fromDate.value) fromDate.value = '2024-01-01';
        if (toDate && !toDate.value) toDate.value = '2027-01-01';
        if (appDate && !appDate.value) appDate.value = todayStr;
    });

    // modal close double check
    const modal = document.getElementById('invoiceDetailModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() { if (modal) modal.style.display = 'none'; });
    }
    if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
    }
})();