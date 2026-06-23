import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(__dirname, ".data");
const visitorsFile = path.join(dataDir, "visitors.json");
const messagesFile = path.join(dataDir, "messages.json");
const giftReservationsFile = path.join(dataDir, "gift-reservations.json");
const rsvpsFile = path.join(dataDir, "rsvps.json");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

let writeQueue = Promise.resolve();

async function ensureVisitorsStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(visitorsFile);
  } catch {
    await fs.writeFile(visitorsFile, JSON.stringify({ visitors: [] }, null, 2));
  }
}

async function ensureMessagesStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(messagesFile);
  } catch {
    await fs.writeFile(messagesFile, JSON.stringify({ messages: [] }, null, 2));
  }
}

async function ensureGiftReservationsStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(giftReservationsFile);
  } catch {
    await fs.writeFile(giftReservationsFile, JSON.stringify({ reservations: [] }, null, 2));
  }
}

async function ensureRsvpsStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(rsvpsFile);
  } catch {
    await fs.writeFile(rsvpsFile, JSON.stringify({ rsvps: [] }, null, 2));
  }
}

async function readVisitors() {
  await ensureVisitorsStore();
  const raw = await fs.readFile(visitorsFile, "utf8");
  const parsed = JSON.parse(raw || '{"visitors":[]}');
  return Array.isArray(parsed.visitors) ? parsed.visitors : [];
}

async function readMessages() {
  await ensureMessagesStore();
  const raw = await fs.readFile(messagesFile, "utf8");
  const parsed = JSON.parse(raw || '{"messages":[]}');
  return Array.isArray(parsed.messages) ? parsed.messages : [];
}

async function readGiftReservations() {
  await ensureGiftReservationsStore();
  const raw = await fs.readFile(giftReservationsFile, "utf8");
  const parsed = JSON.parse(raw || '{"reservations":[]}');
  return Array.isArray(parsed.reservations) ? parsed.reservations : [];
}

async function readRsvps() {
  await ensureRsvpsStore();
  const raw = await fs.readFile(rsvpsFile, "utf8");
  const parsed = JSON.parse(raw || '{"rsvps":[]}');
  return Array.isArray(parsed.rsvps) ? parsed.rsvps : [];
}

function hashIp(ipAddress) {
  return createHash("sha256").update(ipAddress).digest("hex");
}

function getClientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const firstForwarded = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "";
  const rawIp = firstForwarded || request.socket.remoteAddress || "unknown";
  return rawIp.replace(/^::ffff:/, "");
}

async function registerUniqueVisitor(request) {
  const ipHash = hashIp(getClientIp(request));

  writeQueue = writeQueue.then(async () => {
    const visitors = await readVisitors();

    if (!visitors.includes(ipHash)) {
      visitors.push(ipHash);
      await fs.writeFile(visitorsFile, JSON.stringify({ visitors }, null, 2));
    }

    return visitors.length;
  });

  return writeQueue;
}

async function createMessage({ name, message }) {
  writeQueue = writeQueue.then(async () => {
    const messages = await readMessages();
    messages.unshift({
      id: Date.now(),
      name: name.slice(0, 60),
      message: message.slice(0, 280),
      createdAt: new Date().toISOString(),
    });
    await fs.writeFile(messagesFile, JSON.stringify({ messages }, null, 2));
    return messages;
  });

  return writeQueue;
}

async function createGiftReservation({ giftId, name, contact = "" }) {
  writeQueue = writeQueue.then(async () => {
    const reservations = await readGiftReservations();
    reservations.unshift({
      id: Date.now(),
      giftId: giftId.slice(0, 80),
      name: name.slice(0, 80),
      contact: contact.slice(0, 120),
      createdAt: new Date().toISOString(),
    });
    await fs.writeFile(giftReservationsFile, JSON.stringify({ reservations }, null, 2));
    return reservations;
  });

  return writeQueue;
}

async function createRsvp({ firstName, lastName, phone }) {
  writeQueue = writeQueue.then(async () => {
    const rsvps = await readRsvps();
    rsvps.unshift({
      id: Date.now(),
      firstName: firstName.slice(0, 80),
      lastName: lastName.slice(0, 80),
      phone: phone.slice(0, 40),
      createdAt: new Date().toISOString(),
    });
    await fs.writeFile(rsvpsFile, JSON.stringify({ rsvps }, null, 2));
    return rsvps;
  });

  return writeQueue;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      resolve(body);
    });

    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function serveStaticFile(response, pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = path.join(__dirname, decodeURIComponent(normalizedPath));
  const safeRoot = `${__dirname}${path.sep}`;

  if (!resolvedPath.startsWith(safeRoot) && resolvedPath !== path.join(__dirname, "index.html")) {
    sendJson(response, 403, { error: "Acesso negado." });
    return;
  }

  try {
    const fileBuffer = await fs.readFile(resolvedPath);
    const extension = path.extname(resolvedPath);
    const contentType = mimeTypes[extension] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(fileBuffer);
  } catch {
    sendJson(response, 404, { error: "Arquivo nao encontrado." });
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/visitors") {
    try {
      const uniqueVisitors = await registerUniqueVisitor(request);
      sendJson(response, 200, { uniqueVisitors });
    } catch (error) {
      console.error("Erro ao registrar visitante:", error);
      sendJson(response, 500, { error: "Nao foi possivel registrar o visitante." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/messages" && request.method === "GET") {
    try {
      const messages = await readMessages();
      sendJson(response, 200, { messages });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      sendJson(response, 500, { error: "Nao foi possivel carregar as mensagens." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/messages" && request.method === "POST") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const name = String(payload.name || "").trim();
      const message = String(payload.message || "").trim();

      if (!name || !message) {
        sendJson(response, 400, { error: "Nome e mensagem sao obrigatorios." });
        return;
      }

      const messages = await createMessage({
        name: escapeHtml(name),
        message: escapeHtml(message),
      });

      sendJson(response, 200, { messages });
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      sendJson(response, 500, { error: "Nao foi possivel salvar a mensagem." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/gift-reservations" && request.method === "GET") {
    try {
      const reservations = await readGiftReservations();
      sendJson(response, 200, { reservations });
    } catch (error) {
      console.error("Erro ao carregar reservas de presentes:", error);
      sendJson(response, 500, { error: "Nao foi possivel carregar as reservas." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/gift-reservations" && request.method === "POST") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const giftId = String(payload.giftId || "").trim();
      const name = String(payload.name || "").trim();
      const contact = String(payload.contact || "").trim();

      if (!giftId || !name) {
        sendJson(response, 400, { error: "Presente e nome sao obrigatorios." });
        return;
      }

      const reservations = await createGiftReservation({
        giftId: escapeHtml(giftId),
        name: escapeHtml(name),
        contact: escapeHtml(contact),
      });

      sendJson(response, 200, { reservations });
    } catch (error) {
      console.error("Erro ao salvar reserva de presente:", error);
      sendJson(response, 500, { error: "Nao foi possivel salvar a reserva." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/rsvps" && request.method === "GET") {
    try {
      const rsvps = await readRsvps();
      sendJson(response, 200, { rsvps });
    } catch (error) {
      console.error("Erro ao carregar confirmacoes de presenca:", error);
      sendJson(response, 500, { error: "Nao foi possivel carregar as confirmacoes." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/rsvps" && request.method === "POST") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const firstName = String(payload.firstName || "").trim();
      const lastName = String(payload.lastName || "").trim();
      const phone = String(payload.phone || "").trim();

      if (!firstName || !lastName || !phone) {
        sendJson(response, 400, { error: "Nome, sobrenome e numero sao obrigatorios." });
        return;
      }

      const rsvps = await createRsvp({
        firstName: escapeHtml(firstName),
        lastName: escapeHtml(lastName),
        phone: escapeHtml(phone),
      });

      sendJson(response, 200, { rsvps });
    } catch (error) {
      console.error("Erro ao salvar confirmacao de presenca:", error);
      sendJson(response, 500, { error: "Nao foi possivel salvar a confirmacao." });
    }
    return;
  }

  await serveStaticFile(response, requestUrl.pathname);
});

server.listen(port, () => {
  console.log(`Servidor rodando em http://127.0.0.1:${port}`);
});
