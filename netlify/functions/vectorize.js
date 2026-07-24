import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from "@neplex/vectorizer";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { imageBase64, options = {} } = JSON.parse(event.body);
    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "imageBase64 is required" })
      };
    }

    const buf = Buffer.from(imageBase64, "base64");

    const svg = await vectorize(buf, {
      colorMode: options.blackWhite ? ColorMode.Binary : ColorMode.Color,
      colorPrecision: options.colorPrecision ?? 6,
      filterSpeckle: options.filterSpeckle ?? 4,
      spliceThreshold: options.spliceThreshold ?? 45,
      cornerThreshold: options.cornerThreshold ?? 60,
      hierarchical: Hierarchical.Stacked,
      mode: PathSimplifyMode.Spline,
      layerDifference: options.layerDifference ?? 5,
      lengthThreshold: 5,
      maxIterations: 2,
      pathPrecision: 5
    });

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
