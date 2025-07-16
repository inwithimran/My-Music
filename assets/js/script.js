'use strict';

/**
 * add eventListener on all elements that are passed
 */

const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}

/**
 * PLAYLIST
 * 
 * add all music in playlist, from 'musicData'
 */

const playlist = document.querySelector("[data-music-list]");

for (let i = 0, len = musicData.length; i < len; i++) {
  playlist.innerHTML += `
  <li>
    <div class="music-item" data-playlist-toggler data-playlist-item="${i}">
      <img src="${musicData[i].posterUrl}" width="800" height="800" alt="${musicData[i].title} Album Poster"
        class="img-cover">
      <span class="music-title">${musicData[i].title}</span>
      <div class="item-icon">
        <span class="material-symbols-rounded">equalizer</span>
      </div>
    </div>
  </li>
  `;
}

/**
 * PLAYLIST MODAL SIDEBAR TOGGLE
 * 
 * show 'playlist' modal sidebar when click on playlist button in top app bar
 * and hide when click on overlay or any playlist-item
 */

const playlistSideModal = document.querySelector("[data-playlist]");
const playlistTogglers = document.querySelectorAll("[data-playlist-toggler]");
const overlay = document.querySelector("[data-overlay]");

const togglePlaylist = function () {
  playlistSideModal.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("modalActive");
  // Scroll to the currently playing music item when playlist is opened
  if (playlistSideModal.classList.contains("active")) {
    const currentPlaylistItem = document.querySelector(`[data-playlist-item="${currentMusic}"]`);
    if (currentPlaylistItem) {
      currentPlaylistItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

addEventOnElements(playlistTogglers, "click", togglePlaylist);

/**
 * PLAYLIST ITEM
 * 
 * remove active state from last time played music
 * and add active state in clicked music
 */

const playlistItems = document.querySelectorAll("[data-playlist-item]");

let currentMusic = 0;
let lastPlayedMusic = 0;

// Load saved music index and time from localStorage
const loadSavedState = function () {
  const savedMusicIndex = localStorage.getItem("currentMusic");
  const savedTime = localStorage.getItem("currentTime");
  if (savedMusicIndex !== null) {
    currentMusic = Number(savedMusicIndex);
    lastPlayedMusic = currentMusic;
    changePlaylistItem();
    changePlayerInfo(false); // Do not play on load
    // Wait for audio to be ready before setting time
    audioSource.addEventListener("loadeddata", () => {
      if (savedTime !== null) {
        audioSource.currentTime = Number(savedTime);
        playerSeekRange.value = audioSource.currentTime;
        playerRunningTime.textContent = getTimecode(audioSource.currentTime);
        updateRangeFill();
      }
      // Ensure play button shows "play" icon and is not active
      playBtn.classList.remove("active");
      // Update song index display
      const songIndexDisplay = document.querySelector("[data-song-index]");
      songIndexDisplay.textContent = `${currentMusic + 1}/${musicData.length}`;
    }, { once: true });
  } else {
    // If no saved state, set first song as default and ensure play button is inactive
    changePlaylistItem();
    changePlayerInfo(false);
    playBtn.classList.remove("active");
    // Update song index display
    const songIndexDisplay = document.querySelector("[data-song-index]");
    songIndexDisplay.textContent = `${currentMusic + 1}/${musicData.length}`;
  }
}

// Call loadSavedState when the page loads
document.addEventListener("DOMContentLoaded", loadSavedState);

const changePlaylistItem = function () {
  playlistItems[lastPlayedMusic].classList.remove("playing");
  playlistItems[currentMusic].classList.add("playing");
}

addEventOnElements(playlistItems, "click", function () {
  lastPlayedMusic = currentMusic;
  currentMusic = Number(this.dataset.playlistItem);
  changePlayerInfo(true); // Always play when clicking playlist item
  changePlaylistItem();
});

/**
 * PLAYER
 * 
 * change all visual information on player, based on current music
 */

const playerBanner = document.querySelector("[data-player-banner]");
const playerTitle = document.querySelector("[data-title]");
const playerAlbum = document.querySelector("[data-album]");
const playerYear = document.querySelector("[data-year]");
const playerArtist = document.querySelector("[data-artist]");

const audioSource = new Audio(musicData[currentMusic].musicPath);

const changePlayerInfo = function (autoPlay) {
  playerBanner.src = musicData[currentMusic].posterUrl;
  playerBanner.setAttribute("alt", `${musicData[currentMusic].title} Album Poster`);
  document.body.style.backgroundImage = `url(${musicData[currentMusic].backgroundImage})`;
  playerTitle.textContent = musicData[currentMusic].title;
  playerAlbum.textContent = musicData[currentMusic].album;
  playerYear.textContent = musicData[currentMusic].year;
  playerArtist.textContent = musicData[currentMusic].artist;

  audioSource.src = musicData[currentMusic].musicPath;

  // Save current music index to localStorage
  localStorage.setItem("currentMusic", currentMusic);

  // Reset current time to 0 for new song and save to localStorage
  audioSource.currentTime = 0;
  localStorage.setItem("currentTime", 0);
  playerSeekRange.value = 0;
  playerRunningTime.textContent = getTimecode(0);

  // Update song index display
  const songIndexDisplay = document.querySelector("[data-song-index]");
  songIndexDisplay.textContent = `${currentMusic + 1}/${musicData.length}`;

  audioSource.addEventListener("loadeddata", () => {
    updateDuration();
    // Play if autoPlay is true
    if (autoPlay) {
      playMusic();
    } else {
      playBtn.classList.remove("active");
    }
  }, { once: true });
}

/** update player duration */
const playerDuration = document.querySelector("[data-duration]");
const playerSeekRange = document.querySelector("[data-seek]");

/** pass seconds and get timcode format */
const getTimecode = function (duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.ceil(duration - (minutes * 60));
  const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  return timecode;
}

const updateDuration = function () {
  playerSeekRange.max = Math.ceil(audioSource.duration);
  playerDuration.textContent = getTimecode(Number(playerSeekRange.max));
}

audioSource.addEventListener("loadeddata", updateDuration);

/**
 * PLAY MUSIC
 * 
 * play and pause music when click on play button
 */

const playBtn = document.querySelector("[data-play-btn]");

let playInterval;

const playMusic = function () {
  if (audioSource.paused) {
    audioSource.play();
    playBtn.classList.add("active");
    playInterval = setInterval(updateRunningTime, 500);
  } else {
    audioSource.pause();
    playBtn.classList.remove("active");
    clearInterval(playInterval);
  }
}

playBtn.addEventListener("click", playMusic);

/** update running time while playing music */

const playerRunningTime = document.querySelector("[data-running-time]");

const updateRunningTime = function () {
  playerSeekRange.value = audioSource.currentTime;
  playerRunningTime.textContent = getTimecode(audioSource.currentTime);

  // Save current time to localStorage
  localStorage.setItem("currentTime", audioSource.currentTime);

  updateRangeFill();
  isMusicEnd();
}

/**
 * RANGE FILL WIDTH
 * 
 * change 'rangeFill' width, while changing range value
 */

const ranges = document.querySelectorAll("[data-range]");
const rangeFill = document.querySelector("[data-range-fill]");

const updateRangeFill = function () {
  let element = this || ranges[0];

  const rangeValue = (element.value / element.max) * 100;
  element.nextElementSibling.style.width = `${rangeValue}%`;
}

addEventOnElements(ranges, "input", updateRangeFill);

/**
 * SEEK MUSIC
 * 
 * seek music while changing player seek range
 */

const seek = function () {
  audioSource.currentTime = playerSeekRange.value;
  playerRunningTime.textContent = getTimecode(playerSeekRange.value);
  // Save current time to localStorage when seeking
  localStorage.setItem("currentTime", audioSource.currentTime);
}

playerSeekRange.addEventListener("input", seek);

/**
 * END MUSIC
 */

const isMusicEnd = function () {
  if (audioSource.ended) {
    if (audioSource.loop) {
      audioSource.currentTime = 0;
      audioSource.play();
    } else {
      lastPlayedMusic = currentMusic;
      if (isShuffled) {
        shuffleMusic();
      } else {
        currentMusic >= musicData.length - 1 ? currentMusic = 0 : currentMusic++;
      }
      changePlayerInfo(true); // Auto-play next song when current one ends
      changePlaylistItem();
    }
  }
}

/**
 * SKIP TO NEXT MUSIC
 */

const playerSkipNextBtn = document.querySelector("[data-skip-next]");

const skipNext = function () {
  lastPlayedMusic = currentMusic;

  if (isShuffled) {
    shuffleMusic();
  } else {
    currentMusic >= musicData.length - 1 ? currentMusic = 0 : currentMusic++;
  }

  changePlayerInfo(true); // Auto-play when skipping to next
  changePlaylistItem();
}

playerSkipNextBtn.addEventListener("click", skipNext);

/**
 * SKIP TO PREVIOUS MUSIC
 */

const playerSkipPrevBtn = document.querySelector("[data-skip-prev]");

const skipPrev = function () {
  lastPlayedMusic = currentMusic;

  if (isShuffled) {
    shuffleMusic();
  } else {
    currentMusic <= 0 ? currentMusic = musicData.length - 1 : currentMusic--;
  }

  changePlayerInfo(true); // Auto-play when skipping to previous
  changePlaylistItem();
}

playerSkipPrevBtn.addEventListener("click", skipPrev);

/**
 * SHUFFLE MUSIC
 */

/** get random number for shuffle */
const getRandomMusic = () => Math.floor(Math.random() * musicData.length);

const shuffleMusic = () => currentMusic = getRandomMusic();

const playerShuffleBtn = document.querySelector("[data-shuffle]");
let isShuffled = false;

const shuffle = function () {
  playerShuffleBtn.classList.toggle("active");

  isShuffled = isShuffled ? false : true;
}

playerShuffleBtn.addEventListener("click", shuffle);

/**
 * REPEAT MUSIC
 */

const playerRepeatBtn = document.querySelector("[data-repeat]");

const repeat = function () {
  if (!audioSource.loop) {
    audioSource.loop = true;
    this.classList.add("active");
  } else {
    audioSource.loop = false;
    this.classList.remove("active");
  }
}

playerRepeatBtn.addEventListener("click", repeat);

/**
 * MUSIC VOLUME
 * 
 * increase or decrease music volume when change the volume range
 */

const playerVolumeRange = document.querySelector("[data-volume]");
const playerVolumeBtn = document.querySelector("[data-volume-btn]");

const changeVolume = function () {
  audioSource.volume = playerVolumeRange.value;
  audioSource.muted = false;

  if (audioSource.volume <= 0.1) {
    playerVolumeBtn.children[0].textContent = "volume_mute";
  } else if (audioSource.volume <= 0.5) {
    playerVolumeBtn.children[0].textContent = "volume_down";
  } else {
    playerVolumeBtn.children[0].textContent = "volume_up";
  }
}

playerVolumeRange.addEventListener("input", changeVolume);

/**
 * MUTE MUSIC
 */

const muteVolume = function () {
  if (!audioSource.muted) {
    audioSource.muted = true;
    playerVolumeBtn.children[0].textContent = "volume_off";
  } else {
    changeVolume();
  }
}

playerVolumeBtn.addEventListener("click", muteVolume);