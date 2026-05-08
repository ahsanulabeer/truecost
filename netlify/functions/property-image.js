const STATIC_BASE = "https://maps.googleapis.com/maps/api";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const browserKey = process.env.GOOGLE_MAPS_API_KEY;
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY || browserKey;
  if (!browserKey) {
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

  const [hasStreetView, geo] = await Promise.all([
    checkStreetView(enc, serverKey),
    geocodeAddress(enc, serverKey),
  ]);

  const streetViewUrl = hasStreetView
    ? `${STATIC_BASE}/streetview?size=800x350&location=${enc}&fov=80&pitch=4&key=${browserKey}`
    : null;

  const mapUrl = `${STATIC_BASE}/staticmap?center=${enc}&zoom=17&size=800x350&maptype=hybrid&markers=color:0xc44b4b%7C${enc}&key=${browserKey}`;

  const addressValid =
    !!geo?.hasStreetNumber &&
    !!geo?.locationType &&
    geo.locationType !== "APPROXIMATE";

  return jsonOk({
    hasStreetView,
    streetViewUrl,
    mapUrl,
    formattedAddress: geo?.formattedAddress || null,
    addressValid,
    geocodeError: geo?.error || null,
    geocodeErrorMessage: geo?.errorMessage || null,
    geocodeLocationType: geo?.locationType || null,
    geocodeHasStreetNumber: geo?.hasStreetNumber ?? null,
  });
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
    if (!r.ok) {
      console.error("Geocoding HTTP error", r.status);
      return { error: `HTTP ${r.status}` };
    }
    const data = await r.json();
    if (data.status !== "OK") {
      console.error("Geocoding error", data.status, data.error_message);
      return {
        error: data.status,
        errorMessage: data.error_message || null,
      };
    }
    const result = data.results?.[0];
    if (!result) return { error: "NO_RESULT" };
    const hasStreetNumber = (result.address_components || []).some((c) =>
      c.types?.includes("street_number")
    );
    return {
      formattedAddress: result.formatted_address || null,
      locationType: result.geometry?.location_type || null,
      hasStreetNumber,
    };
  } catch (err) {
    console.error("Geocoding fetch failed", err);
    return { error: "FETCH_FAILED", errorMessage: err.message };
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
