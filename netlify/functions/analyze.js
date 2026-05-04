export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Server is missing ANTHROPIC_API_KEY");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return jsonError(502, `Upstream fetch failed: ${err.message}`);
  }

  const text = await resp.text();

  if (!resp.ok) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const message =
      parsed?.error?.message ||
      (typeof parsed === "string" ? parsed : null) ||
      text.slice(0, 400) ||
      `Anthropic ${resp.status} ${resp.statusText}`;
    console.error("Anthropic error", resp.status, message);
    return jsonError(resp.status, message);
  }

  return new Response(text, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
};

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
