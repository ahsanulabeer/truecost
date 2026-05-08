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
  const browserKey = process.env.GOOGLE_MAPS_API_KEY;
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY || browserKey;

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

  const zipResult = serverKey
    ? await reverseGeocodeZip(lat, lng, serverKey)
    : { zip: null, error: "NO_SERVER_KEY" };

  const zip = zipResult?.zip || null;
  const queryMode = zip ? "zipCode" : "latLng";
  const baseQuery = zip
    ? `zipCode=${zip}`
    : `latitude=${lat}&longitude=${lng}&radius=1`;

  const halfLimit = Math.ceil(limit / 2);
  const halfOffset = Math.floor(offset / 2);

  try {
    const [sfhRaw, mfhRaw] = await Promise.all([
      fetchListings(baseQuery, "Single Family", halfLimit, halfOffset, rentcastKey),
      fetchListings(baseQuery, "Multi-Family", halfLimit, halfOffset, rentcastKey),
    ]);

    const merged = interleave(sfhRaw, mfhRaw);
    const seen = new Set();
    const base = [];
    for (const l of merged) {
      if (!l.formattedAddress || !l.price) continue;
      if (seen.has(l.formattedAddress)) continue;
      seen.add(l.formattedAddress);
      base.push({
        address: l.formattedAddress,
        price: l.price,
        beds: l.bedrooms ?? null,
        baths: l.bathrooms ?? null,
        sqft: l.squareFootage ?? null,
        propertyType: l.propertyType ?? null,
      });
      if (base.length >= limit) break;
    }

    const listings = await attachImages(base, browserKey, serverKey);
    return jsonOk({
      listings,
      debug: {
        queryMode,
        zip,
        zipError: zipResult?.error || null,
        sfhCount: sfhRaw.length,
        mfhCount: mfhRaw.length,
        finalCount: base.length,
      },
    });
  } catch (err) {
    console.error("RentCast fetch failed", err);
    return jsonOk({
      listings: [],
      debug: {
        queryMode,
        zip,
        zipError: zipResult?.error || null,
        fetchError: err.message,
      },
    });
  }
};

async function fetchListings(baseQuery, propertyType, limit, offset, apiKey) {
  const url =
    `${RENTCAST_BASE}/listings/sale?${baseQuery}` +
    `&propertyType=${encodeURIComponent(propertyType)}` +
    `&status=Active&limit=${limit}&offset=${offset}`;
  try {
    const r = await fetch(url, { headers: { "X-Api-Key": apiKey } });
    if (!r.ok) {
      console.error("RentCast HTTP error", propertyType, r.status);
      return [];
    }
    const raw = await r.json();
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    console.error("RentCast fetch failed", propertyType, err);
    return [];
  }
}

function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

async function attachImages(listings, browserKey, serverKey) {
  if (!browserKey) {
    return listings.map((l) => ({ ...l, streetViewUrl: null, mapUrl: null }));
  }
  return Promise.all(
    listings.map(async (l) => {
      const enc = encodeURIComponent(l.address);
      const hasStreetView = await checkStreetView(enc, serverKey);
      return {
        ...l,
        streetViewUrl: hasStreetView
          ? `${MAPS_BASE}/streetview?size=600x300&location=${enc}&fov=80&pitch=4&key=${browserKey}`
          : null,
        mapUrl: `${MAPS_BASE}/staticmap?center=${enc}&zoom=17&size=600x300&maptype=hybrid&markers=color:0xc44b4b%7C${enc}&key=${browserKey}`,
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
    if (!r.ok) {
      console.error("Reverse geocode HTTP error", r.status);
      return { zip: null, error: `HTTP ${r.status}` };
    }
    const data = await r.json();
    if (data.status !== "OK") {
      console.error("Reverse geocode error", data.status, data.error_message);
      return {
        zip: null,
        error: `${data.status}${data.error_message ? `: ${data.error_message}` : ""}`,
      };
    }
    for (const result of data.results || []) {
      const zipComponent = result.address_components?.find((c) =>
        c.types?.includes("postal_code")
      );
      if (zipComponent?.short_name) return { zip: zipComponent.short_name, error: null };
    }
    return { zip: null, error: "NO_POSTAL_CODE_RESULT" };
  } catch (err) {
    console.error("Reverse geocode fetch failed", err);
    return { zip: null, error: `FETCH_FAILED: ${err.message}` };
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
