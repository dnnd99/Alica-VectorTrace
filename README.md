# Icon Vectorizer

Vectorizer PNG/JPG → SVG yang jalan 100% di browser (WASM, pakai library
[vectortracer](https://github.com/AlansCodeLog/vectortracer) — binding VTracer).
Nggak ada server, nggak ada limit akun, gratis.

## Coba lokal dulu

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, drag-drop gambar PNG/JPG, atur slider kalau perlu,
download hasil SVG.

## Push ke GitHub

```bash
git init
git add .
git commit -m "init vtracer web"
gh repo create icon-vectorizer --public --source=. --push
```

(atau bikin repo manual di github.com lalu `git remote add origin ...` + push)

## Deploy ke Netlify

1. Login ke [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect ke GitHub, pilih repo `icon-vectorizer`
3. Build settings udah otomatis kebaca dari `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy. Setiap push ke `main` bakal auto-redeploy.

## Cara kerja

- Gambar dibaca via `<canvas>` jadi `ImageData` — semua di sisi client.
- `vectortracer` (WASM) trace jadi SVG string, proses jalan async pakai
  `tick()` loop biar UI nggak freeze.
- Hasil SVG bisa langsung didownload per file.

## Full color mode

Versi npm `vectortracer` yang published saat ini baru expose
`BinaryImageConverter` (single-color / line-art trace) — cocok buat outline
icon, tapi belum bisa multi-color penuh kayak vectorizer.ai. Dua opsi kalau
butuh full color:

1. **Fork & build sendiri** dari [source vectortracer](https://github.com/AlansCodeLog/vectortracer)
   yang di README-nya nyebut `ColorImageConverter` — mungkin ada di branch
   lebih baru yang belum di-publish ke npm. Perlu Rust + wasm-pack buat build.
2. **Pindah ke Netlify Function + `@neplex/vectorizer`** — ini Node.js
   binding VTracer (bukan WASM browser) yang udah full color. Taruh di
   `netlify/functions/vectorize.js`, terima base64 image, return SVG. Upload
   gambar tetap kirim ke function (bukan pure client-side lagi), tapi masih
   di infra sendiri jadi nggak ada limit shared-account.

Buat kebutuhan icon flat/outline (yang paling sering lo bikin), mode
single-color yang udah jalan ini kemungkinan udah cukup.

## Yang bisa ditambah nanti


- Batch ZIP download (pakai `jszip`)
- Preset per niche (icon flat vs line art vs detailed)
- Integrasi langsung ke Stock Icon Metadata Generator lo — abis trace,
  lempar hasil SVG ke situ buat generate metadata + export CSV sekalian.
