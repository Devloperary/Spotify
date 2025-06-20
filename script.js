console.log("Start !!!!!!!!!!!");

let currentsong = new Audio();
let currentIcon = null;
let songs;
let playlists;
let currFolder;

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const paddedMins = mins < 10 ? "0" + mins : mins;
  const paddedSecs = secs < 10 ? "0" + secs : secs;
  return `${paddedMins}:${paddedSecs}`;
}

function playMusic(track, icon) {
  const fileName = track;
  const fullUrl = `./${currFolder}/playlist-1/${encodeURIComponent(fileName)}`;

  currentsong.src = fullUrl;
  currentsong.play();

  let displayName = decodeURIComponent(fileName.replace(".mp3", ""));
  if (displayName.includes(" - ")) displayName = displayName.split(" - ")[1];

  document.querySelector(".songinfo").innerHTML = displayName;
  document.querySelector(".songtime").innerHTML = "00:00/00:00";
  document.getElementById("play").src = "svgs/pause.svg";

  if (currentIcon) currentIcon.classList.remove("rotate");
  if (icon) icon.classList.add("rotate");
  currentIcon = icon;

  document.querySelector(".playbar").classList.add("show");
  document.querySelector("#p img").src = "svgs/pause.svg";
}

async function getSongs(folder) {
  currFolder = folder;
  let b = await fetch(`./${folder}/playlist-1/`);
  let res = await b.text();
  let d = document.createElement("div");
  d.innerHTML = res;
  let bs = d.getElementsByTagName("a");

  songs = [];
  for (let element of bs) {
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
            <img src="cover.jpg" class="cover" />
            <div class="name">
              <div class="sname">${sname}</div>
              <div class="aname">Artist</div>
            </div>
          </div>
          <img src="svgs/music.svg" class="play invert-icon p" />
        </div>
      </li>`;
  }

  document.querySelectorAll(".playlist ul .card").forEach((card, index) => {
    card.addEventListener("click", () => {
      const songUrl = songs[index].split("/").pop();
      const icon = card.querySelector("img.p");
      playMusic(songUrl, icon);
    });
  });

  return songs;
}

async function getplaylist() {
  let folders = ["Chill_(mood)", "Dark_(mood)", "Bright_(mood)", "Angry_(mood)"];
  playlists = [];

  for (const folderName of folders) {
    try {
      const playlistUrl = `./songs/${folderName}/playlist-1/`;
      const res = await fetch(playlistUrl);
      const folderText = await res.text();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = folderText;
      const links = tempDiv.getElementsByTagName("a");

      let playlistSongs = [];
      for (const link of links) {
        if (link.href.endsWith(".mp3")) {
          const fileName = decodeURIComponent(link.href.split("/").pop());
          playlistSongs.push([fileName, link.href]);
        }
      }

      if (playlistSongs.length > 0) {
        const meta = await fetch(`./songs/${folderName}/info.json`).then(r => r.json());
        playlists.push(playlistSongs);
        document.querySelector(".ts").innerHTML += `
          <div class="card-1" data-folder="songs/${folderName}">
            <img src="./songs/${folderName}/cover.jpg" />
            <div class="ainfo">
              <div class="s">${meta.title}</div>
              <div class="a">${meta.description}</div>
            </div>
          </div>`;
      }
    } catch (err) {
      console.error(`Error loading playlist: ${folderName}`, err);
    }
  }

  document.querySelectorAll(".ts .card-1").forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = e.currentTarget.dataset.folder;
      songs = await getSongs(folder);
      playlists = [songs.map(url => [decodeURIComponent(url.split("/").pop()), url])];
      if (songs.length > 0) {
        const firstSong = songs[0].split("/").pop();
        const firstCard = document.querySelector(".playlist ul .card");
        const firstIcon = firstCard?.querySelector("img.p");
        playMusic(firstSong, firstIcon);
      }
    });
  });
}

async function displayartist() {
  const folders = [
    "Aditya Gadhavi", "Aditya Gadhavi - 2",
    "Arijit Singh", "Arijit Singh - 2",
    "Kishore Da", "Kishore Da - 2"
  ];

  for (const artist of folders) {
    const folderPath = `./artist/${artist}/playlist-1/`;
    const coverPath = `./artist/${artist}/cover.jpg`;

    try {
      const res = await fetch(folderPath);
      const html = await res.text();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const links = tempDiv.getElementsByTagName("a");

      const songs = [];
      for (const link of links) {
        if (link.href.endsWith(".mp3")) songs.push(link.href);
      }

      if (songs.length > 0) {
        document.querySelector(".ts-1").innerHTML += `
          <div class="card-2 card-1" data-folder="artist/${artist}">
            <img src="${coverPath}" />
            <div class="ainfo">
              <div class="s">${artist}</div>
              <div class="a">Artist</div>
            </div>
          </div>`;
      }
    } catch (err) {
      console.error(`Failed loading artist ${artist}`, err);
    }
  }

  document.querySelectorAll(".ts-1 .card-2").forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = e.currentTarget.dataset.folder;
      songs = await getSongs(folder);
      playlists = [songs.map(url => [decodeURIComponent(url.split("/").pop()), url])];
      if (songs.length > 0) {
        const firstSong = songs[0].split("/").pop();
        const firstCard = document.querySelector(".playlist ul .card");
        const firstIcon = firstCard?.querySelector("img.p");
        playMusic(firstSong, firstIcon);
      }
    });
  });
}

async function main() {
  playlists = await getplaylist();
  songs = playlists.flat().map((song) => song[0]);
  displayartist();

  document.querySelector("#p").addEventListener("click", () => {
    const img = document.querySelector("#p img");
    const playbar = document.querySelector(".playbar");

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
    document.querySelector(".songtime").innerHTML = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`;
    document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let p = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = p + "%";
    currentsong.currentTime = (currentsong.duration * p) / 100;
  });

  document.getElementById("previous").addEventListener("click", () => {
    let flatList = playlists.flat();
    let currentSongUrl = decodeURIComponent(currentsong.src.split("/").pop());
    let currentIndex = flatList.findIndex((song) => decodeURIComponent(song[0]) === currentSongUrl);

    if (currentIndex > 0) {
      let previousSong = flatList[currentIndex - 1];
      playMusic(previousSong[0], document.querySelectorAll(".playlist ul .card")[currentIndex - 1]?.querySelector("img.p"));
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    let flatList = playlists.flat();
    let currentSongUrl = decodeURIComponent(currentsong.src.split("/").pop());
    let currentIndex = flatList.findIndex((song) => decodeURIComponent(song[0]) === currentSongUrl);

    if (currentIndex < flatList.length - 1) {
      let nextSong = flatList[currentIndex + 1];
      playMusic(nextSong[0], document.querySelectorAll(".playlist ul .card")[currentIndex + 1]?.querySelector("img.p"));
    }
  });

  document.getElementById("ham").addEventListener("click", () => {
    document.querySelector(".left").style.display = "flex";
    document.getElementById("p").style.display = "none";
  });

  document.getElementById("cross").addEventListener("click", () => {
    document.querySelector(".left").style.display = "none";
    document.getElementById("p").style.display = "flex";
  });
}

main();
