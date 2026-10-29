const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const root = __dirname;
loadEnvFile();

const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webm": "video/webm"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    if (requestUrl.pathname === "/api/coach") {
      await handleCoach(request, response);
      return;
    }
    serveStatic(requestUrl.pathname, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "The server could not complete that request." });
  }
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Open http://localhost:${port} if ChessBloom is already running, or set a different PORT in .env.`);
    process.exitCode = 1;
    return;
  }
  console.error("ChessBloom server error:", error);
  process.exitCode = 1;
});

server.listen(port, () => {
  console.log(`ChessBloom is running at http://localhost:${port}`);
});

async function handleCoach(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Use POST for coach questions." });
    return;
  }
  if (!process.env.GOOGLE_AI_API_KEY) {
    sendJson(response, 503, { error: "GOOGLE_AI_API_KEY is not configured on the server." });
    return;
  }

  const body = await readJson(request);
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 500) {
    sendJson(response, 400, { error: "Ask a question between 1 and 500 characters." });
    return;
  }

  const model = process.env.GEMINI_MODEL || "gemma-4";
  const prompt = [
    "You are Bloom Coach, a patient chess mentor for a complete beginner.",
    "Answer in 2 to 4 short sentences. Be encouraging, concrete, and avoid unexplained jargon.",
    "If the user asks for a move, explain the principle rather than pretending to calculate a perfect engine move.",
    `The learner's question is: ${question}`,
    body.moves ? `Recent moves: ${JSON.stringify(body.moves).slice(0, 1800)}` : "",
    body.turn ? `Current turn: ${body.turn}` : ""
  ].filter(Boolean).join("\n");

  const apiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GOOGLE_AI_API_KEY)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    console.error("Google AI Studio error:", data);
    sendJson(response, 502, { error: "Google AI Studio could not answer right now." });
    return;
  }
  const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
  if (!answer) {
    sendJson(response, 502, { error: "The coach returned an empty answer." });
    return;
  }
  sendJson(response, 200, { answer });
}

function serveStatic(requestPath, response) {
  const requestedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root + path.sep)) {
    sendJson(response, 403, { error: "Forbidden." });
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { error: "Not found." });
      return;
    }
    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-cache"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", chunk => {
      raw += chunk;
      if (raw.length > 10000) request.destroy(new Error("Request too large."));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function loadEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
