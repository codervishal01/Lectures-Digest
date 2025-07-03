async function searchYouTubeVideos(query, apiKey) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`);
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
// Example usage:
// searchYouTubeVideos('AI summary', 'AIzaSyBaz2sfHp8J_qlQlWxirYEur6PpLUwcvCw').then(console.log); 