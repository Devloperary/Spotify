let currentsong = new Audio();
let currentIcon = null;
let songs;
let playlists;
let currFolder;

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function playMusic(track, icon) {
  const fullUrl = `${currFolder}/playlist-1/${encodeURIComponent(track)}`;
  currentsong.src = fullUrl;
  currentsong.play();

  let displayName = decodeURIComponent(track.replace(".mp3", ""));
  if (displayName.includes(" - ")) displayName = displayName.split(" - ")[1];
  document.querySelector(".songinfo").textContent = displayName;
  document.querySelector(".songtime").textContent = "00:00/00:00";
  document.getElementById("play").src = "svgs/pause.svg";

  if (currentIcon) currentIcon.classList.remove("rotate");
  if (icon) icon.classList.add("rotate");
  currentIcon = icon;

  document.querySelector(".playbar").classList.add("show");
  document.querySelector("#p img").src = "svgs/pause.svg";
}

async function getSongs(folder) {
  currFolder = folder;
  let res = await fetch(`${folder}/playlist-1/`);
  let text = await res.text();
  let doc = new DOMParser().parseFromString(text, "text/html");
  let links = Array.from(doc.querySelectorAll("a")).filter(a => a.href.endsWith(".mp3"));

  songs = links.map(link => decodeURIComponent(link.href));
  const ul = document.querySelector(".playlist ul");
  ul.innerHTML = "";

  for (const song of songs) {
    const fname = song.split("/").pop().replace(".mp3", "");
    const sname = fname.includes(" - ") ? fname.split(" - ")[1] : fname;

    ul.innerHTML += `
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
      playMusic(songUrl, card.querySelector("img.p"));
    });
  });

  return songs;
}

async function getplaylist() {
  let folders = await fetch("./songs/index.json").then(r => r.json());
  playlists = [];

  for (const folderName of folders) {
    const base = `./songs/${folderName}`;
    try {
      const html = await fetch(`${base}/playlist-1/`).then(r => r.text());
      const links = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"));
      const mp3s = links.filter(link => link.href.endsWith(".mp3"));

      if (mp3s.length) {
        const meta = await fetch(`${base}/info.json`).then(r => r.json());
        playlists.push(mp3s.map(link => [decodeURIComponent(link.href.split("/").pop()), link.href]));

        document.querySelector(".ts").innerHTML += `
          <div class="card-1" data-folder="${base}">
            <img src="${base}/cover.jpg" />
            <div class="ainfo">
              <div class="s">${meta.title}</div>
              <div class="a">${meta.description}</div>
            </div>
          </div>`;
      }
    } catch (e) {
      console.warn("Error in playlist:", base, e);
    }
  }

  document.querySelectorAll(".ts .card-1").forEach((card) => {
    card.addEventListener("click", async () => {
      const folder = card.dataset.folder;
      songs = await getSongs(folder);
      playlists = [songs.map(url => [decodeURIComponent(url.split("/").pop()), url])];

      if (songs.length > 0) {
        playMusic(songs[0].split("/").pop(), document.querySelector(".playlist ul .card")?.querySelector("img.p"));
      }
    });
  });
}

async function displayartist() {
  let artists = await fetch("./artist/index.json").then(r => r.json());

  for (const artist of artists) {
    const folder = `./artist/${artist}`;
    try {
      const html = await fetch(`${folder}/playlist-1/`).then(r => r.text());
      const links = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"));
      const mp3s = links.filter(link => link.href.endsWith(".mp3"));

      if (mp3s.length) {
        document.querySelector(".ts-1").innerHTML += `
          <div class="card-2 card-1" data-folder="${folder}">
            <img src="${folder}/cover.jpg" />
            <div class="ainfo">
              <div class="s">${artist}</div>
              <div class="a">Artist</div>
            </div>
          </div>`;
      }
    } catch (err) {
      console.warn("Artist playlist missing:", folder);
    }
  }

  document.querySelectorAll(".ts-1 .card-2").forEach((card) => {
    card.addEventListener("click", async () => {
      const folder = card.dataset.folder;
      songs = await getSongs(folder);
      playlists = [songs.map(url => [decodeURIComponent(url.split("/").pop()), url])];

      if (songs.length > 0) {
        playMusic(songs[0].split("/").pop(), document.querySelector(".playlist ul .card")?.querySelector("img.p"));
      }
    });
  });
}

function setupControls() {
  document.querySelector("#p").addEventListener("click", () => {
    const icon = document.querySelector("#p img");
    const bar = document.querySelector(".playbar");

    if (currentsong.src) {
      if (currentsong.paused) {
        currentsong.play();
        icon.src = "svgs/pause.svg";
        bar.classList.add("show");
        if (currentIcon) currentIcon.classList.add("rotate");
      } else {
        currentsong.pause();
        icon.src = "svgs/start.svg";
        bar.classList.remove("show");
        if (currentIcon) currentIcon.classList.remove("rotate");
      }
    }
  });

  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").textContent = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`;
    document.querySelector(".circle").style.left = `${(currentsong.currentTime / currentsong.duration) * 100}%`;
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let p = e.offsetX / e.target.getBoundingClientRect().width;
    currentsong.currentTime = currentsong.duration * p;
    document.querySelector(".circle").style.left = `${p * 100}%`;
  });

  document.getElementById("previous").addEventListener("click", () => {
    let flat = playlists.flat();
    let idx = flat.findIndex(s => s[1].endsWith(currentsong.src.split("/").pop()));
    if (idx > 0) playMusic(flat[idx - 1][0], document.querySelectorAll(".playlist ul .card")[idx - 1]?.querySelector("img.p"));
  });

  document.getElementById("next").addEventListener("click", () => {
    let flat = playlists.flat();
    let idx = flat.findIndex(s => s[1].endsWith(currentsong.src.split("/").pop()));
    if (idx < flat.length - 1) playMusic(flat[idx + 1][0], document.querySelectorAll(".playlist ul .card")[idx + 1]?.querySelector("img.p"));
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

async function main() {
  await getplaylist();
  await displayartist();
  setupControls();
}

main();
