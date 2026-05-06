const RENTCAST_BASE = "https://api.rentcast.io/v1";
const MAPS_BASE = "https://maps.googleapis.com/maps/api";
const GEOCODE_BASE = `${MAPS_BASE}/geocode/json`;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rentcastKey = process.env.RENTCAST_API_KEY;
  if (!rentcastKey) {
    return jsonError(500, "Server is missing RENTCAST_API_KEY");
  }
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const lat = Number(body?.latitude);
  const lng = Number(body?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return jsonError(400, "Missing or invalid latitude/longitude");
  }

  const limit = Number.isFinite(Number(body?.limit)) ? Number(body.limit) : 6;
  const rawOffset = Number(body?.offset);
  const offset =
    Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  const zip = mapsKey ? await reverseGeocodeZip(lat, lng, mapsKey) : null;

  const url = zip
    ? `${RENTCAST_BASE}/listings/sale?zipCode=${zip}&status=Active&limit=${limit}&offset=${offset}`
    : `${RENTCAST_BASE}/listings/sale?latitude=${lat}&longitude=${lng}&radius=1&status=Active&limit=${limit}&offset=${offset}`;

  try {
    const r = await fetch(url, { headers: { "X-Api-Key": rentcastKey } });
    if (!r.ok) {
      return jsonOk({ listings: [] });
    }
    const raw = await r.json();
    const base = Array.isArray(raw)
      ? raw
          .filter((l) => l.formattedAddress && l.price)
          .map((l) => ({
            address: l.formattedAddress,
            price: l.price,
            beds: l.bedrooms ?? null,
            baths: l.bathrooms ?? null,
            sqft: l.squareFootage ?? null,
            propertyType: l.propertyType ?? null,
          }))
      : [];
    const listings = await attachImages(base, mapsKey);
    return jsonOk({ listings });
  } catch {
    return jsonOk({ listings: [] });
  }
};

async function attachImages(listings, mapsKey) {
  if (!mapsKey) {
    return listings.map((l) => ({ ...l, streetViewUrl: null, mapUrl: null }));
  }
  return Promise.all(
    listings.map(async (l) => {
      const enc = encodeURIComponent(l.address);
      const hasStreetView = await checkStreetView(enc, mapsKey);
      return {
        ...l,
        streetViewUrl: hasStreetView
          ? `${MAPS_BASE}/streetview?size=600x300&location=${enc}&fov=80&pitch=4&key=${mapsKey}`
          : null,
        mapUrl: `${MAPS_BASE}/staticmap?center=${enc}&zoom=17&size=600x300&maptype=hybrid&markers=color:0xc44b4b%7C${enc}&key=${mapsKey}`,
      };
    })
  );
}

async function checkStreetView(enc, apiKey) {
  try {
    const r = await fetch(
      `${MAPS_BASE}/streetview/metadata?location=${enc}&key=${apiKey}`
    );
    if (!r.ok) return false;
    const meta = await r.json();
    return meta.status === "OK";
  } catch {
    return false;
  }
}

async function reverseGeocodeZip(lat, lng, apiKey) {
  try {
    const r = await fetch(
      `${GEOCODE_BASE}?latlng=${lat},${lng}&key=${apiKey}&result_type=postal_code`
    );
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status !== "OK") return null;
    for (const result of data.results || []) {
      const zipComponent = result.address_components?.find((c) =>
        c.types?.includes("postal_code")
      );
      if (zipComponent?.short_name) return zipComponent.short_name;
    }
    return null;
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
