const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const resultsEl = document.getElementById("results");

const colorPrecisionEl = document.getElementById("colorPrecision");
const filterSpeckleEl = document.getElementById("filterSpeckle");
const cornerThresholdEl = document.getElementById("cornerThreshold");
const bwModeEl = document.getElementById("bwMode");

const engineEl = document.getElementById("engine");
const vaiModeEl = document.getElementById("vaiMode");
const vtracerControlsEl = document.getElementById("vtracerControls");
const vtracerNoteEl = document.getElementById("vtracerNote");
const vectorizerAiControlsEl = document.getElementById("vectorizerAiControls");
const vectorizerAiNoteEl = document.getElementById("vectorizerAiNote");

const FUNCTION_URLS = {
  vtracer: "/.netlify/functions/vectorize",
  vectorizerai: "/.netlify/functions/vectorize-ai"
};

engineEl.addEventListener("change", () => {
  const isAi = engineEl.value === "vectorizerai";
  vtracerControlsEl.hidden = isAi;
  vtracerNoteEl.hidden = isAi;
  vectorizerAiControlsEl.hidden = !isAi;
  vectorizerAiNoteEl.hidden = !isAi;
});

dropzone.addEventListener("dragover", (e) => e.preventDefault());
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;

  resultsEl.innerHTML = "";
  for (const file of files) {
    const card = createResultCard(file.name);
    resultsEl.appendChild(card.el);
    try {
      const svg = await traceFile(file);
      card.showResult(svg, file.name);
    } catch (err) {
      console.error(err);
      card.showError(err.message || "Gagal trace");
    }
  }
}

async function traceFile(file) {
  const imageBase64 = await fileToBase64(file);
  const engine = engineEl.value;
  const url = FUNCTION_URLS[engine];

  const options =
    engine === "vectorizerai"
      ? { mode: vaiModeEl.value }
      : {
          colorPrecision: Number(colorPrecisionEl.value),
          filterSpeckle: Number(filterSpeckleEl.value),
          cornerThreshold: Number(cornerThresholdEl.value),
          blackWhite: bwModeEl.checked
        };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageBase64, options })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data.svg;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createResultCard(name) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<div class="card-name">${name}</div><div class="card-body">Processing…</div>`;
  return {
    el,
    showResult(svg, filename) {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const outName = filename.replace(/\.[^.]+$/, "") + ".svg";
      el.querySelector(".card-body").innerHTML = `
        <div class="preview" title="Klik buat perbesar">${svg}</div>
        <a class="download" href="${url}" download="${outName}">Download SVG</a>
      `;
      el.querySelector(".preview").addEventListener("click", () => openLightbox(svg));
    },
    showError(msg) {
      el.querySelector(".card-body").innerHTML = `<div class="error">${msg}</div>`;
    }
  };
}

// ---- Lightbox: fullscreen preview with zoom + pan ----
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
  <div class="lightbox-toolbar">
    <button id="lbZoomOut" title="Zoom out">−</button>
    <span id="lbZoomLevel">100%</span>
    <button id="lbZoomIn" title="Zoom in">+</button>
    <button id="lbReset" title="Reset">Reset</button>
    <button id="lbClose" title="Close">✕</button>
  </div>
  <div class="lightbox-stage">
    <div class="lightbox-content"></div>
  </div>
`;
document.body.appendChild(lightbox);

const lbContent = lightbox.querySelector(".lightbox-content");
const lbStage = lightbox.querySelector(".lightbox-stage");
const lbZoomLevel = lightbox.querySelector("#lbZoomLevel");

let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function applyTransform() {
  lbContent.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
  lbZoomLevel.textContent = Math.round(scale * 100) + "%";
}

function openLightbox(svg) {
  lbContent.innerHTML = svg;
  scale = 1;
  originX = 0;
  originY = 0;
  applyTransform();
  lightbox.classList.add("open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lbContent.innerHTML = "";
}

lightbox.querySelector("#lbClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});

lightbox.querySelector("#lbZoomIn").addEventListener("click", () => {
  scale = Math.min(scale * 1.25, 10);
  applyTransform();
});
lightbox.querySelector("#lbZoomOut").addEventListener("click", () => {
  scale = Math.max(scale / 1.25, 0.1);
  applyTransform();
});
lightbox.querySelector("#lbReset").addEventListener("click", () => {
  scale = 1;
  originX = 0;
  originY = 0;
  applyTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  scale = Math.min(Math.max(scale * delta, 0.1), 10);
  applyTransform();
}, { passive: false });

lbStage.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX - originX;
  dragStartY = e.clientY - originY;
  lbStage.classList.add("dragging");
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  originX = e.clientX - dragStartX;
  originY = e.clientY - dragStartY;
  applyTransform();
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  lbStage.classList.remove("dragging");
});
