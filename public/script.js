// Theme toggle
const themeBtn = document.getElementById('themeBtn');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let darkMode = localStorage.getItem('theme') === 'dark' || (prefersDark && !localStorage.getItem('theme'));

function setTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeBtn.textContent = dark ? '🌙' : '🌞';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}
themeBtn.onclick = () => {
  darkMode = !darkMode;
  setTheme(darkMode);
};
setTheme(darkMode);

// Navigation
function showWorkspace() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('workspace').style.display = '';
}
function showWelcome() {
  document.getElementById('workspace').style.display = 'none';
  document.getElementById('welcome').style.display = '';
}

// Tabs
function showTab(tab) {
  ['upload', 'manual', 'voice'].forEach(t => {
    document.getElementById('tab-' + t).style.display = (t === tab) ? '' : 'none';
    document.querySelector('.tab.' + t)?.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(btn => {
    if (btn.textContent.replace(/\s/g, '').toLowerCase().includes(tab)) {
      btn.classList.add('active');
    }
  });
}
window.showWorkspace = showWorkspace;
window.showWelcome = showWelcome;
window.showTab = showTab;

// Summarize manual input
async function summarizeManual() {
  const textarea = document.querySelector('#tab-manual textarea');
  const text = textarea.value;
  if (!text) return alert('Please enter some text.');
  // Simulate API call
  alert('Summary: This is a sample summary.\nKeywords: sample, summary');
}

// Upload file and summarize
async function uploadFile() {
  const input = document.querySelector('#tab-upload input[type="file"]');
  if (!input.files.length) return alert('Please select a file.');
  // Simulate API call
  alert('Summary: This is a sample summary from file.\nKeywords: file, summary');
}

// Attach to buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#tab-manual button').onclick = summarizeManual;
  document.querySelector('#tab-upload input[type="file"]').onchange = uploadFile;
});