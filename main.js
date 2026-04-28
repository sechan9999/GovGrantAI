import { jsPDF } from 'jspdf';

// ===== DOM Elements =====
const form = document.getElementById('proposal-form');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const progressBar = document.getElementById('progress-bar');
const loadingStep = document.getElementById('loading-step');
const documentContent = document.getElementById('document-content');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const sampleBtn = document.getElementById('sample-btn');
const downloadMdBtn = document.getElementById('download-md-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const reviewSummary = document.getElementById('review-summary');

let currentStep = 1;
const totalSteps = 5;
let currentProposalData = {};

// ===== Agency Templates =====
const AGENCY_TEMPLATES = {
  NSF: {
    name: 'National Science Foundation', focus: 'scientific research and education', criteria: 'intellectual merit and broader impacts',
    compliance: ['Data Management Plan (DMP) required', 'Postdoctoral Mentoring Plan (if applicable)', 'Human Subjects / IRB approval (if applicable)', 'FastLane or Research.gov submission portal', '2-page Project Summary with overview, intellectual merit, and broader impacts', 'Authorized Organizational Representative (AOR) certification required']
  },
  NIH: {
    name: 'National Institutes of Health', focus: 'biomedical and public health research', criteria: 'significance, innovation, and feasibility',
    compliance: ['IRB approval / Human Subjects Protection Plan', 'IACUC approval required for animal studies', 'eRA Commons account registration required', 'SF424 (R&R) application forms via Grants.gov', 'Facilities & Other Resources section required', 'Authentication Plan for Key Biological Resources']
  },
  DOE: {
    name: 'Department of Energy', focus: 'energy innovation and national security', criteria: 'technical merit and energy impact',
    compliance: ['PAMS (Portfolio Analysis Management System) registration', 'Foreign National Access Plan if applicable', 'Data Management Plan compliant with DOE/OSTI standards', 'Export Control compliance certification', 'Security review for sensitive/dual-use technologies', 'Environmental impact assessment as needed']
  },
  ED: {
    name: 'Department of Education', focus: 'educational improvement and access', criteria: 'need, quality of design, and significance',
    compliance: ['Grants.gov submission using SF-424 forms', 'GEPA Section 427 compliance statement required', 'Alignment with absolute and competitive funding priorities', 'Logic model demonstrating program theory of change', 'Rigorous evaluation design (experimental preferred)', 'FERPA and Privacy Act compliance certification']
  },
  DARPA: {
    name: 'Defense Advanced Research Projects Agency', focus: 'breakthrough technologies for national security', criteria: 'technical innovation and transformative potential',
    compliance: ['SAM.gov active registration required', 'Broad Agency Announcement (BAA) alignment documentation', 'ITAR/EAR export control review and certification', 'IP and Data Rights clauses per DFARS 252.227', 'Security clearance requirements assessment', 'Detailed technical performance milestones and metrics']
  },
  USDA: {
    name: 'US Department of Agriculture', focus: 'agricultural research and rural development', criteria: 'relevance to USDA priorities and scientific merit',
    compliance: ['Grants.gov submission with eAuthentication', 'USDA nondiscrimination statement required', 'Civil Rights compliance (Title VI, VII, IX)', 'Tribal consultation documentation if applicable', 'Rural development impact statement', 'Food safety and regulatory alignment documentation']
  },
  EPA: {
    name: 'Environmental Protection Agency', focus: 'environmental protection and sustainability', criteria: 'environmental impact and scientific rigor',
    compliance: ['Quality Assurance Project Plan (QAPP) required', 'NEPA environmental review compliance', 'SAM.gov active registration required', 'Grants.gov SF-424 submission', 'Considerations for minority/disadvantaged communities', 'EPA data quality and peer review standards compliance']
  },
  SBA: {
    name: 'Small Business Innovation Research Program', focus: 'small business R&D commercialization', criteria: 'innovation, commercial potential, and team capability',
    compliance: ['Small Business concern eligibility verified (< 500 employees)', 'PI primarily employed by applicant organization', 'Registration in SBIR.gov portal required', 'Phase I → Phase II commercialization pathway defined', 'Commercialization Plan with market size and revenue projections', 'Certification of business ownership and employment']
  },
};

// ===== Toast System =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== Wizard Navigation =====
function updateWizard() {
  document.querySelectorAll('.wizard-page').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${currentStep}`).classList.add('active');

  document.querySelectorAll('.wizard-step').forEach(s => {
    const step = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (step === currentStep) s.classList.add('active');
    else if (step < currentStep) s.classList.add('completed');
  });

  prevBtn.disabled = currentStep === 1;
  nextBtn.classList.toggle('hidden', currentStep === totalSteps);
  generateBtn.classList.toggle('hidden', currentStep !== totalSteps);

  if (currentStep === totalSteps) populateReview();
  if (currentStep === 4) drawBudgetChart();
}

function validateStep(step) {
  if (step === 1) {
    if (!document.getElementById('orgName').value.trim()) { showToast('Organization Name is required.', 'error'); return false; }
    if (!document.getElementById('pastPerformance').value.trim()) { showToast('Past Performance is required.', 'error'); return false; }
  }
  if (step === 2) {
    if (!document.getElementById('projectTitle').value.trim()) { showToast('Project Title is required.', 'error'); return false; }
    if (!document.getElementById('fundingAmount').value || parseFloat(document.getElementById('fundingAmount').value) <= 0) { showToast('Enter a valid Funding Amount.', 'error'); return false; }
    if (!document.getElementById('grantAgency').value) { showToast('Please select a Target Agency.', 'error'); return false; }
  }
  if (step === 3) {
    if (!document.getElementById('objectives').value.trim()) { showToast('Core Objectives are required.', 'error'); return false; }
  }
  if (step === 4) {
    const total = getBudgetValues().reduce((a, b) => a + b, 0);
    if (total !== 100) { showToast(`Budget totals ${total}% — tap Auto-Balance to fix.`, 'error'); return false; }
  }
  return true;
}

prevBtn.addEventListener('click', () => { if (currentStep > 1) { currentStep--; updateWizard(); } });
nextBtn.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) { currentStep++; updateWizard(); }
});

// ===== Budget Sliders =====
const sliderIds = ['budget-personnel', 'budget-equipment', 'budget-operations', 'budget-evaluation'];
const valueIds = ['val-personnel', 'val-equipment', 'val-operations', 'val-evaluation'];

sliderIds.forEach((id, i) => {
  document.getElementById(id).addEventListener('input', () => {
    const val = document.getElementById(id).value;
    document.getElementById(valueIds[i]).textContent = `${val}%`;
    updateBudgetTotal();
    drawBudgetChart();
  });
});

function getBudgetValues() {
  return sliderIds.map(id => parseInt(document.getElementById(id).value));
}

function updateBudgetTotal() {
  const total = getBudgetValues().reduce((a, b) => a + b, 0);
  const el = document.getElementById('budget-total-value');
  el.textContent = `${total}%`;
  el.classList.toggle('over', total !== 100);
  el.style.color = total === 100 ? 'var(--accent-success)' : 'var(--accent-danger)';
}

function normalizeBudget() {
  const values = getBudgetValues();
  const total = values.reduce((a, b) => a + b, 0) || 100;
  const normalized = values.map(v => Math.round((v / total) * 100));
  const diff = 100 - normalized.reduce((a, b) => a + b, 0);
  normalized[0] += diff;
  sliderIds.forEach((id, i) => {
    document.getElementById(id).value = normalized[i];
    document.getElementById(valueIds[i]).textContent = `${normalized[i]}%`;
  });
  updateBudgetTotal();
  drawBudgetChart();
  showToast('Budget balanced to 100%!', 'success');
}

document.getElementById('normalize-btn').addEventListener('click', normalizeBudget);

function drawBudgetChart() {
  const canvas = document.getElementById('budget-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const values = getBudgetValues();
  const colors = ['#6366f1', '#d946ef', '#38bdf8', '#22c55e'];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 100, cy = 100, r = 80, ir = 50;

  ctx.clearRect(0, 0, 200, 200);
  let startAngle = -Math.PI / 2;

  values.forEach((val, i) => {
    const sliceAngle = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, ir, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();

    const midAngle = startAngle + sliceAngle / 2;
    const lx = cx + (r + 2) * 0.68 * Math.cos(midAngle);
    const ly = cy + (r + 2) * 0.68 * Math.sin(midAngle);
    if (val > 5) {
      ctx.fillStyle = '#fff';
      ctx.font = '600 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}%`, lx, ly + 4);
    }
    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 11px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('Budget', cx, cy - 4);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 14px Inter';
  ctx.fillText(`${total}%`, cx, cy + 14);
}

// ===== Review Summary =====
function populateReview() {
  const fields = [
    ['Organization', document.getElementById('orgName').value],
    ['Project', document.getElementById('projectTitle').value],
    ['Funding', '$' + parseInt(document.getElementById('fundingAmount').value || 0).toLocaleString()],
    ['Agency', document.getElementById('grantAgency').value],
    ['Duration', (document.getElementById('projectDuration').value || 24) + ' months'],
    ['Budget Split', getBudgetValues().join('% / ') + '%'],
  ];
  reviewSummary.innerHTML = fields.map(([k, v]) =>
    `<div class="review-item"><strong>${k}</strong><span>${v || '—'}</span></div>`
  ).join('');
}

// ===== Sample Data =====
sampleBtn.addEventListener('click', () => {
  document.getElementById('orgName').value = 'Nexus Health Innovations';
  document.getElementById('pastPerformance').value = '- Managed $500k HRSA grant (2024) with zero compliance findings\n- Scaled telemedicine platform to 10,000+ patients\n- Partnered with 3 state health departments';
  document.getElementById('projectTitle').value = 'AI-Driven Diagnostic Accessibility Initiative';
  document.getElementById('fundingAmount').value = '1250000';
  document.getElementById('grantAgency').value = 'NIH';
  document.getElementById('projectDuration').value = '24';
  document.getElementById('objectives').value = '1. Deploy AI diagnostic tools to 50 rural clinics\n2. Reduce diagnostic latency by 40%\n3. Train 200 healthcare professionals';
  document.getElementById('methodology').value = 'Multi-phase approach: stakeholder mapping, AI model deployment, clinical training workshops, iterative evaluation with control groups.';
  syncCharCounters();
  showToast('Sample data loaded!', 'success');
});

// ===== Char Counters =====
const CHAR_LIMITS = [['pastPerformance', 500], ['objectives', 800], ['methodology', 600]];

function setupCharCounters() {
  CHAR_LIMITS.forEach(([id, max]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.id = `counter-${id}`;
    counter.textContent = `0 / ${max}`;
    el.parentNode.appendChild(counter);
    el.addEventListener('input', () => {
      const len = el.value.length;
      counter.textContent = `${len} / ${max}`;
      counter.classList.toggle('over', len > max);
    });
  });
}

function syncCharCounters() {
  CHAR_LIMITS.forEach(([id, max]) => {
    const el = document.getElementById(id);
    const counter = document.getElementById(`counter-${id}`);
    if (el && counter) {
      const len = el.value.length;
      counter.textContent = `${len} / ${max}`;
      counter.classList.toggle('over', len > max);
    }
  });
}

// ===== Word Count =====
function updateWordCount(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const count = tmp.innerText.trim().split(/\s+/).filter(Boolean).length;
  const el = document.getElementById('word-count');
  if (el) el.textContent = `${count.toLocaleString()} words`;
}

// ===== History (localStorage) =====
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('govai_history') || '[]');
  const section = document.getElementById('history-section');
  const list = document.getElementById('history-list');
  if (history.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = history.slice(0, 5).map((h, i) =>
    `<div class="history-item" data-index="${i}"><span class="title">${h.projectTitle}</span><span class="date">${new Date(h.timestamp).toLocaleDateString()}</span></div>`
  ).join('');
  list.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      const h = history[idx];
      currentProposalData = h;
      documentContent.innerHTML = generateProposalHTML(h);
      updateWordCount(documentContent.innerHTML);
      emptyState.classList.add('hidden');
      resultState.classList.remove('hidden');
      showToast('Loaded from history', 'info');
    });
  });
}

function saveToHistory(data) {
  const history = JSON.parse(localStorage.getItem('govai_history') || '[]');
  history.unshift({ ...data, timestamp: Date.now() });
  if (history.length > 10) history.pop();
  localStorage.setItem('govai_history', JSON.stringify(history));
}

// ===== Form Submit =====
const LOADING_STEPS = [
  'Analyzing agency requirements...', 'Structuring Executive Summary...',
  'Drafting Statement of Need...', 'Formulating Methodology...',
  'Calculating Budget Narrative...', 'Building Evaluation Plan...',
  'Compiling Organizational Background...', 'Generating Compliance Checklist...'
];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(4)) return;
  const budgetVals = getBudgetValues();
  currentProposalData = {
    orgName: document.getElementById('orgName').value,
    projectTitle: document.getElementById('projectTitle').value,
    fundingAmount: document.getElementById('fundingAmount').value,
    grantAgency: document.getElementById('grantAgency').value,
    objectives: document.getElementById('objectives').value,
    pastPerformance: document.getElementById('pastPerformance').value,
    methodology: document.getElementById('methodology').value || '',
    projectDuration: document.getElementById('projectDuration').value || '24',
    budget: { personnel: budgetVals[0], equipment: budgetVals[1], operations: budgetVals[2], evaluation: budgetVals[3] }
  };

  emptyState.classList.add('hidden');
  resultState.classList.add('hidden');
  loadingState.classList.remove('hidden');
  generateBtn.disabled = true;

  for (let i = 0; i < LOADING_STEPS.length; i++) {
    loadingStep.innerText = LOADING_STEPS[i];
    progressBar.style.width = `${((i + 1) / LOADING_STEPS.length) * 100}%`;
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  }

  documentContent.innerHTML = generateProposalHTML(currentProposalData);
  updateWordCount(documentContent.innerHTML);
  loadingState.classList.add('hidden');
  resultState.classList.remove('hidden');
  generateBtn.disabled = false;
  saveToHistory(currentProposalData);
  loadHistory();
  showToast('Proposal generated successfully!', 'success');
});

// ===== Proposal Generator =====
function generateProposalHTML(d) {
  const amt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.fundingAmount);
  const agency = AGENCY_TEMPLATES[d.grantAgency] || { name: d.grantAgency, focus: 'federal programs', criteria: 'merit and impact', compliance: [] };
  const b = d.budget || { personnel: 45, equipment: 25, operations: 20, evaluation: 10 };
  const dur = d.projectDuration || 24;
  const p1End = Math.round(dur * 0.2), p2End = Math.round(dur * 0.75);
  const methodology = d.methodology || 'A structured multi-phase approach with stakeholder engagement, iterative implementation, and continuous evaluation.';

  const sections = [
    { t: '1. Executive Summary', c: `<p><strong>${d.orgName}</strong> is seeking <strong>${amt}</strong> from the <strong>${agency.name}</strong> to fund the <strong>"${d.projectTitle}"</strong> project over ${dur} months. This initiative directly supports the agency's mission of ${agency.focus}. By leveraging innovative approaches, this project will deliver measurable outcomes evaluated against ${agency.criteria}.</p>` },
    { t: '2. Statement of Need', c: `<p>There is a critical deficit in resources addressing the challenges targeted by this initiative. Without targeted funding, these challenges will compound. Our objectives:</p><p style="padding-left:15px;border-left:3px solid rgba(99,102,241,0.3);font-style:italic;margin:10px 0;">${d.objectives.replace(/\n/g, '<br/>')}</p><p>This proposal provides an evidence-based pathway to mitigate these issues.</p>` },
    { t: '3. Project Design & Methodology', c: `<p>${methodology}</p><p>The project is structured in three phases over <strong>${dur} months</strong>:</p><ul><li><strong>Phase 1 (Months 1–${p1End}):</strong> Planning, stakeholder engagement, baseline metrics.</li><li><strong>Phase 2 (Months ${p1End + 1}–${p2End}):</strong> Core implementation, scaling, and feedback loops.</li><li><strong>Phase 3 (Months ${p2End + 1}–${dur}):</strong> Transition, sustainability planning, and knowledge transfer.</li></ul>` },
    { t: '4. Evaluation Plan', c: `<p>A mixed-methods evaluation strategy aligned with ${agency.criteria}. Formative assessments during Phases 1–2 guide quality improvement. Summative evaluations measure total impact. KPIs: engagement rates, milestone completion, resource efficiency, and outcome metrics specific to ${agency.focus}.</p>` },
    { t: '5. Budget Narrative', c: `<p>Total budget: <strong>${amt}</strong>, allocated for maximum ROI:</p><ul><li><strong>Personnel (${b.personnel}%):</strong> Project staff, SMEs, and management.</li><li><strong>Equipment & Materials (${b.equipment}%):</strong> Infrastructure and tools.</li><li><strong>Operations (${b.operations}%):</strong> Logistics, outreach, admin overhead.</li><li><strong>Evaluation (${b.evaluation}%):</strong> Independent assessment and compliance.</li></ul>` },
    { t: '6. Organizational Background', c: `<p><strong>${d.orgName}</strong> has a proven track record managing federal initiatives with strict compliance.</p><p><strong>Past Performance:</strong><br/>${d.pastPerformance.replace(/\n/g, '<br/>')}</p><p>Our institutional infrastructure ensures the success of this project.</p>` }
  ];

  let html = `<div id="proposal-export-area">
    <div class="doc-section" style="animation-delay:0s;border-bottom:2px solid var(--glass-border);padding-bottom:1rem;margin-bottom:1.5rem;">
      <h1 style="font-size:1.6rem;margin-bottom:0.4rem;background:linear-gradient(90deg,var(--accent-primary),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${d.projectTitle}</h1>
      <p style="color:var(--text-muted)"><strong>Applicant:</strong> ${d.orgName} | <strong>Agency:</strong> ${agency.name} | <strong>Funding:</strong> ${amt}</p>
    </div>`;

  sections.forEach((s, i) => {
    html += `<div class="doc-section" style="animation-delay:${i * 0.1}s"><h3>${s.t}</h3>${s.c}</div>`;
  });

  if (agency.compliance && agency.compliance.length) {
    html += `<div class="doc-section compliance-section" style="animation-delay:${sections.length * 0.1}s">
      <h3>7. Compliance & Submission Checklist</h3>
      <p>Key requirements for submitting to <strong>${agency.name}</strong>. Use this checklist before final submission:</p>
      <ul class="compliance-list">${agency.compliance.map(item => `<li><span class="check-box">☐</span>${item}</li>`).join('')}</ul>
    </div>`;
  }

  return html + '</div>';
}

// ===== PDF Download =====
// jsPDF helvetica uses Latin-1/WinAnsi — strip characters outside that range
function pdfSafe(text) {
  return text
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[^\x00-\xFF]/g, '');
}

downloadPdfBtn.addEventListener('click', () => {
  const d = currentProposalData;
  if (!d.projectTitle) { showToast('No proposal to export', 'error'); return; }

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const amt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.fundingAmount);
  const agency = AGENCY_TEMPLATES[d.grantAgency] || { name: d.grantAgency, compliance: [] };
  const b = d.budget || { personnel: 45, equipment: 25, operations: 20, evaluation: 10 };
  const dur = d.projectDuration || 24;
  const margin = 60;
  const pageW = 612 - margin * 2;
  let y = 60;

  function checkPage(needed) {
    if (y + needed > 720) { doc.addPage(); y = 60; }
  }

  function addHeading(text, size, color) {
    checkPage(size + 10);
    doc.setFontSize(size);
    doc.setTextColor(color || '#000000');
    doc.setFont('helvetica', 'bold');
    doc.text(pdfSafe(text), margin, y);
    y += size + 8;
  }

  function addParagraph(text) {
    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(pdfSafe(text), pageW);
    lines.forEach(line => { checkPage(16); doc.text(line, margin, y); y += 15; });
    y += 6;
  }

  function addBullet(text) {
    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(pdfSafe(text), pageW - 20);
    lines.forEach((line, i) => { checkPage(16); doc.text(i === 0 ? '-  ' + line : '   ' + line, margin, y); y += 15; });
  }

  addHeading(d.projectTitle, 20, '#1e293b');
  doc.setFontSize(10); doc.setTextColor('#64748b'); doc.setFont('helvetica', 'normal');
  doc.text(`Applicant: ${d.orgName}  |  Agency: ${agency.name}  |  Funding: ${amt}`, margin, y);
  y += 12;
  doc.setDrawColor('#e2e8f0'); doc.line(margin, y, 612 - margin, y); y += 20;

  addHeading('1. Executive Summary', 14, '#4f46e5');
  addParagraph(`${d.orgName} is seeking ${amt} from the ${agency.name} to fund the "${d.projectTitle}" project over ${dur} months. This initiative supports the agency's mission and will deliver measurable outcomes.`);

  addHeading('2. Statement of Need', 14, '#4f46e5');
  addParagraph('There is a critical deficit in resources addressing the challenges targeted by this initiative. Our objectives:');
  d.objectives.split('\n').filter(Boolean).forEach(o => addBullet(o.replace(/^\d+\.\s*/, '')));
  y += 4;

  addHeading('3. Project Design & Methodology', 14, '#4f46e5');
  addParagraph(d.methodology || 'A structured multi-phase approach with stakeholder engagement and iterative evaluation.');
  const p1 = Math.round(dur * 0.2), p2 = Math.round(dur * 0.75);
  addBullet(`Phase 1 (Months 1-${p1}): Planning, stakeholder engagement, baseline metrics.`);
  addBullet(`Phase 2 (Months ${p1 + 1}-${p2}): Core implementation and scaling.`);
  addBullet(`Phase 3 (Months ${p2 + 1}-${dur}): Transition and sustainability.`);
  y += 4;

  addHeading('4. Evaluation Plan', 14, '#4f46e5');
  addParagraph('A mixed-methods evaluation strategy will be employed. KPIs include engagement rates, milestone completion, and resource efficiency.');

  addHeading('5. Budget Narrative', 14, '#4f46e5');
  addParagraph(`Total budget: ${amt}`);
  addBullet(`Personnel (${b.personnel}%): Project staff, SMEs, management.`);
  addBullet(`Equipment & Materials (${b.equipment}%): Infrastructure and tools.`);
  addBullet(`Operations (${b.operations}%): Logistics, outreach, admin.`);
  addBullet(`Evaluation (${b.evaluation}%): Assessment and compliance.`);
  y += 4;

  addHeading('6. Organizational Background', 14, '#4f46e5');
  addParagraph(`${d.orgName} has a proven track record managing federal initiatives.`);
  d.pastPerformance.split('\n').filter(Boolean).forEach(p => addBullet(p.replace(/^-\s*/, '')));

  if (agency.compliance && agency.compliance.length) {
    y += 4;
    addHeading('7. Compliance & Submission Checklist', 14, '#4f46e5');
    addParagraph(`Key requirements for submitting to ${agency.name}:`);
    agency.compliance.forEach(item => addBullet(`[ ]  ${pdfSafe(item)}`));
  }

  doc.save(`${d.projectTitle.replace(/\s+/g, '_')}_Proposal.pdf`);
  showToast('PDF downloaded!', 'success');
});

// ===== Markdown Download =====
downloadMdBtn.addEventListener('click', () => {
  const d = currentProposalData;
  if (!d.projectTitle) { showToast('No proposal to export', 'error'); return; }
  const amt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.fundingAmount);
  const agency = AGENCY_TEMPLATES[d.grantAgency] || { name: d.grantAgency, compliance: [] };
  const b = d.budget || { personnel: 45, equipment: 25, operations: 20, evaluation: 10 };
  const complianceList = (agency.compliance || []).map(item => `- [ ] ${item}`).join('\n');

  const md = `# ${d.projectTitle}
**Applicant:** ${d.orgName}
**Target Agency:** ${agency.name}
**Requested Funding:** ${amt}
**Duration:** ${d.projectDuration || 24} months

## 1. Executive Summary
${d.orgName} is seeking ${amt} from the ${agency.name} to fund the "${d.projectTitle}" project.

## 2. Statement of Need
${d.objectives}

## 3. Project Design & Methodology
${d.methodology || 'Multi-phase approach with stakeholder engagement and iterative evaluation.'}

## 4. Evaluation Plan
Mixed-methods evaluation measuring KPIs including engagement rates and milestone completion.

## 5. Budget Narrative
- **Personnel:** ${b.personnel}%
- **Equipment & Materials:** ${b.equipment}%
- **Operations & Logistics:** ${b.operations}%
- **Evaluation & Reporting:** ${b.evaluation}%

## 6. Organizational Background
${d.pastPerformance}
${complianceList ? `\n## 7. Compliance & Submission Checklist\n${complianceList}` : ''}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${d.projectTitle.replace(/\s+/g, '_')}_Proposal.md`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Markdown downloaded!', 'success');
});

// ===== Copy =====
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(documentContent.innerText).then(() => showToast('Copied to clipboard!', 'success'));
});

// ===== New Proposal =====
document.getElementById('new-proposal-btn').addEventListener('click', () => {
  currentStep = 1;
  currentProposalData = {};
  form.reset();
  [['budget-personnel', 45], ['budget-equipment', 25], ['budget-operations', 20], ['budget-evaluation', 10]].forEach(([id, val]) => {
    document.getElementById(id).value = val;
  });
  sliderIds.forEach((id, i) => {
    document.getElementById(valueIds[i]).textContent = document.getElementById(id).value + '%';
  });
  updateBudgetTotal();
  syncCharCounters();
  resultState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  updateWizard();
  loadHistory();
});

// ===== Init =====
updateWizard();
updateBudgetTotal();
loadHistory();
setupCharCounters();
