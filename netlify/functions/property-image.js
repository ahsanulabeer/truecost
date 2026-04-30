const STATIC_BASE = "https://maps.googleapis.com/maps/api";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Server is missing GOOGLE_MAPS_API_KEY");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const address = body?.address?.trim();
  if (!address) {
    return jsonError(400, "Missing address");
  }

  const enc = encodeURIComponent(address);

  let hasStreetView = false;
  try {
    const r = await fetch(
      `${STATIC_BASE}/streetview/metadata?location=${enc}&key=${apiKey}`
    );
    if (r.ok) {
      const meta = await r.json();
      hasStreetView = meta.status === "OK";
    }
  } catch {
    // fall through — map-only result
  }

  const streetViewUrl = hasStreetView
    ? `${STATIC_BASE}/streetview?size=800x350&location=${enc}&fov=80&pitch=4&key=${apiKey}`
    : null;

  const mapUrl = `${STATIC_BASE}/staticmap?center=${enc}&zoom=17&size=800x350&maptype=hybrid&markers=color:0xc44b4b%7C${enc}&key=${apiKey}`;

  return jsonOk({ hasStreetView, streetViewUrl, mapUrl });
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
