const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const resultsEl = document.getElementById("results");

const colorPrecisionEl = document.getElementById("colorPrecision");
const filterSpeckleEl = document.getElementById("filterSpeckle");
const cornerThresholdEl = document.getElementById("cornerThreshold");
const bwModeEl = document.getElementById("bwMode");

const FUNCTION_URL = "/.netlify/functions/vectorize";

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

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      options: {
        colorPrecision: Number(colorPrecisionEl.value),
        filterSpeckle: Number(filterSpeckleEl.value),
        cornerThreshold: Number(cornerThresholdEl.value),
        blackWhite: bwModeEl.checked
      }
    })
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
        <div class="preview">${svg}</div>
        <a class="download" href="${url}" download="${outName}">Download SVG</a>
      `;
    },
    showError(msg) {
      el.querySelector(".card-body").innerHTML = `<div class="error">${msg}</div>`;
    }
  };
}
