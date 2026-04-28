import html2pdf from 'html2pdf.js';

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

let currentProposalData = {};

const LOADING_STEPS = [
  "Analyzing agency requirements and guidelines...",
  "Structuring Executive Summary...",
  "Drafting Statement of Need & Problem Context...",
  "Formulating Methodology and Objectives...",
  "Calculating Budget Narrative...",
  "Finalizing Evaluation Plan..."
];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get Form Values
  const orgName = document.getElementById('orgName').value;
  const projectTitle = document.getElementById('projectTitle').value;
  const fundingAmount = document.getElementById('fundingAmount').value;
  const grantAgency = document.getElementById('grantAgency').value;
  const objectives = document.getElementById('objectives').value;
  const pastPerformance = document.getElementById('pastPerformance').value;

  // Save for markdown export
  currentProposalData = { orgName, projectTitle, fundingAmount, grantAgency, objectives, pastPerformance };

  // UI Transitions
  emptyState.classList.add('hidden');
  resultState.classList.add('hidden');
  loadingState.classList.remove('hidden');
  generateBtn.disabled = true;
  generateBtn.style.opacity = '0.5';

  // Simulate AI Generation Process
  await simulateAIGeneration();

  // Generate Document
  const generatedHTML = generateProposalDocument(orgName, projectTitle, fundingAmount, grantAgency, objectives, pastPerformance);
  documentContent.innerHTML = generatedHTML;

  // UI Transitions
  loadingState.classList.add('hidden');
  resultState.classList.remove('hidden');
  generateBtn.disabled = false;
  generateBtn.style.opacity = '1';
});

async function simulateAIGeneration() {
  const totalDuration = 6000; // 6 seconds simulation
  const interval = totalDuration / LOADING_STEPS.length;
  
  for (let i = 0; i < LOADING_STEPS.length; i++) {
    loadingStep.innerText = LOADING_STEPS[i];
    const progress = ((i + 1) / LOADING_STEPS.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Staggered animation delay
    await new Promise(resolve => setTimeout(resolve, interval + (Math.random() * 500 - 250)));
  }
  
  loadingStep.innerText = "Formatting final document...";
  await new Promise(resolve => setTimeout(resolve, 500));
}

function generateProposalDocument(org, title, amount, agency, objectives, pastPerformance) {
  // Format currency
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const agencyNames = {
    'NSF': 'National Science Foundation',
    'NIH': 'National Institutes of Health',
    'DOE': 'Department of Energy',
    'ED': 'Department of Education',
    'OTHER': 'Federal Grant Review Board'
  };

  const agencyFullName = agencyNames[agency] || 'Federal Agency';

  const sections = [
    {
      title: "1. Executive Summary",
      content: `<p><strong>${org}</strong> is seeking <strong>${formattedAmount}</strong> from the <strong>${agencyFullName}</strong> to fund the <strong>"${title}"</strong> project. This initiative aligns directly with the agency's strategic goals by addressing critical capability gaps. By leveraging innovative approaches, this project will deliver measurable outcomes, scaling impact efficiently across the target demographic.</p>`
    },
    {
      title: "2. Statement of Need",
      content: `<p>Currently, there is a pronounced deficit in resources addressing the challenges targeted by our initiative. The core issue requires immediate intervention. As outlined in our objectives:</p>
                <p><em>"${objectives}"</em></p>
                <p>Without targeted funding, these challenges will compound. Our proposal provides an evidence-based pathway to mitigate these issues and establish a sustainable framework for the future.</p>`
    },
    {
      title: "3. Project Design and Methodology",
      content: `<p>The <strong>${title}</strong> will be implemented in three phased stages over a 24-month performance period:</p>
                <ul>
                  <li><strong>Phase 1: Planning & Deployment (Months 1-4):</strong> Stakeholder engagement, infrastructure setup, and baseline metric establishment.</li>
                  <li><strong>Phase 2: Execution & Scaling (Months 5-18):</strong> Direct implementation of core objectives, iterative feedback loops, and capability scaling.</li>
                  <li><strong>Phase 3: Transition & Sustainability (Months 19-24):</strong> Knowledge transfer, final reporting, and institutionalizing the framework for post-grant sustainability.</li>
                </ul>`
    },
    {
      title: "4. Evaluation Plan",
      content: `<p>A mixed-methods evaluation strategy will be employed. Formative assessments will guide continuous quality improvement during Phases 1 and 2. Summative evaluations will measure total impact against the baseline metrics. Key Performance Indicators (KPIs) include engagement rates, milestone completion percentage, and resource efficiency ratios.</p>`
    },
    {
      title: "5. Budget Narrative",
      content: `<p>The total requested budget of <strong>${formattedAmount}</strong> is meticulously calculated to ensure high ROI. The allocation is distributed as follows:</p>
                <ul>
                  <li><strong>Personnel (45%):</strong> Direct labor, project management, and specialized Subject Matter Experts (SMEs).</li>
                  <li><strong>Equipment & Materials (25%):</strong> Essential technological infrastructure and implementation tools.</li>
                  <li><strong>Operations & Logistics (20%):</strong> Deployment costs, outreach, and administrative overhead.</li>
                  <li><strong>Evaluation & Reporting (10%):</strong> Independent assessment and compliance monitoring.</li>
                </ul>`
    },
    {
      title: "6. Organizational Background & Track Record",
      content: `<p><strong>${org}</strong> has a proven history of executing complex initiatives and managing federal/state grants with strict compliance and outstanding results.</p>
                <p><em>Past Performance Highlights:</em><br/>${pastPerformance.replace(/\n/g, '<br/>')}</p>
                <p>Our institutional infrastructure provides robust financial controls and subject matter expertise to ensure the success of this proposed project.</p>`
    }
  ];

  let html = `<div id="proposal-export-area">
              <div class="doc-header" style="margin-bottom: 2rem; border-bottom: 2px solid var(--glass-border); padding-bottom: 1rem;">
                <h1 style="font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(90deg, var(--accent-primary), #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</h1>
                <p style="color: var(--text-muted);"><strong>Applicant:</strong> ${org} | <strong>Target:</strong> ${agencyFullName}</p>
              </div>`;

  sections.forEach((sec, index) => {
    html += `
      <div class="doc-section" style="animation-delay: ${index * 0.1}s">
        <h3>${sec.title}</h3>
        ${sec.content}
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// Event Listeners for New Functionality

sampleBtn.addEventListener('click', () => {
  document.getElementById('orgName').value = "Nexus Health Innovations";
  document.getElementById('projectTitle').value = "AI-Driven Diagnostic Accessibility Initiative";
  document.getElementById('fundingAmount').value = "1250000";
  document.getElementById('grantAgency').value = "NIH";
  document.getElementById('objectives').value = "1. Deploy AI diagnostic tools to 50 rural clinics.\n2. Reduce diagnostic latency by 40%.\n3. Train 200 healthcare professionals on the new platform.";
  document.getElementById('pastPerformance').value = "- Successfully managed a $500k HRSA grant in 2024 with zero compliance findings.\n- Developed and scaled a telemedicine platform reaching 10,000+ patients.\n- Partnered with 3 state health departments for tech integration.";
});

downloadMdBtn.addEventListener('click', () => {
  const { orgName, projectTitle, fundingAmount, grantAgency, objectives, pastPerformance } = currentProposalData;
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fundingAmount);
  
  const markdownContent = `# ${projectTitle}
**Applicant:** ${orgName}
**Target Agency:** ${grantAgency}
**Requested Funding:** ${formattedAmount}

## 1. Executive Summary
${orgName} is seeking ${formattedAmount} from the ${grantAgency} to fund the "${projectTitle}" project. This initiative aligns directly with the agency's strategic goals by addressing critical capability gaps.

## 2. Statement of Need
Currently, there is a pronounced deficit in resources addressing the challenges targeted by our initiative. As outlined in our objectives:
${objectives}

## 3. Project Design and Methodology
- **Phase 1:** Planning & Deployment
- **Phase 2:** Execution & Scaling
- **Phase 3:** Transition & Sustainability

## 4. Evaluation Plan
A mixed-methods evaluation strategy will be employed, measuring Key Performance Indicators (KPIs) including engagement rates and milestone completion.

## 5. Budget Narrative
- **Personnel:** 45%
- **Equipment & Materials:** 25%
- **Operations & Logistics:** 20%
- **Evaluation & Reporting:** 10%

## 6. Organizational Background & Track Record
${orgName} has a proven history of executing complex initiatives.
**Past Performance Highlights:**
${pastPerformance}
`;

  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectTitle.replace(/\s+/g, '_')}_Proposal.md`;
  a.click();
  URL.revokeObjectURL(url);
});

downloadPdfBtn.addEventListener('click', () => {
  const originalElement = document.getElementById('proposal-export-area');
  
  // Create a clone to avoid affecting the UI
  const wrapper = document.createElement('div');
  const clone = originalElement.cloneNode(true);
  wrapper.appendChild(clone);
  
  // Style the wrapper to ensure full height and white background for html2canvas
  wrapper.style.position = 'absolute';
  wrapper.style.top = '-9999px';
  wrapper.style.left = '0';
  wrapper.style.width = '800px'; // Standard width for letter size
  wrapper.style.background = '#ffffff';
  wrapper.style.padding = '40px';
  wrapper.style.color = '#000000';
  wrapper.style.fontFamily = 'Inter, sans-serif';
  wrapper.style.lineHeight = '1.6';

  // Override dark mode CSS variables and explicit colors for descendants
  const allElements = wrapper.querySelectorAll('*');
  allElements.forEach(el => {
    if (el.tagName === 'H1') {
      el.style.background = 'none';
      el.style.webkitBackgroundClip = 'initial';
      el.style.webkitTextFillColor = 'initial';
      el.style.color = '#000000';
      el.style.borderBottom = '2px solid #e2e8f0';
    } else if (el.tagName === 'H3') {
      el.style.color = '#4f46e5'; // Keep primary accent for headers
      el.style.marginTop = '1.5rem';
    } else {
      el.style.color = '#1e293b'; // Slate 800 for readable text instead of faint grey
    }
  });

  // Temporarily add to body so html2canvas can measure full height (fixes truncation)
  document.body.appendChild(wrapper);

  const opt = {
    margin:       0.5,
    filename:     `${currentProposalData.projectTitle ? currentProposalData.projectTitle.replace(/\s+/g, '_') : 'Proposal'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  html2pdf().set(opt).from(wrapper).save().then(() => {
    // Cleanup
    document.body.removeChild(wrapper);
  });
});

// Copy to Clipboard
copyBtn.addEventListener('click', () => {
  const text = documentContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  });
});
