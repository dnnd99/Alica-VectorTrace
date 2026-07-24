# Icon Vectorizer

Vectorizer PNG/JPG → SVG full color, self-hosted. Upload gambar → diproses di
Netlify Function pakai [`@neplex/vectorizer`](https://github.com/neplextech/vectorizer)
(Node native binding buat VTracer) → SVG balik ke browser buat preview & download.

Kenapa nggak full client-side WASM: udah dicoba pakai `vectortracer` (WASM
browser), tapi library-nya masih eksperimental dan panic ("unreachable")
di beberapa gambar. `@neplex/vectorizer` pakai native binary yang jauh lebih
stabil dan sekalian dapet full color mode (bukan cuma line-art).

## Coba lokal

Perlu [Netlify CLI](https://docs.netlify.com/cli/get-started/) buat jalanin
function-nya lokal:

```bash
npm install -g netlify-cli
npm install
netlify dev
```

Buka URL yang muncul (biasanya `http://localhost:8888`), drag-drop gambar,
atur slider kalau perlu, download hasil SVG.

## Push ke GitHub

```bash
git init
git add .
git commit -m "init icon vectorizer"
gh repo create icon-vectorizer --public --source=. --push
```

## Deploy ke Netlify

1. Login ke [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect ke GitHub, pilih repo `icon-vectorizer`
3. Build settings kebaca otomatis dari `netlify.toml` (nggak ada build command,
   langsung publish static files + auto-detect function di `netlify/functions`)
4. Deploy. Dependency `@neplex/vectorizer` ada di `package.json` root (bukan
   di folder function) — ini emang required sama Netlify biar ke-install
   otomatis pas build. Setiap push ke `main` auto-redeploy.

## Cara kerja

- Frontend baca file jadi base64, POST ke `/.netlify/functions/vectorize`
- Function jalanin `vectorize()` dari `@neplex/vectorizer` (native Rust binding,
  ada prebuilt binary buat Linux x64 — cocok sama runtime Netlify Functions)
- SVG string balik ke frontend, langsung di-preview + bisa didownload

## Yang bisa ditambah nanti

- Batch ZIP download (pakai `jszip` di frontend)
- Preset per niche (icon flat vs line art vs detailed)
- Rate limit / auth simple kalau nanti mau dipakai bareng-bareng
- Integrasi langsung ke Stock Icon Metadata Generator — abis trace,
  lempar hasil SVG ke situ buat generate metadata + export CSV sekalian
