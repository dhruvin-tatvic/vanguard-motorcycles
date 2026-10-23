/**
 * VANGUARD MOTORCYCLES - CORE SCRIPT
 * Manages UI interactions, lead capture, local storage persistence,
 * financial calculators, and lead administration drawer.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSoundButtons();
  initLeadForms();
  initEmiCalculator();
  initLeadsAdminDrawer();
  updateLeadsBadge();
});

// ==========================================
// 1. NAVIGATION & HEADER
// ==========================================
function initNavbar() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      toggleBtn.classList.toggle('active');
    });
  }

  // Highlight current page nav link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ==========================================
// 2. EXHAUST SOUND TOGGLE
// ==========================================
function initSoundButtons() {
  const soundBtns = document.querySelectorAll('.sound-toggle-btn');
  soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.vanguardAudio) {
        const isPlaying = window.vanguardAudio.toggle();
        const textSpan = btn.querySelector('.sound-btn-text');
        if (isPlaying) {
          btn.classList.add('playing');
          if (textSpan) textSpan.textContent = 'Mute Twin Engine (Idle)';
          showToast('Engine Running: 650cc Twin-Cylinder Idle Rumble');
        } else {
          btn.classList.remove('playing');
          if (textSpan) textSpan.textContent = 'Hear 650cc Engine Roar';
        }
      }
    });
  });
}

// ==========================================
// 3. LEAD CAPTURE & STORAGE SYSTEM
// ==========================================
const LEADS_STORAGE_KEY = 'vanguard_leads_data';

function getStoredLeads() {
  try {
    const data = localStorage.getItem(LEADS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLead(leadData) {
  const leads = getStoredLeads();
  const newLead = {
    id: 'VG-' + Math.floor(100000 + Math.random() * 900000),
    timestamp: new Date().toISOString(),
    ...leadData
  };
  leads.unshift(newLead);
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  updateLeadsBadge();
  return newLead;
}

function initLeadForms() {
  const leadForms = document.querySelectorAll('form[data-lead-form]');

  leadForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic field extraction
      const formData = new FormData(form);
      const leadPayload = {
        type: form.getAttribute('data-lead-type') || 'General Lead',
        sourcePage: window.location.pathname.split('/').pop() || 'index.html',
        details: {}
      };

      for (let [key, val] of formData.entries()) {
        leadPayload.details[key] = val;
      }

      // Check required conditions
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Processing...</span>`;
      }

      setTimeout(() => {
        const saved = saveLead(leadPayload);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }

        form.reset();
        showLeadSuccessModal(saved);
        showToast(`Lead captured! Reference: ${saved.id}`);
      }, 600);
    });
  });
}

// Toast notification helper
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e25822" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Success Modal
function showLeadSuccessModal(lead) {
  let modal = document.getElementById('leadSuccessModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'leadSuccessModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <button class="modal-close-btn" onclick="closeModal('leadSuccessModal')">&times;</button>
        <div class="success-icon-badge">&#10003;</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 0.5rem; text-transform: uppercase;">
          Request Confirmed
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem;">
          Thank you for choosing Vanguard Motorcycles. Your enquiry has been routed to our concierge team.
        </p>
        <div style="background: rgba(0,0,0,0.4); border: 1px dashed var(--border-copper); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
          <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Booking Reference ID</div>
          <div id="modalLeadRefId" style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--accent-copper);"></div>
          <div id="modalLeadType" style="font-size: 0.85rem; color: #ffffff; margin-top: 4px;"></div>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.8rem;">
          Our certified relationship manager will contact you within 2 hours to confirm details and slot schedule.
        </p>
        <button class="btn btn-primary" style="width: 100%;" onclick="closeModal('leadSuccessModal')">
          Done & Return to Site
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('modalLeadRefId').textContent = lead.id;
  document.getElementById('modalLeadType').textContent = `Type: ${lead.type} • Status: Priority Scheduled`;
  openModal('leadSuccessModal');
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('open');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('open');
}

// ==========================================
// 4. EMI & FINANCING CALCULATOR
// ==========================================
function initEmiCalculator() {
  const priceInput = document.getElementById('calcBikePrice');
  const downPaymentInput = document.getElementById('calcDownPayment');
  const downPaymentDisplay = document.getElementById('calcDownPaymentVal');
  const tenureInput = document.getElementById('calcTenure');
  const tenureDisplay = document.getElementById('calcTenureVal');
  const interestInput = document.getElementById('calcInterest');
  const interestDisplay = document.getElementById('calcInterestVal');
  const emiOutput = document.getElementById('calcEmiOutput');
  const loanOutput = document.getElementById('calcLoanAmount');

  if (!priceInput || !emiOutput) return;

  function calculate() {
    const bikePrice = parseFloat(priceInput.value) || 350000;
    const downPaymentPercent = parseFloat(downPaymentInput?.value || 20);
    const tenureMonths = parseInt(tenureInput?.value || 36);
    const annualRate = parseFloat(interestInput?.value || 8.5);

    const downPaymentAmount = Math.round((bikePrice * downPaymentPercent) / 100);
    const loanPrincipal = bikePrice - downPaymentAmount;

    if (downPaymentDisplay) {
      downPaymentDisplay.textContent = `${downPaymentPercent}% (₹${downPaymentAmount.toLocaleString('en-IN')})`;
    }
    if (tenureDisplay) {
      tenureDisplay.textContent = `${tenureMonths} Months (${(tenureMonths/12).toFixed(1)} Yrs)`;
    }
    if (interestDisplay) {
      interestDisplay.textContent = `${annualRate}% p.a.`;
    }
    if (loanOutput) {
      loanOutput.textContent = `₹${loanPrincipal.toLocaleString('en-IN')}`;
    }

    // Monthly EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    const monthlyRate = (annualRate / 12) / 100;
    let emi = 0;
    if (monthlyRate === 0) {
      emi = loanPrincipal / tenureMonths;
    } else {
      emi = (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    }

    emiOutput.textContent = `₹${Math.round(emi).toLocaleString('en-IN')}`;
  }

  [priceInput, downPaymentInput, tenureInput, interestInput].forEach(el => {
    el?.addEventListener('input', calculate);
  });

  calculate();
}

// ==========================================
// 5. DEMO LEADS DRAWER (SHOWCASE CAPABILITY)
// ==========================================
function updateLeadsBadge() {
  const leads = getStoredLeads();
  const badge = document.querySelector('.leads-badge-count');
  if (badge) {
    badge.textContent = leads.length;
  }
}

function initLeadsAdminDrawer() {
  // Insert bottom-right toggle button
  const triggerBtn = document.createElement('button');
  triggerBtn.className = 'leads-admin-btn';
  triggerBtn.title = 'View Leads captured during session';
  triggerBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
    <span>Leads Admin</span>
    <span class="leads-badge-count">0</span>
  `;
  document.body.appendChild(triggerBtn);

  // Modal container
  const drawer = document.createElement('div');
  drawer.id = 'leadsAdminDrawer';
  drawer.className = 'modal-overlay';
  drawer.innerHTML = `
    <div class="modal-card" style="max-width: 850px; text-align: left;">
      <button class="modal-close-btn" onclick="closeModal('leadsAdminDrawer')">&times;</button>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
        <div>
          <h3 style="font-family: var(--font-heading); font-size: 1.5rem; text-transform: uppercase;">Captured Leads Management</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">Real-time lead entries submitted from forms across all 10 pages</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="exportLeadsCsv()">Export CSV</button>
          <button class="btn btn-outline-copper btn-sm" onclick="clearLeads()">Clear</button>
        </div>
      </div>
      <div id="leadsListContainer" style="max-height: 400px; overflow-y: auto;">
        <!-- Filled dynamically -->
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  triggerBtn.addEventListener('click', () => {
    renderLeadsList();
    openModal('leadsAdminDrawer');
  });
}

function renderLeadsList() {
  const container = document.getElementById('leadsListContainer');
  if (!container) return;
  const leads = getStoredLeads();

  if (leads.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No leads captured yet.</p>
        <p style="font-size: 0.85rem;">Submit a Test Ride, Configure Quote, or Service Booking form on the site to see them listed here instantly!</p>
      </div>
    `;
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
      <thead>
        <tr style="border-bottom: 1px solid var(--border-light); color: var(--accent-copper); text-align: left;">
          <th style="padding: 8px;">Ref ID</th>
          <th style="padding: 8px;">Type</th>
          <th style="padding: 8px;">Name / Details</th>
          <th style="padding: 8px;">Contact</th>
          <th style="padding: 8px;">Timestamp</th>
        </tr>
      </thead>
      <tbody>
  `;

  leads.forEach(l => {
    const details = l.details || {};
    const name = details.name || details.fullName || details.customerName || 'Anonymous Rider';
    const contact = details.phone || details.email || 'N/A';
    const summary = details.model || details.bike || details.city || l.sourcePage;
    const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    html += `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 10px 8px; font-weight: 700; color: #fff;">${l.id}</td>
        <td style="padding: 10px 8px;"><span class="badge badge-copper">${l.type}</span></td>
        <td style="padding: 10px 8px; color: var(--text-secondary);">${name} <br><small style="color:var(--text-muted);">${summary}</small></td>
        <td style="padding: 10px 8px; color: var(--text-secondary);">${contact}</td>
        <td style="padding: 10px 8px; color: var(--text-muted); font-size: 0.78rem;">${time}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

window.clearLeads = function() {
  if (confirm('Clear all captured leads?')) {
    localStorage.removeItem(LEADS_STORAGE_KEY);
    renderLeadsList();
    updateLeadsBadge();
    showToast('Leads data cleared.');
  }
};

window.exportLeadsCsv = function() {
  const leads = getStoredLeads();
  if (leads.length === 0) {
    alert('No leads to export.');
    return;
  }

  let csv = 'ID,Type,Page,Timestamp,Details\n';
  leads.forEach(l => {
    const detailsClean = JSON.stringify(l.details).replace(/"/g, '""');
    csv += `"${l.id}","${l.type}","${l.sourcePage}","${l.timestamp}","${detailsClean}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vanguard_leads_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.openModal = openModal;
window.closeModal = closeModal;
