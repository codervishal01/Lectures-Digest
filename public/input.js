document.getElementById('inputForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const textarea = document.getElementById('manualText');
  const text = textarea.value;
  if (!text) return;
  summarizeText(text);
  // Store noteText for analysis details
  sessionStorage.setItem('noteText', text);
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
      // Store in sessionStorage for summary page
      sessionStorage.setItem('summary', summary);
      sessionStorage.setItem('keywords', JSON.stringify(keywords));
      // Redirect to summary page
      window.location = 'summary.html';
      return;
    } else {
      summaryText.textContent = 'Unable to generate summary. Please try again.';
      summaryResult.style.display = '';
    }
  } catch (error) {
    summaryText.textContent = 'Error generating summary. Please check your connection and try again.';
    summaryResult.style.display = '';
  }
} 