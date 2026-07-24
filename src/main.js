import { BinaryImageConverter } from "vectortracer";
// NOTE: versi npm "vectortracer" yang published (0.1.2) baru expose
// BinaryImageConverter (line-art / single-color trace). Kalau butuh full
// multi-color vectorization, opsi: (a) fork repo & build ColorImageConverter
// sendiri dari source (https://github.com/AlansCodeLog/vectortracer), atau
// (b) pindah ke pendekatan Netlify Function + @neplex/vectorizer (Node
// binding VTracer, full color) — lihat README bagian "Full color mode".

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const dropLabel = document.getElementById("dropLabel");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const filterSpeckleEl = document.getElementById("filterSpeckle");
const cornerThresholdEl = document.getElementById("cornerThreshold");

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
  const imageData = await fileToImageData(file);

  const opts = {
    debug: false,
    mode: "spline",
    cornerThreshold: Number(cornerThresholdEl.value),
    filterSpeckle: Number(filterSpeckleEl.value),
    lengthThreshold: 5,
    spliceThreshold: 45,
    maxIterations: 2,
    pathPrecision: 5
  };

  const converter = new BinaryImageConverter(imageData, opts, {
    invert: false,
    pathFill: "#000000",
    backgroundColor: undefined,
    attributes: undefined
  });

  // MUST call init() before the tick loop, or getResult() comes back empty
  converter.init();

  let done = false;
  while (!done) {
    done = converter.tick();
    await new Promise((r) => setTimeout(r, 0));
  }
  const result = converter.getResult();
  converter.free();
  return result;
}

function fileToImageData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
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
