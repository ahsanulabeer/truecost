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

  // Try active sale listings first for real listing price
  try {
    const r = await fetch(
      `${RENTCAST_BASE}/listings/sale?address=${encodeURIComponent(address)}&status=Active&limit=1`,
      { headers }
    );
    if (r.ok) {
      const listings = await r.json();
      if (listings.length > 0) {
        return jsonOk(mapListing(listings[0]));
      }
    }
  } catch {
    // Fall through to AVM
  }

  // Fallback: AVM valuation
  try {
    const r = await fetch(
      `${RENTCAST_BASE}/avm/value?address=${encodeURIComponent(address)}`,
      { headers }
    );
    if (r.ok) {
      const avm = await r.json();
      return jsonOk(mapAvm(avm));
    }
  } catch {
    // Fall through to null
  }

  return jsonOk(null);
};

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
