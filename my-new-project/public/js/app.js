// ===== APP.JS - Route Analysis Dashboard =====

// State Management
const state = {
  currentTab: 'upload',
  uploadedFile: null,
  mergeFiles: [],
  analysisType: 'store-metrics',
  theme: localStorage.getItem('theme') || 'light'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  initializeTabs();
  initializeUpload();
  initializeAnalysis();
  initializeTableau();
  initializeMerge();
  initializeResults();
});

// ===== THEME MANAGEMENT =====
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Set initial theme
  html.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  
  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const icon = document.querySelector('.theme-icon');
  icon.textContent = state.theme === 'light' ? '🌙' : '☀️';
}

// ===== TAB MANAGEMENT =====
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update panes
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      state.currentTab = tabName;
    });
  });
}

// ===== FILE UPLOAD =====
function initializeUpload() {
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const fileName = document.getElementById('fileName');
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      state.uploadedFile = file;
      fileName.textContent = `✅ ${file.name} (${formatFileSize(file.size)})`;
    }
  });
  
  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      state.uploadedFile = file;
      fileName.textContent = `✅ ${file.name} (${formatFileSize(file.size)})`;
      fileInput.files = e.dataTransfer.files;
    } else {
      showNotification('Please upload a CSV file', 'error');
    }
  });
}

// ===== ANALYSIS TYPE SELECTION =====
function initializeAnalysis() {
  const analysisRadios = document.querySelectorAll('input[name="analysis"]');
  const storeInput = document.getElementById('storeInput');
  const runButton = document.getElementById('runAnalysis');
  
  // Show/hide store input based on analysis type
  analysisRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.analysisType = e.target.value;
      const requiresStore = ['driver-store', 'multiday'].includes(e.target.value);
      storeInput.style.display = requiresStore ? 'block' : 'none';
    });
  });
  
  // Run analysis
  runButton.addEventListener('click', async () => {
    if (!state.uploadedFile) {
      showNotification('Please upload a CSV file first', 'error');
      return;
    }
    
    const storeId = document.getElementById('storeId').value;
    const requiresStore = ['driver-store', 'multiday'].includes(state.analysisType);
    
    if (requiresStore && !storeId) {
      showNotification('Please enter a Store ID', 'error');
      return;
    }
    
    await runAnalysis(state.uploadedFile, state.analysisType, storeId);
  });
}

// ===== TABLEAU INTEGRATION =====
function initializeTableau() {
  const timeRangeRadios = document.querySelectorAll('input[name="timeRange"]');
  const customDateRange = document.getElementById('customDateRange');
  const fetchButton = document.getElementById('fetchTableau');
  
  // Show/hide custom date range
  timeRangeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
  });
  
  // Fetch from Tableau
  fetchButton.addEventListener('click', async () => {
    const timeRange = document.querySelector('input[name="timeRange"]:checked').value;
    let days = null;
    let startDate = null;
    let endDate = null;
    
    if (timeRange === 'custom') {
      startDate = document.getElementById('startDate').value;
      endDate = document.getElementById('endDate').value;
      
      if (!startDate || !endDate) {
        showNotification('Please select both start and end dates', 'error');
        return;
      }
    } else {
      days = parseInt(timeRange);
    }
    
    const storeId = document.getElementById('tableauStore').value || null;
    
    await fetchTableauData(days, startDate, endDate, storeId);
  });
}

// ===== CSV MERGE =====
function initializeMerge() {
  const mergeFilesInput = document.getElementById('mergeFiles');
  const filesList = document.getElementById('filesList');
  const mergeButton = document.getElementById('mergeFilesBtn');
  
  mergeFilesInput.addEventListener('change', (e) => {
    state.mergeFiles = Array.from(e.target.files);
    renderFilesList();
    mergeButton.disabled = state.mergeFiles.length < 2;
  });
  
  mergeButton.addEventListener('click', async () => {
    const removeDuplicates = document.getElementById('removeDuplicates').checked;
    await mergeCSVFiles(state.mergeFiles, removeDuplicates);
  });
  
  function renderFilesList() {
    if (state.mergeFiles.length === 0) {
      filesList.innerHTML = '';
      return;
    }
    
    filesList.innerHTML = `
      <h4>Selected Files (${state.mergeFiles.length}):</h4>
      ${state.mergeFiles.map((file, index) => `
        <div class="file-item">
          <div class="file-info">
            <span>📄</span>
            <span>${file.name}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
          </div>
          <button class="file-remove" onclick="removeFile(${index})">Remove</button>
        </div>
      `).join('')}
    `;
  }
  
  window.removeFile = (index) => {
    state.mergeFiles.splice(index, 1);
    renderFilesList();
    mergeButton.disabled = state.mergeFiles.length < 2;
  };
}

// ===== RESULTS MANAGEMENT =====
function initializeResults() {
  const closeButton = document.getElementById('closeResults');
  const resultsTabButtons = document.querySelectorAll('.results-tab-btn');
  
  closeButton.addEventListener('click', () => {
    document.getElementById('resultsSection').style.display = 'none';
  });
  
  resultsTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.resultsTab;
      
      resultsTabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      document.querySelectorAll('.results-tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  document.getElementById('downloadReport').addEventListener('click', downloadReport);
  document.getElementById('downloadJson').addEventListener('click', downloadJSON);
}

// ===== API CALLS =====

async function runAnalysis(file, analysisType, storeId = null) {
  const formData = new FormData();
  formData.append('csv', file);
  formData.append('analysisType', analysisType);
  if (storeId) formData.append('storeId', storeId);
  
  showLoading('Running analysis...');
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Analysis failed');
    
    const result = await response.json();
    displayResults(result);
    hideLoading();
  } catch (error) {
    hideLoading();
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function fetchTableauData(days, startDate, endDate, storeId) {
  showLoading('Fetching data from Tableau...');
  
  const params = new URLSearchParams();
  if (days) params.append('days', days);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (storeId) params.append('store', storeId);
  
  try {
    const response = await fetch(`/api/tableau-fetch?${params}`);
    if (!response.ok) throw new Error('Tableau fetch failed');
    
    const result = await response.json();
    console.log('📊 Tableau fetch result:', result);
    hideLoading();

    showNotification(`Successfully fetched ${result.rows} rows from Tableau!`, 'success');

    // Auto-run Tableau metrics analysis
    if (result.filePath) {
      console.log('🔍 Running analysis on:', result.filePath);
      await runAnalysisOnPath(result.filePath, 'tableau-metrics');
    } else {
      console.error('❌ No filePath in result:', result);
    }
  } catch (error) {
    hideLoading();
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function mergeCSVFiles(files, removeDuplicates) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('removeDuplicates', removeDuplicates);
  
  showLoading('Merging CSV files...');
  
  try {
    const response = await fetch('/api/merge-csv', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Merge failed');
    
    const result = await response.json();
    hideLoading();
    showNotification(`Successfully merged ${files.length} files into ${result.rows} rows!`, 'success');
    
    // Optionally run analysis on merged data
    if (result.filePath) {
      const shouldAnalyze = confirm('Run analysis on merged data?');
      if (shouldAnalyze) {
        await runAnalysisOnPath(result.filePath);
      }
    }
  } catch (error) {
    hideLoading();
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function runAnalysisOnPath(filePath, analysisType = 'store-metrics') {
  console.log('🚀 runAnalysisOnPath called:', { filePath, analysisType });
  showLoading('Running analysis...');

  // Auto-detect Tableau data
  if (filePath.includes('tableau-')) {
    analysisType = 'tableau-metrics';
    console.log('🎯 Detected Tableau data, using tableau-metrics analysis');
  }

  try {
    console.log('📤 Sending analysis request...');
    const response = await fetch('/api/analyze-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, analysisType })
    });

    console.log('📥 Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Analysis failed:', errorText);
      throw new Error('Analysis failed');
    }

    const result = await response.json();
    console.log('✅ Analysis result:', result);
    displayResults(result);
    hideLoading();
  } catch (error) {
    console.error('💥 Error in runAnalysisOnPath:', error);
    hideLoading();
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// ===== RESULTS DISPLAY =====

function displayResults(result) {
  console.log('🎨 displayResults called with:', result);

  const resultsSection = document.getElementById('resultsSection');
  const summaryText = document.getElementById('summaryText');
  const detailedText = document.getElementById('detailedText');
  const rawJson = document.getElementById('rawJson');
  const statsCards = document.getElementById('statsCards');
  const chartsSection = document.getElementById('chartsSection');

  // Show results section
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });

  // Display text reports - FIXED to handle both Tableau and CSV formats
  // Tableau: { summary: {object}, report: "string", ... }
  // CSV: { summary: "string", detailed: "string", data: {object} }
  const summaryContent = (typeof result.summary === 'string' ? result.summary : result.report) || 'No summary available';
  const detailedContent = result.detailed || result.report || 'No detailed report available';

  console.log('📝 Summary:', typeof summaryContent, summaryContent?.substring(0, 100));
  console.log('📝 Detailed:', typeof detailedContent, detailedContent?.substring(0, 100));

  summaryText.textContent = summaryContent;
  detailedText.textContent = detailedContent;
  rawJson.textContent = JSON.stringify(result, null, 2);
  
  // Generate stats cards
  if (result.stats) {
    renderStatsCards(result.stats, statsCards);
  }
  
  // Generate charts
  if (result.data) {
    renderCharts(result.data, chartsSection);
  }
  
  // Store result for downloads
  window.currentResult = result;
}

function renderStatsCards(stats, container) {
  const cards = Object.entries(stats).map(([key, value]) => `
    <div class="stat-card">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${formatStatLabel(key)}</div>
    </div>
  `).join('');
  
  container.innerHTML = cards;
}

function renderCharts(data, container) {
  container.innerHTML = '';
  
  // Example: DPH by Store chart
  if (data.store_metrics) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-container';
    chartDiv.innerHTML = '<canvas id="dphChart"></canvas>';
    container.appendChild(chartDiv);
    
    setTimeout(() => {
      createDPHChart(data.store_metrics);
    }, 100);
  }
}

function createDPHChart(storeMetrics) {
  const ctx = document.getElementById('dphChart');
  if (!ctx) return;
  
  const sortedStores = storeMetrics.sort((a, b) => b.avg_dph - a.avg_dph).slice(0, 10);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedStores.map(s => `Store ${s.store_id}`),
      datasets: [{
        label: 'DPH (Deliveries Per Hour)',
        data: sortedStores.map(s => s.avg_dph),
        backgroundColor: 'rgba(0, 113, 206, 0.7)',
        borderColor: 'rgba(0, 113, 206, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Top 10 Stores by DPH'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Deliveries Per Hour'
          }
        }
      }
    }
  });
}

// ===== HELPER FUNCTIONS =====

function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  text.textContent = message;
  overlay.classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

function showNotification(message, type = 'info') {
  // Simple alert for now - could be enhanced with toast notifications
  const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  alert(`${emoji} ${message}`);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatStatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function downloadReport() {
  if (!window.currentResult) return;
  
  const text = window.currentResult.report || window.currentResult.summary || '';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON() {
  if (!window.currentResult) return;
  
  const json = JSON.stringify(window.currentResult, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-data-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
