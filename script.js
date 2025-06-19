console.log("Start !!!!!!!!!!!");

let currentsong = new Audio();
let currentIcon = null;

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const paddedMins = mins < 10 ? "0" + mins : mins;
  const paddedSecs = secs < 10 ? "0" + secs : secs;
  return `${paddedMins}:${paddedSecs}`;
}

function convertMyPlayToPlaylistUrl(myplayUrl, playlists) {
  const fileName = decodeURIComponent(myplayUrl.split("/").pop());
  for (let i = 0; i < playlists.length; i++) {
    const song = playlists[i].find(
      (song) => decodeURIComponent(song[0]) === fileName
    );
    if (song) return song[1];
  }
  return null;
}

let songs;
let playlists;
let currFolder;

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");

  let b = await fetch(`/${folder}/playlist-1/`);
  let res = await b.text();
  let d = document.createElement("div");
  d.innerHTML = res;
  let bs = d.getElementsByTagName("a");

  songs = [];
  for (let index = 0; index < bs.length; index++) {
    const element = bs[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(decodeURIComponent(element.href));
    }
  }

  let songUL = document.querySelector(".playlist ul");
  songUL.innerHTML = "";
  for (const song of songs) {
    const fname = decodeURIComponent(song.split("/").pop().replace(".mp3", ""));
    let sname = fname.includes(" - ") ? fname.split(" - ")[1] : fname;
    songUL.innerHTML += `
      <li>
        <div class="card">
          <div class="i" style="display: flex; gap: 10px;">
            <img src="cover.jpg" alt="" class="cover" />
            <div class="name">
              <div class="sname">${sname}</div>
              <div class="aname">Artist</div>
            </div>
          </div>
          <img src="svgs/music.svg" alt="" class="play invert-icon p" />
        </div>
      </li>`;
  }

  let cards = document.querySelectorAll(".playlist ul .card");
  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      const songUrl = songs[index].split("/").pop();
      const icon = card.querySelector("img.p");
      playMusic(songUrl, icon);
      const p = document.querySelector("#p");
      const playbar = document.querySelector(".playbar");
      const img = p.querySelector("img");
      playbar.classList.add("show");
      img.src = "svgs/pause.svg";
      document.getElementById("play").src = "svgs/pause.svg";
    });
  });

  return songs;
}

async function getplaylist() {
  let response = await fetch("http://127.0.0.1:3000/songs/");
  let text = await response.text();
  let outerDiv = document.createElement("div");
  outerDiv.innerHTML = text;
  let folders = outerDiv.getElementsByTagName("a");

  playlists = [];

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    if (folder.getAttribute("href") === "../") continue;

    const folderUrl = folder.href;
    const folderName = folderUrl.split("/").filter(Boolean).pop();

    try {
      const playlistUrl = folderUrl + "playlist-1";
      const res = await fetch(playlistUrl);
      const folderText = await res.text();

      const innerDiv = document.createElement("div");
      innerDiv.innerHTML = folderText;
      const links = innerDiv.getElementsByTagName("a");

      let playlistSongs = [];

      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        if (link.href.endsWith(".mp3")) {
          const fileName = decodeURIComponent(link.href.split("/").pop());
          const fileUrl = link.href;
          playlistSongs.push([fileName, fileUrl]);
        }
      }

      if (playlistSongs.length > 0) {
        let a = await fetch(`/songs/${folderName}/info.json`);
        let response = await a.json();

        playlists.push(playlistSongs);
        document.querySelector(".ts").innerHTML += `
          <div class="card-1" data-folder="${folderName}">
            <img src="/songs/${folderName}/cover.jpg" alt="" />
            <div class="ainfo">
              <div class="s">${response.title}</div>
              <div class="a">${response.description}</div>
            </div>
          </div>`;
      }
    } catch (err) {
      console.error("Error fetching folder:", folderUrl, err);
    }
  }

  document.querySelectorAll(".ts .card-1").forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = `songs/${e.currentTarget.dataset.folder}`;
      songs = await getSongs(folder);
      playlists = [
        songs.map((url) => {
          const fileName = decodeURIComponent(url.split("/").pop());
          return [fileName, url];
        }),
      ];
      if (songs.length > 0) {
        const firstSong = songs[0].split("/").pop();
        const firstCard = document.querySelector(".playlist ul .card");
        const firstIcon = firstCard?.querySelector("img.p");
        playMusic(firstSong, firstIcon);
      }
    });
  });

  return playlists;
}

async function displayartist() {
  try {
    const response = await fetch("http://127.0.0.1:3000/artist/");
    const text = await response.text();

    const outerDiv = document.createElement("div");
    outerDiv.innerHTML = text;
    const artistFolders = outerDiv.getElementsByTagName("a");

    for (const artistLink of artistFolders) {
      if (artistLink.getAttribute("href") === "../") continue;

      let artistUrl = artistLink.href;
      let artistName = decodeURIComponent(
        artistUrl.split("/artist/")[1] || ""
      ).replace("/", "");

      const playlistUrl = `${artistUrl}playlist-1/`;
      const coverUrl = `${artistUrl}cover.jpg`;

      try {
        const res = await fetch(playlistUrl);
        const playlistHtml = await res.text();

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = playlistHtml;
        const fileLinks = tempDiv.getElementsByTagName("a");

        let songs = [];
        for (const file of fileLinks) {
          if (file.href.endsWith(".mp3")) {
            songs.push(file.href);
          }
        }

        if (songs.length > 0) {
          document.querySelector(".ts-1").innerHTML += `
            <div class="card-2 card-1" data-folder="${artistName}">
              <img src="${coverUrl}" alt="${artistName}" />
              <div class="ainfo">
                <div class="s">${artistName}</div>
                <div class="a">Artist</div>
              </div>
            </div>`;
        }
      } catch (err) {
        console.error(
          `Failed to load playlist or songs for ${artistName}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("Failed to load artist list:", err);
  }

  document.querySelectorAll(".ts-1 .card-2").forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = `artist/${e.currentTarget.dataset.folder}`;
      songs = await getSongs(folder);
      playlists = [
        songs.map((url) => {
          const fileName = decodeURIComponent(url.split("/").pop());
          return [fileName, url];
        }),
      ];
      if (songs.length > 0) {
        const firstSong = songs[0].split("/").pop();
        const firstCard = document.querySelector(".playlist ul .card");
        const firstIcon = firstCard?.querySelector("img.p");
        playMusic(firstSong, firstIcon);
      }
    });
  });
}

function playMusic(track, icon) {
  const fileName = track;
  const baseUrl = "http://127.0.0.1:3000";
  const encodedFileName = encodeURIComponent(fileName);
  const fullUrl = `${baseUrl}/${currFolder}/playlist-1/${encodedFileName}`;

  currentsong.src = fullUrl;
  currentsong.play();

  let displayName = decodeURIComponent(fileName.replace(".mp3", ""));
  if (displayName.includes(" - ")) {
    displayName = displayName.split(" - ")[1];
  }

  document.querySelector(".songinfo").innerHTML = displayName;
  document.querySelector(".songtime").innerHTML = "00:00/00:00";
  document.getElementById("play").src = "svgs/pause.svg";

  if (currentIcon) currentIcon.classList.remove("rotate");
  if (icon) icon.classList.add("rotate");
  currentIcon = icon;

  const p = document.querySelector("#p");
  const playbar = document.querySelector(".playbar");
  const img = p.querySelector("img");

  playbar.classList.add("show");
  img.src = "svgs/pause.svg";
}

async function main() {
  playlists = await getplaylist();
  songs = playlists.flat().map((song) => song[0]);
  displayartist();

  document.querySelector("#p").addEventListener("click", () => {
    const p = document.querySelector("#p");
    const playbar = document.querySelector(".playbar");
    const img = p.querySelector("img");

    if (currentsong && currentsong.src) {
      if (currentsong.paused) {
        currentsong.play();
        playbar.classList.add("show");
        img.src = "svgs/pause.svg";
        document.getElementById("play").src = "svgs/pause.svg";
        if (currentIcon) currentIcon.classList.add("rotate");
      } else {
        currentsong.pause();
        playbar.classList.remove("show");
        img.src = "svgs/start.svg";
        document.getElementById("play").src = "svgs/start.svg";
        if (currentIcon) currentIcon.classList.remove("rotate");
      }
    }
  });

  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${formatTime(
      currentsong.currentTime
    )}/${formatTime(currentsong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let p = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = p + "%";
    currentsong.currentTime = (currentsong.duration * p) / 100;
  });

  document.getElementById("previous").addEventListener("click", () => {
    let flatList = playlists.flat();
    let currentSongUrl = decodeURIComponent(currentsong.src.split("/").pop());
    let currentIndex = flatList.findIndex(
      (song) => decodeURIComponent(song[0]) === currentSongUrl
    );

    if (currentIndex > 0) {
      let previousSong = flatList[currentIndex - 1];
      let fileName = previousSong[0];
      const songCards = document.querySelectorAll(".playlist ul .card");
      const icon = songCards[currentIndex - 1]?.querySelector("img.p");
      playMusic(fileName, icon);
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    let flatList = playlists.flat();
    let currentSongUrl = decodeURIComponent(currentsong.src.split("/").pop());
    let currentIndex = flatList.findIndex(
      (song) => decodeURIComponent(song[0]) === currentSongUrl
    );

    if (currentIndex !== -1 && currentIndex < flatList.length - 1) {
      let nextSong = flatList[currentIndex + 1];
      let fileName = nextSong[0];
      const songCards = document.querySelectorAll(".playlist ul .card");
      const icon = songCards[currentIndex + 1]?.querySelector("img.p");
      playMusic(fileName, icon);
    }
  });

  document.getElementById("ham").addEventListener("click", () => {
    let lefts = document.getElementsByClassName("left");
    lefts[0].style.display = "flex";
    document.getElementById("p").style.display = "none";
  });

  document.getElementById("cross").addEventListener("click", () => {
    let lefts = document.getElementsByClassName("left");
    lefts[0].style.display = "none";
    document.getElementById("p").style.display = "flex";
  });


  
}

main();
