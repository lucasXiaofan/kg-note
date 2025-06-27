// YouTube video utilities
function getYouTubeVideoInfo() {
  if (!window.location.hostname.includes('youtube.com')) {
    return null;
  }
  
  const video = document.querySelector('video');
  if (!video) return null;
  
  const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.title yt-formatted-string, #title h1, .watch-main-col h1');
  const channelName = document.querySelector('#owner-name a, #channel-name a, .ytd-channel-name a');
  
  // Get video ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  // Format current time
  const currentTime = video.currentTime;
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Create timestamped URL
  const timestampedUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?v=${videoId}&t=${Math.floor(currentTime)}s`;
  
  return {
    isYouTube: true,
    videoId: videoId,
    videoTitle: videoTitle ? videoTitle.textContent.trim() : document.title,
    channelName: channelName ? channelName.textContent.trim() : '',
    currentTime: currentTime,
    timeString: timeString,
    timestampedUrl: timestampedUrl,
    isPaused: video.paused,
    video: video
  };
}

function pauseYouTubeVideo() {
  const video = document.querySelector('video');
  if (video && !video.paused) {
    video.pause();
    return true;
  }
  return false;
}

function resumeYouTubeVideo() {
  const video = document.querySelector('video');
  if (video && video.paused) {
    video.play();
    return true;
  }
  return false;
}

// Simple overlay system
let overlayActive = false;

function createSimpleOverlay() {
  // Remove existing overlay if any
  const existing = document.getElementById('kw-overlay');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'kw-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 380px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgba(75, 85, 99, 0.6);
      border-radius: 12px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f3f4f6;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    " id="kw-panel">
      <div style="
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6));
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      ">
        <span style="font-size: 12px; font-weight: 600;">📝 Knowledge Weaver</span>
        <button id="kw-close" style="
          background: none;
          border: none;
          color: rgba(255,255,255,0.8);
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
        ">×</button>
      </div>
      <div style="padding: 16px;">
        <div style="
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 11px;
        ">
          <div style="color: #60a5fa; font-weight: 600; margin-bottom: 8px;">📄 Context</div>
          <div id="kw-title" style="font-weight: 500; margin-bottom: 4px; color: #d1d5db;"></div>
          <div id="kw-url" style="color: #9ca3af; cursor: pointer; word-break: break-all;" title="Click to open"></div>
          <div id="kw-video-info" style="
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 6px;
            padding: 8px;
            margin-top: 8px;
            display: none;
          ">
            <div style="color: #fca5a5; font-weight: 500; font-size: 10px; margin-bottom: 4px;">🎥 YouTube Video</div>
            <div id="kw-video-time" style="font-size: 10px; color: #9ca3af;"></div>
            <div id="kw-timestamped-url" style="font-size: 10px; color: #60a5fa; margin-top: 4px; cursor: pointer;" title="Open at current time"></div>
          </div>
        </div>
        <textarea id="kw-note-area" placeholder="Your notes here... (Press Enter to save)" style="
          width: 100%;
          height: 120px;
          padding: 12px;
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          color: #f3f4f6;
          font-size: 14px;
          resize: none;
          outline: none;
          margin-bottom: 16px;
          box-sizing: border-box;
        "></textarea>
        <div style="display: flex; gap: 8px;">
          <button id="kw-save" style="
            flex: 1;
            padding: 10px;
            background: rgba(59, 130, 246, 0.8);
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            font-size: 12px;
            cursor: pointer;
          ">💾 Save</button>
          <button id="kw-cancel" style="
            padding: 10px 16px;
            background: rgba(75, 85, 99, 0.8);
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            font-size: 12px;
            cursor: pointer;
          ">✕</button>
        </div>
        <div id="kw-status" style="
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 12px;
          display: none;
        "></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setupOverlayEvents();
  
  // Show panel with animation
  setTimeout(() => {
    const panel = document.getElementById('kw-panel');
    if (panel) {
      panel.style.transform = 'translateX(0)';
    }
  }, 10);
  
  return overlay;
}

function setupOverlayEvents() {
  const noteArea = document.getElementById('kw-note-area');
  const saveBtn = document.getElementById('kw-save');
  const cancelBtn = document.getElementById('kw-cancel');
  const closeBtn = document.getElementById('kw-close');
  const titleEl = document.getElementById('kw-title');
  const urlEl = document.getElementById('kw-url');
  const videoInfoEl = document.getElementById('kw-video-info');
  const videoTimeEl = document.getElementById('kw-video-time');
  const timestampedUrlEl = document.getElementById('kw-timestamped-url');
  const statusEl = document.getElementById('kw-status');

  if (!noteArea) return;

  // Setup context
  titleEl.textContent = document.title;
  urlEl.textContent = window.location.href;
  urlEl.addEventListener('click', () => {
    window.open(window.location.href, '_blank');
  });

  // YouTube context
  const youtubeInfo = getYouTubeVideoInfo();
  if (youtubeInfo) {
    videoTimeEl.textContent = `⏰ ${youtubeInfo.timeString} • 📺 ${youtubeInfo.channelName}`;
    timestampedUrlEl.textContent = `🔗 Open at ${youtubeInfo.timeString}`;
    timestampedUrlEl.addEventListener('click', () => {
      window.open(youtubeInfo.timestampedUrl, '_blank');
    });
    videoInfoEl.style.display = 'block';
    
    // Pause video
    pauseYouTubeVideo();
  }

  // Focus textarea
  setTimeout(() => {
    noteArea.focus();
  }, 100);

  // Close handlers
  const closeOverlay = () => {
    if (youtubeInfo) {
      resumeYouTubeVideo();
    }
    hideOverlay();
  };

  closeBtn.addEventListener('click', closeOverlay);
  cancelBtn.addEventListener('click', closeOverlay);

  // Save handler
  const saveNote = () => {
    const noteText = noteArea.value.trim();
    if (!noteText) {
      noteArea.focus();
      return;
    }

    statusEl.textContent = '💾 Saving...';
    statusEl.style.display = 'block';
    saveBtn.disabled = true;
    cancelBtn.disabled = true;

    // Get context
    const descriptionTag = document.querySelector('meta[name="description"]');
    const summary = descriptionTag ? descriptionTag.content : '';
    
    const pageContext = {
      title: document.title,
      url: window.location.href,
      summary: summary,
      domain: new URL(window.location.href).hostname,
      isYouTube: !!youtubeInfo,
      youtube: youtubeInfo
    };

    // Send to background
    chrome.runtime.sendMessage({
      action: 'saveNote',
      data: {
        content: noteText,
        metadata: pageContext
      }
    }, (response) => {
      if (response && response.status === 'success') {
        statusEl.textContent = '✅ Saved!';
        
        if (youtubeInfo) {
          resumeYouTubeVideo();
        }
        
        setTimeout(() => {
          hideOverlay();
        }, 500);
      } else {
        statusEl.textContent = '❌ Failed to save';
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });
  };

  saveBtn.addEventListener('click', saveNote);

  // Enter to save
  noteArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });
}

function showOverlay() {
  if (overlayActive) return;
  
  overlayActive = true;
  console.log('Showing overlay...');
  createSimpleOverlay();
}

function hideOverlay() {
  const overlay = document.getElementById('kw-overlay');
  if (overlay) {
    const panel = document.getElementById('kw-panel');
    if (panel) {
      panel.style.transform = 'translateX(400px)';
    }
    setTimeout(() => {
      overlay.remove();
      overlayActive = false;
    }, 300);
  }
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === 'getPageContent') {
    const descriptionTag = document.querySelector('meta[name="description"]');
    const summary = descriptionTag ? descriptionTag.content : '';
    
    const youtubeInfo = getYouTubeVideoInfo();
    
    const response = {
      title: document.title,
      url: window.location.href,
      summary: summary,
      isYouTube: !!youtubeInfo,
      youtube: youtubeInfo
    };
    
    sendResponse(response);
  }
  
  if (request.action === 'pauseVideo') {
    const paused = pauseYouTubeVideo();
    sendResponse({ success: paused });
  }
  
  if (request.action === 'resumeVideo') {
    const resumed = resumeYouTubeVideo();
    sendResponse({ success: resumed });
  }
  
  if (request.action === 'showOverlay') {
    showOverlay();
    sendResponse({ success: true });
  }
  
  if (request.action === 'hideOverlay') {
    hideOverlay();
    sendResponse({ success: true });
  }
});

console.log('Knowledge Weaver content script loaded');