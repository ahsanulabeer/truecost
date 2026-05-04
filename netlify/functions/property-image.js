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

  const [hasStreetView, formattedAddress] = await Promise.all([
    checkStreetView(enc, apiKey),
    geocodeAddress(enc, apiKey),
  ]);

  const streetViewUrl = hasStreetView
    ? `${STATIC_BASE}/streetview?size=800x350&location=${enc}&fov=80&pitch=4&key=${apiKey}`
    : null;

  const mapUrl = `${STATIC_BASE}/staticmap?center=${enc}&zoom=17&size=800x350&maptype=hybrid&markers=color:0xc44b4b%7C${enc}&key=${apiKey}`;

  return jsonOk({ hasStreetView, streetViewUrl, mapUrl, formattedAddress });
};

async function checkStreetView(enc, apiKey) {
  try {
    const r = await fetch(
      `${STATIC_BASE}/streetview/metadata?location=${enc}&key=${apiKey}`
    );
    if (!r.ok) return false;
    const meta = await r.json();
    return meta.status === "OK";
  } catch {
    return false;
  }
}

async function geocodeAddress(enc, apiKey) {
  try {
    const r = await fetch(
      `${STATIC_BASE}/geocode/json?address=${enc}&key=${apiKey}`
    );
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status !== "OK") return null;
    return data.results?.[0]?.formatted_address || null;
  } catch {
    return null;
  }
}

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
