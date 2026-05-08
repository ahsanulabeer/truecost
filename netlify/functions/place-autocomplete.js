const PLACES_BASE = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return jsonError(
      500,
      "Server is missing GOOGLE_MAPS_SERVER_KEY (or GOOGLE_MAPS_API_KEY)"
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const query = body?.query?.trim();
  if (!query || query.length < 3) {
    return jsonOk({ suggestions: [] });
  }

  const url =
    `${PLACES_BASE}?input=${encodeURIComponent(query)}` +
    `&types=address&components=country:us&key=${apiKey}`;

  try {
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error("Places HTTP error", r.status, text.slice(0, 300));
      return jsonOk({
        suggestions: [],
        upstreamStatus: `HTTP ${r.status}`,
        upstreamMessage: text.slice(0, 300),
      });
    }
    const data = await r.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error", data.status, data.error_message);
      return jsonOk({
        suggestions: [],
        upstreamStatus: data.status,
        upstreamMessage: data.error_message || null,
      });
    }
    const suggestions = (data.predictions || []).slice(0, 5).map((p) => ({
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || "",
    }));
    return jsonOk({ suggestions });
  } catch (err) {
    console.error("Places fetch failed", err);
    return jsonOk({
      suggestions: [],
      upstreamStatus: "FETCH_FAILED",
      upstreamMessage: err.message,
    });
  }
};

function jsonOk(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
