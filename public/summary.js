// Get summary data from sessionStorage (set after summarization)
const summary = sessionStorage.getItem('summary') || 'No summary available.';
const keywords = JSON.parse(sessionStorage.getItem('keywords') || '[]');
const noteText = sessionStorage.getItem('noteText') || '';

document.getElementById('summaryText').textContent = summary;
const keywordsList = document.getElementById('keywordsList');
keywords.forEach(k => {
  const span = document.createElement('span');
  span.className = 'badge';
  span.textContent = k;
  keywordsList.appendChild(span);
});

document.getElementById('uploadDate').textContent = new Date().toLocaleDateString();
document.getElementById('wordCount').textContent = noteText.split(/\s+/).filter(Boolean).length;
document.getElementById('topicsCount').textContent = keywords.length;

// Copy summary
const copyBtn = document.getElementById('copySummary');
copyBtn.onclick = () => {
  navigator.clipboard.writeText(summary);
  copyBtn.textContent = '✅';
  setTimeout(() => (copyBtn.textContent = '📋'), 1200);
};

// Download summary as txt
const downloadBtn = document.getElementById('downloadSummary');
downloadBtn.onclick = () => {
  const blob = new Blob([summary + '\n\nKEYWORDS: ' + keywords.join(', ')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'summary.txt';
  a.click();
  URL.revokeObjectURL(url);
};

// Listen to summary (TTS)
function speakSummary() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(summary);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }
}
document.getElementById('listenSummary').onclick = speakSummary;
document.getElementById('listenSummary2').onclick = speakSummary;

// Share summary (Web Share API)
document.getElementById('shareSummary').onclick = () => {
  if (navigator.share) {
    navigator.share({ title: 'Lecture Digest Summary', text: summary });
  } else {
    alert('Sharing not supported on this device.');
  }
};

// Fetch YouTube videos for keywords
async function fetchYouTubeVideos(query) {
  const apiKey = 'AIzaSyAFFJe6t5H8gzbT9Ef6GP04APiBm8gAvLg';
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`);
  const data = await response.json();
  if (data.items) {
    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
  }
  return [];
}

(async () => {
  const youtubeDiv = document.getElementById('youtubeVideos');
  youtubeDiv.textContent = 'Loading videos...';
  if (keywords.length === 0) {
    youtubeDiv.textContent = 'No keywords found.';
    return;
  }
  const videos = await fetchYouTubeVideos(keywords.join(' '));
  youtubeDiv.innerHTML = '';
  if (videos.length === 0) {
    youtubeDiv.textContent = 'No related videos found.';
    return;
  }
  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'youtube-video-card';
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" />
      <div class="youtube-video-title">${video.title}</div>
      <div class="youtube-video-channel">${video.channelTitle}</div>
      <a class="youtube-video-link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank">Watch</a>
    `;
    youtubeDiv.appendChild(card);
  });
})(); 