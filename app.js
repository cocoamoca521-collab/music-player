document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const repeatBadge = document.getElementById('repeatBadge');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressHandle = document.getElementById('progressHandle');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const trackAlbum = document.getElementById('trackAlbum');
  const coverArt = document.getElementById('coverArt');
  const trackList = document.getElementById('trackList');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const muteIcon = document.getElementById('muteIcon');
  const volumeBar = document.getElementById('volumeBar');
  const volumeFill = document.getElementById('volumeFill');
  const volumeHandle = document.getElementById('volumeHandle');

  let songs = [];
  let currentIndex = -1;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 0; // 0: off, 1: all, 2: one
  let volume = 0.8;
  let previousVolume = 0.8;
  let shuffledOrder = [];

  async function loadSongs() {
    try {
      const res = await fetch('songs.json');
      songs = await res.json();
      renderPlaylist();
      if (songs.length > 0) {
        loadTrack(0, false);
      }
    } catch (e) {
      trackTitle.textContent = 'songs.json を読み込めませんでした';
    }
  }

  function renderPlaylist() {
    trackList.innerHTML = '';
    songs.forEach((song, i) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      li.dataset.index = i;
      li.innerHTML = `
        <span class="track-item-number">${i + 1}</span>
        <div class="track-item-playing">
          <span class="playing-bar"></span>
          <span class="playing-bar"></span>
          <span class="playing-bar"></span>
        </div>
        <div class="track-item-info">
          <div class="track-item-title">${song.title}</div>
          <div class="track-item-artist">${song.artist}</div>
        </div>
        <span class="track-item-duration">${song.duration}</span>
      `;
      li.addEventListener('click', () => {
        loadTrack(i, true);
      });
      trackList.appendChild(li);
    });
  }

  function loadTrack(index, autoplay) {
    currentIndex = index;
    const song = songs[index];

    audio.src = song.src;
    trackTitle.textContent = song.title;
    trackArtist.textContent = song.artist;
    trackAlbum.textContent = song.album || '';

    if (song.cover) {
      coverArt.innerHTML = `<img src="${song.cover}" alt="${song.title}">`;
    } else {
      coverArt.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2a10 10 0 0 1 0 20"/>
        </svg>`;
    }

    progressFill.style.width = '0%';
    progressHandle.style.left = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = song.duration || '0:00';

    updateActiveTrack();

    if (autoplay) {
      play();
    }
  }

  function updateActiveTrack() {
    document.querySelectorAll('.track-item').forEach((el, i) => {
      el.classList.toggle('active', i === currentIndex);
      el.classList.toggle('is-playing', i === currentIndex && isPlaying);
    });
  }

  function play() {
    audio.play().then(() => {
      isPlaying = true;
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      updateActiveTrack();
    }).catch(() => {});
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    updateActiveTrack();
  }

  function togglePlay() {
    if (currentIndex === -1 && songs.length > 0) {
      loadTrack(0, true);
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function getNextIndex() {
    if (isShuffle) {
      if (shuffledOrder.length === 0) {
        shuffledOrder = [...Array(songs.length).keys()].filter(i => i !== currentIndex);
        for (let i = shuffledOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
        }
      }
      return shuffledOrder.pop();
    }
    return (currentIndex + 1) % songs.length;
  }

  function getPrevIndex() {
    return (currentIndex - 1 + songs.length) % songs.length;
  }

  function nextTrack() {
    if (songs.length === 0) return;
    loadTrack(getNextIndex(), true);
  }

  function prevTrack() {
    if (songs.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadTrack(getPrevIndex(), true);
  }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    shuffledOrder = [];
  }

  function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.classList.toggle('active', repeatMode !== 0);
    if (repeatMode === 2) {
      repeatBadge.textContent = '1';
      repeatBadge.classList.add('show');
    } else {
      repeatBadge.classList.remove('show');
    }
  }

  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function seekTo(e) {
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration) {
      audio.currentTime = ratio * audio.duration;
    }
  }

  function setVolume(e) {
    const rect = volumeBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    volume = ratio;
    audio.volume = volume;
    updateVolumeUI();
  }

  function updateVolumeUI() {
    const pct = volume * 100;
    volumeFill.style.width = pct + '%';
    volumeHandle.style.left = pct + '%';
    if (volume === 0) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
    } else {
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
    }
  }

  function toggleMute() {
    if (volume > 0) {
      previousVolume = volume;
      volume = 0;
    } else {
      volume = previousVolume || 0.8;
    }
    audio.volume = volume;
    updateVolumeUI();
  }

  // --- Event Listeners ---
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);
  shuffleBtn.addEventListener('click', toggleShuffle);
  repeatBtn.addEventListener('click', toggleRepeat);
  volumeBtn.addEventListener('click', toggleMute);

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    progressHandle.style.left = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if (repeatMode === 2) {
      audio.currentTime = 0;
      play();
    } else if (repeatMode === 1 || currentIndex < songs.length - 1 || isShuffle) {
      nextTrack();
    } else {
      pause();
    }
  });

  // Progress bar drag
  let isDraggingProgress = false;
  progressBar.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    seekTo(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) seekTo(e);
  });
  document.addEventListener('mouseup', () => {
    isDraggingProgress = false;
  });

  // Touch support for progress
  progressBar.addEventListener('touchstart', (e) => {
    isDraggingProgress = true;
    seekTo(e.touches[0]);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (isDraggingProgress) seekTo(e.touches[0]);
  });
  document.addEventListener('touchend', () => {
    isDraggingProgress = false;
  });

  // Volume bar drag
  let isDraggingVolume = false;
  volumeBar.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    setVolume(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) setVolume(e);
  });
  document.addEventListener('mouseup', () => {
    isDraggingVolume = false;
  });

  // Touch support for volume
  volumeBar.addEventListener('touchstart', (e) => {
    isDraggingVolume = true;
    setVolume(e.touches[0]);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (isDraggingVolume) setVolume(e.touches[0]);
  });
  document.addEventListener('touchend', () => {
    isDraggingVolume = false;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') { e.preventDefault(); nextTrack(); }
    if (e.code === 'ArrowLeft') { e.preventDefault(); prevTrack(); }
    if (e.code === 'ArrowUp') { e.preventDefault(); volume = Math.min(1, volume + 0.05); audio.volume = volume; updateVolumeUI(); }
    if (e.code === 'ArrowDown') { e.preventDefault(); volume = Math.max(0, volume - 0.05); audio.volume = volume; updateVolumeUI(); }
  });

  // Init
  audio.volume = volume;
  updateVolumeUI();
  loadSongs();
});
