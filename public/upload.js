const uploadCard = document.getElementById('uploadCard');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');

// Add spinner element to the DOM
let spinner = document.createElement('div');
spinner.id = 'loadingSpinner';
spinner.style = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(255,255,255,0.7);z-index:9999;align-items:center;justify-content:center;';
spinner.innerHTML = '<div style="font-size:2rem;color:#b0892b;"><span class="spinner-anim" style="display:inline-block;width:2.5rem;height:2.5rem;border:4px solid #e9d8a6;border-top:4px solid #b0892b;border-radius:50%;animation:spin 1s linear infinite;"></span><br>Processing...</div>';
document.body.appendChild(spinner);

// Add spinner animation CSS
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
document.head.appendChild(style);

function showSpinner() { spinner.style.display = 'flex'; }
function hideSpinner() { spinner.style.display = 'none'; }

['dragenter', 'dragover'].forEach(eventName => {
  uploadCard.addEventListener(eventName, e => {
    e.preventDefault();
    e.stopPropagation();
    uploadCard.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(eventName => {
  uploadCard.addEventListener(eventName, e => {
    e.preventDefault();
    e.stopPropagation();
    uploadCard.classList.remove('dragover');
  });
});
uploadCard.addEventListener('drop', e => {
  const files = e.dataTransfer.files;
  if (files.length) {
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      try {
        const pdf = await window['pdfjsLib'].getDocument({data: typedarray}).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromPDFWithGemini(file) {
  // Convert file to base64
  const fileBuffer = await file.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  const apiKey = 'AIzaSyBaz2sfHp8J_qlQlWxirYEur6PpLUwcvCw';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Extract all text content from this PDF file. Return only the extracted text content, no additional commentary.' },
          { inline_data: { mime_type: 'application/pdf', data: base64String } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  });
  if (!response.ok) throw new Error('Gemini API error: ' + response.status);
  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('Unexpected response format from Gemini API');
  }
}

document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  showSpinner();
  let text = '';
  try {
    if (file.type === 'text/plain') {
      text = await file.text();
    } else if (file.type === 'application/pdf') {
      try {
        text = await extractTextFromPDFWithGemini(file);
      } catch (err) {
        // fallback to PDF.js if Gemini fails
        try {
          text = await extractTextFromPDF(file);
        } catch (err2) {
          alert('Failed to extract text from PDF. Please try another file.');
          hideSpinner();
          return;
        }
      }
    } else {
      alert('Unsupported file type. Please upload a .txt or .pdf file.');
      hideSpinner();
      return;
    }
    summarizeText(text);
    // Store noteText for analysis details
    sessionStorage.setItem('noteText', text);
  } catch (err) {
    alert('Failed to extract text from file. Please try another file.');
    hideSpinner();
    return;
  }
});

async function summarizeText(text) {
  const summaryResult = document.getElementById('summaryResult');
  const summaryText = document.getElementById('summaryText');
  const keywordsList = document.getElementById('keywordsList');
  summaryResult.style.display = 'none';
  summaryText.textContent = '';
  keywordsList.innerHTML = '';

  try {
    const apiKey = 'AIzaSyBaz2sfHp8J_qlQlWxirYEur6PpLUwcvCw';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please analyze the following notes and provide:\n1. A concise summary (2-3 paragraphs)\n2. 5-8 important keywords/concepts (separated by commas after \"KEYWORDS:\")\n\nNotes: ${text.substring(0, 4000)}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const result = data.candidates[0].content.parts[0].text;
      const keywordMatch = result.match(/KEYWORDS:\s*(.+)/i);
      let keywords = [];
      if (keywordMatch) {
        keywords = keywordMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
      const summary = result.split(/KEYWORDS:/i)[0].trim();
      summaryText.textContent = summary;
      keywords.forEach(k => {
        const li = document.createElement('li');
        li.textContent = k;
        keywordsList.appendChild(li);
      });
      // Store in sessionStorage for summary page
      sessionStorage.setItem('summary', summary);
      sessionStorage.setItem('keywords', JSON.stringify(keywords));
      // Redirect to summary page
      hideSpinner();
      window.location = 'summary.html';
      return;
    } else {
      hideSpinner();
      summaryText.textContent = 'Unable to generate summary. Please try again.';
      summaryResult.style.display = '';
    }
  } catch (error) {
    hideSpinner();
    summaryText.textContent = 'Error generating summary. Please check your connection and try again.';
    summaryResult.style.display = '';
  }
}

fileInput.addEventListener('change', function() {
  fileName.textContent = fileInput.files.length ? fileInput.files[0].name : '';
}); 