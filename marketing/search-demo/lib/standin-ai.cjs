/**
 * A stand-in AI provider for recording videos, so a take needs no real key,
 * costs nothing and gives the same answer every time.
 *
 * It listens on 127.0.0.1 and speaks the OpenAI chat format the app already
 * uses for a "Custom (OpenAI Compatible)" provider. The app sends it the same
 * request it would send a real provider (vendor names and the ledger's own
 * category list). The reply is not a model's: each vendor is matched by a
 * keyword to a category and sub-category, and only to ones that appear in the
 * list the app sent. A vendor with no keyword gets no answer.
 *
 * Nothing in the app is changed for this. Say so wherever the video is
 * described, and do not caption the video as if data stayed on the device:
 * with a real provider, what the app sends leaves it.
 *
 *   const standIn = await startStandIn({ port: 5198 });
 *   ... record ...
 *   standIn.requests   // what the app sent, for checking a caption's claim
 *   await standIn.close();
 */
const http = require("http");

/** keyword in the vendor name -> [category, sub-category] */
const RULES = [
  [/cafe|coffee|espresso/i, ["Dining Out", "Coffee"]],
  [/book/i, ["Entertainment", "Books"]],
  [/pharmac|chemist/i, ["Health", "Pharmacy"]],
  [/transit|metro|tram|bus\b/i, ["Transport", "Public Transport"]],
  [/cinema|movie/i, ["Entertainment", "Movies"]],
  [/bakery/i, ["Groceries", "Bakery"]],
  [/gym|fitness/i, ["Health", "Gym"]],
  [/florist|gift/i, ["Shopping", "Gifts"]],
  [/\bvet\b/i, ["Pets", "Vet"]],
];

/** Reads the category list and the vendor list out of the app's prompt. */
function parsePrompt(prompt) {
  const categories = {};
  for (const m of prompt.matchAll(/Category: "([^"]+)", SubCategories: \[([^\]]*)\]/g)) {
    categories[m[1]] = m[2].split(",").map((s) => s.trim()).filter(Boolean);
  }
  let vendors = [];
  const list = prompt.match(/Vendors\/Payees to Categorize:\s*(\[.*?\])\s*\n/s);
  const single = prompt.match(/Vendor\/Payee Name: "([^"]+)"/);
  if (list) vendors = JSON.parse(list[1]);
  else if (single) vendors = [single[1]];
  return { categories, vendors, bulk: !!list };
}

function answer(prompt) {
  const { categories, vendors, bulk } = parsePrompt(prompt);
  const out = {};
  for (const vendor of vendors) {
    const rule = RULES.find(([re, [cat]]) => re.test(vendor) && categories[cat]);
    if (!rule) continue;
    const [cat, sub] = rule[1];
    out[vendor] = { categoryName: cat, subCategoryName: categories[cat].includes(sub) ? sub : "" };
  }
  return bulk ? out : out[vendors[0]] || { categoryName: "", subCategoryName: "" };
}

function startStandIn({ port = 5198, delayMs = 1400 } = {}) {
  const requests = [];
  // The app runs in a browser on another port, so it needs CORS headers.
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
  const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const json = (o) => { res.writeHead(200, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
      if (req.url.endsWith("/models")) return json({ data: [{ id: "demo-model" }] });
      if (!req.url.endsWith("/chat/completions")) { res.writeHead(404, cors); return res.end(); }
      let prompt = "";
      try { prompt = JSON.parse(body).messages[0].content; } catch { /* answered with {} below */ }
      requests.push({ url: req.url, prompt });
      // A short pause, so the app's "Calling AI" progress can be seen.
      setTimeout(() => json({ choices: [{ message: { content: JSON.stringify(answer(prompt)) } }] }), delayMs);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve({
      requests,
      url: `http://127.0.0.1:${port}/v1`,
      close: () => new Promise((r) => server.close(r)),
    }));
  });
}

module.exports = { startStandIn, parsePrompt, answer };
