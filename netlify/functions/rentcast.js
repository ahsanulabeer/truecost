const RENTCAST_BASE = "https://api.rentcast.io/v1";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Server is missing RENTCAST_API_KEY");
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

  const headers = { "X-Api-Key": apiKey };

  const [mainResult, propertyRecord] = await Promise.all([
    fetchListing(address, headers).then(
      (r) => r || fetchAvm(address, headers)
    ),
    fetchProperty(address, headers),
  ]);

  const tax = extractAnnualTax(propertyRecord);

  if (!mainResult && !tax) {
    return jsonOk(null);
  }

  return jsonOk({
    ...(mainResult || {}),
    annualTax: tax?.amount ?? null,
    taxYear: tax?.year ?? null,
  });
};

async function fetchListing(address, headers) {
  try {
    const r = await fetch(
      `${RENTCAST_BASE}/listings/sale?address=${encodeURIComponent(address)}&status=Active&limit=1`,
      { headers }
    );
    if (!r.ok) return null;
    const listings = await r.json();
    if (!Array.isArray(listings) || listings.length === 0) return null;
    return mapListing(listings[0]);
  } catch {
    return null;
  }
}

async function fetchAvm(address, headers) {
  try {
    const r = await fetch(
      `${RENTCAST_BASE}/avm/value?address=${encodeURIComponent(address)}`,
      { headers }
    );
    if (!r.ok) return null;
    const avm = await r.json();
    return mapAvm(avm);
  } catch {
    return null;
  }
}

async function fetchProperty(address, headers) {
  try {
    const r = await fetch(
      `${RENTCAST_BASE}/properties?address=${encodeURIComponent(address)}`,
      { headers }
    );
    if (!r.ok) return null;
    const data = await r.json();
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  } catch {
    return null;
  }
}

function extractAnnualTax(propertyRecord) {
  if (!propertyRecord) return null;
  const taxes = propertyRecord.propertyTaxes;
  if (!taxes) return null;
  let entries = [];
  if (Array.isArray(taxes)) {
    entries = taxes;
  } else if (typeof taxes === "object") {
    entries = Object.entries(taxes).map(([key, val]) => ({
      year: val?.year ?? Number(key) ?? null,
      ...val,
    }));
  }
  entries.sort((a, b) => (b.year || 0) - (a.year || 0));
  for (const entry of entries) {
    const amount =
      typeof entry?.total === "number"
        ? entry.total
        : typeof entry?.amount === "number"
          ? entry.amount
          : typeof entry === "number"
            ? entry
            : null;
    if (typeof amount === "number" && amount > 0) {
      return { amount, year: entry?.year ?? null };
    }
  }
  return null;
}

function mapListing(l) {
  return {
    source: "listing",
    price: l.price,
    address: l.formattedAddress,
    city: l.city,
    state: l.state,
    zipCode: l.zipCode,
    beds: l.bedrooms,
    baths: l.bathrooms,
    sqft: l.squareFootage,
    yearBuilt: l.yearBuilt,
    propertyType: l.propertyType,
    lotSize: l.lotSize,
    daysOnMarket: l.daysOnMarket,
    listedDate: l.listedDate,
  };
}

function mapAvm(a) {
  return {
    source: "estimate",
    price: a.price,
    priceLow: a.priceRangeLow,
    priceHigh: a.priceRangeHigh,
    address: a.formattedAddress,
    city: a.city,
    state: a.state,
    zipCode: a.zipCode,
    beds: a.bedrooms,
    baths: a.bathrooms,
    sqft: a.squareFootage,
    yearBuilt: a.yearBuilt,
    propertyType: a.propertyType,
    lotSize: a.lotSize,
  };
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
