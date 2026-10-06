const { URL } = require("url");

/**
 * NetTest compatibility entrypoint.
 *
 * Supported:
 *   /api?id=81288983&type=movie
 *   /api?id=1399&type=tv&season=1&episode=1
 *   /api/title/81288983          (Vercel rewrite -> query form)
 *   /src/title/81288983          (Vercel rewrite -> query form)
 *
 * This file intentionally does not contain third-party session cookies or
 * credential-bypass logic. Put an authorized provider implementation in
 * ./provider.js and export: async function resolve(req) { ... }.
 */
module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const id = url.searchParams.get("id") || url.searchParams.get("tmdbId");

  if (!id) {
    return res.status(400).json({
      error: "Missing required query parameter 'id' or 'tmdbId'",
      usage: "/api?id=550&type=movie OR /api?id=1399&type=tv&season=1&episode=1",
      legacy: "/api/title/{id} or /src/title/{id}"
    });
  }

  let provider;
  try {
    provider = require("./provider");
  } catch (_) {
    return res.status(501).json({
      error: "Provider implementation not configured",
      id,
      type: url.searchParams.get("type") || "movie",
      message: "Add an authorized provider.js implementation. Routing is fixed."
    });
  }

  try {
    const result = await provider.resolve(req);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[NetTest] provider error:", err);
    return res.status(502).json({
      error: "Provider request failed",
      detail: err && err.message ? err.message : "Unknown provider error"
    });
  }
};
