// Calls the OFFICIAL Vectorizer.ai API (https://vectorizer.ai/api/documentation)
// Needs two env vars set in Netlify (Site settings > Environment variables):
//   VECTORIZER_API_ID
//   VECTORIZER_API_SECRET
// Get them from https://vectorizer.ai/account -> API tab.

const API_URL = "https://api.vectorizer.ai/api/v1/vectorize";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiId = process.env.VECTORIZER_API_ID;
  const apiSecret = process.env.VECTORIZER_API_SECRET;

  if (!apiId || !apiSecret) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error:
          "VECTORIZER_API_ID / VECTORIZER_API_SECRET belum di-set di environment variables Netlify."
      })
    };
  }

  try {
    const { imageBase64, options = {} } = JSON.parse(event.body);
    if (!imageBase64) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "imageBase64 is required" })
      };
    }

    const buf = Buffer.from(imageBase64, "base64");

    const form = new FormData();
    // Send as raw binary upload (no 1MB base64 string limit this way)
    form.append("image", new Blob([buf]), "image.png");
    form.append("mode", options.mode || "production"); // "test" = free, watermarked, for trying it out
    form.append("output.file_format", "svg");
    if (options.maxColors) {
      form.append("processing.max_colors", String(options.maxColors));
    }

    const auth = Buffer.from(`${apiId}:${apiSecret}`).toString("base64");

    const apiRes = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body: form
    });

    if (!apiRes.ok) {
      let message = `Vectorizer.ai error (HTTP ${apiRes.status})`;
      try {
        const errJson = await apiRes.json();
        message = errJson?.error?.message || message;
      } catch {
        // response wasn't JSON, ignore
      }
      return {
        statusCode: apiRes.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: message })
      };
    }

    const svg = await apiRes.text();

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ svg })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) })
    };
  }
}
