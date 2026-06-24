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
const purchasesFile = path.join(dataDir, "purchases.json");
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

async function ensurePurchasesStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(purchasesFile);
  } catch {
    await fs.writeFile(purchasesFile, JSON.stringify({ purchases: [] }, null, 2));
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

async function readPurchases() {
  await ensurePurchasesStore();
  const raw = await fs.readFile(purchasesFile, "utf8");
  const parsed = JSON.parse(raw || '{"purchases":[]}');
  return Array.isArray(parsed.purchases) ? parsed.purchases : [];
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

async function createPurchase(purchase) {
  writeQueue = writeQueue.then(async () => {
    const purchases = await readPurchases();
    purchases.unshift({
      id: purchase.id ?? Date.now(),
      sessionId: purchase.sessionId ?? "",
      paymentIntentId: purchase.paymentIntentId ?? "",
      provider: purchase.provider ?? "",
      externalReference: purchase.externalReference ?? "",
      gatewayPreferenceId: purchase.gatewayPreferenceId ?? "",
      gatewayPaymentId: purchase.gatewayPaymentId ?? "",
      giftTitle: purchase.giftTitle.slice(0, 160),
      amountTotal: purchase.amountTotal,
      currency: purchase.currency.slice(0, 12),
      firstName: purchase.firstName.slice(0, 80),
      lastName: purchase.lastName.slice(0, 80),
      paymentMethod: purchase.paymentMethod.slice(0, 80),
      phone: purchase.phone.slice(0, 40),
      paymentStatus: purchase.paymentStatus.slice(0, 40),
      createdAt: purchase.createdAt,
    });
    await fs.writeFile(purchasesFile, JSON.stringify({ purchases }, null, 2));
    return purchases;
  });

  return writeQueue;
}

async function upsertPurchaseByExternalReference(externalReference, nextPurchase) {
  writeQueue = writeQueue.then(async () => {
    const purchases = await readPurchases();
    const normalizedReference = externalReference.slice(0, 120);
    const index = purchases.findIndex((purchase) => purchase.externalReference === normalizedReference);
    const normalizedPurchase = {
      id: nextPurchase.id ?? Date.now(),
      sessionId: nextPurchase.sessionId ?? "",
      paymentIntentId: nextPurchase.paymentIntentId ?? "",
      provider: nextPurchase.provider ?? "",
      externalReference: normalizedReference,
      gatewayPreferenceId: nextPurchase.gatewayPreferenceId ?? "",
      gatewayPaymentId: nextPurchase.gatewayPaymentId ?? "",
      giftTitle: nextPurchase.giftTitle.slice(0, 160),
      amountTotal: nextPurchase.amountTotal,
      currency: nextPurchase.currency.slice(0, 12),
      firstName: nextPurchase.firstName.slice(0, 80),
      lastName: nextPurchase.lastName.slice(0, 80),
      paymentMethod: nextPurchase.paymentMethod.slice(0, 80),
      phone: nextPurchase.phone.slice(0, 40),
      paymentStatus: nextPurchase.paymentStatus.slice(0, 40),
      createdAt: nextPurchase.createdAt,
    };

    if (index >= 0) {
      purchases[index] = {
        ...purchases[index],
        ...normalizedPurchase,
      };
    } else {
      purchases.unshift(normalizedPurchase);
    }

    await fs.writeFile(purchasesFile, JSON.stringify({ purchases }, null, 2));
    return purchases;
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

function getAppBaseUrl(request) {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN.replace(/\/$/, "")}`;
  }

  return `http://${request.headers.host}`;
}

function parseCurrencyToCents(value) {
  const normalized = String(value || "")
    .trim()
    .replaceAll(/\s+/g, "")
    .replace(/^R\$\s*/i, "")
    .replaceAll(".", "")
    .replace(",", ".");

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NaN;
  }

  return Math.round(amount * 100);
}

function formatCurrencyFromCents(amountInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(amountInCents) || 0) / 100);
}

async function mercadopagoRequest(pathname, options = {}) {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("Mercado Pago nao configurado.");
  }

  const response = await fetch(`https://api.mercadopago.com${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Mercado Pago HTTP ${response.status}`);
  }

  return data;
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

  if (requestUrl.pathname === "/api/mercado-pago-webhook" && request.method === "POST") {
    try {
      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const paymentId =
        String(payload?.data?.id || requestUrl.searchParams.get("data.id") || requestUrl.searchParams.get("id") || "").trim();
      const topic = String(payload?.type || requestUrl.searchParams.get("type") || "").trim();

      if (!paymentId || (topic && topic !== "payment")) {
        sendJson(response, 200, { received: true, ignored: true });
        return;
      }

      const payment = await mercadopagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const externalReference = String(payment.external_reference || "").trim();

      if (externalReference) {
        await upsertPurchaseByExternalReference(externalReference, {
          id: Date.now(),
          sessionId: "",
          paymentIntentId: "",
          provider: "mercado_pago",
          externalReference,
          gatewayPreferenceId: String(payment.order?.id || payment.metadata?.preference_id || ""),
          gatewayPaymentId: String(payment.id || ""),
          giftTitle: String(
            payment.additional_info?.items?.[0]?.title || payment.description || payment.metadata?.gift_title || "Presente",
          ),
          amountTotal: Number(Math.round((Number(payment.transaction_amount) || 0) * 100)),
          currency: String(payment.currency_id || "BRL").toLowerCase(),
          firstName: String(payment.metadata?.first_name || ""),
          lastName: String(payment.metadata?.last_name || ""),
          paymentMethod: String(payment.payment_method_id || "mercado_pago"),
          phone: String(payment.metadata?.phone || ""),
          paymentStatus: String(payment.status || ""),
          createdAt: new Date().toISOString(),
        });
      }

      sendJson(response, 200, { received: true });
    } catch (error) {
      console.error("Erro ao processar webhook do Mercado Pago:", error);
      sendJson(response, 500, { error: "Nao foi possivel processar a notificacao." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/purchase-mercado-pago" && request.method === "POST") {
    try {
      if (!process.env.MP_ACCESS_TOKEN) {
        sendJson(response, 503, { error: "Mercado Pago nao configurado no servidor." });
        return;
      }

      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const giftTitle = String(payload.giftTitle || "").trim();
      const priceLabel = String(payload.priceLabel || "").trim();
      const firstName = String(payload.firstName || "").trim();
      const lastName = String(payload.lastName || "").trim();
      const phone = String(payload.phone || "").trim();
      const amountInCents = parseCurrencyToCents(payload.amount);

      if (!giftTitle || !firstName || !lastName || !phone || !Number.isFinite(amountInCents)) {
        sendJson(response, 400, { error: "Dados invalidos para iniciar o pagamento." });
        return;
      }

      const externalReference = `gift_${Date.now()}`;
      const baseUrl = getAppBaseUrl(request);
      const preference = await mercadopagoRequest("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              id: externalReference,
              title: giftTitle,
              quantity: 1,
              currency_id: "BRL",
              unit_price: amountInCents / 100,
              description: `Presente da lista de casamento para ${firstName} ${lastName}`.slice(0, 255),
            },
          ],
          external_reference: externalReference,
          notification_url: `${baseUrl}/api/mercado-pago-webhook`,
          back_urls: {
            success: `${baseUrl}/compra-sucesso.html`,
            pending: `${baseUrl}/compra-sucesso.html`,
            failure: `${baseUrl}/compra-cancelada.html`,
          },
          auto_return: "approved",
          metadata: {
            gift_title: giftTitle,
            price_label: priceLabel,
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        }),
      });

      await upsertPurchaseByExternalReference(externalReference, {
        id: Date.now(),
        sessionId: "",
        paymentIntentId: "",
        provider: "mercado_pago",
        externalReference,
        gatewayPreferenceId: String(preference.id || ""),
        gatewayPaymentId: "",
        giftTitle: escapeHtml(giftTitle),
        amountTotal: amountInCents,
        currency: "brl",
        firstName: escapeHtml(firstName),
        lastName: escapeHtml(lastName),
        paymentMethod: "mercado_pago_checkout_pro",
        phone: escapeHtml(phone),
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      sendJson(response, 200, {
        url: preference.init_point,
        externalReference,
      });
    } catch (error) {
      console.error("Erro ao criar checkout do Mercado Pago:", error);
      sendJson(response, 500, { error: "Nao foi possivel iniciar o pagamento agora." });
    }
    return;
  }

  if (requestUrl.pathname === "/api/purchase-status" && request.method === "GET") {
    try {
      const externalReference = String(requestUrl.searchParams.get("external_reference") || "").trim();
      const paymentId = String(requestUrl.searchParams.get("payment_id") || "").trim();
      const purchases = await readPurchases();
      const purchase = purchases.find(
        (entry) => entry.externalReference === externalReference || entry.gatewayPaymentId === paymentId,
      );

      if (!purchase) {
        sendJson(response, 404, { error: "Compra nao encontrada." });
        return;
      }

      sendJson(response, 200, {
        giftTitle: purchase.giftTitle,
        amountTotal: purchase.amountTotal,
        currency: purchase.currency || "brl",
        paymentStatus: purchase.paymentStatus,
        provider: purchase.provider || "mercado_pago",
        paymentMethod: purchase.paymentMethod || "mercado_pago",
      });
    } catch (error) {
      console.error("Erro ao consultar compra:", error);
      sendJson(response, 500, { error: "Nao foi possivel consultar a compra." });
    }
    return;
  }

  await serveStaticFile(response, requestUrl.pathname);
});

server.listen(port, () => {
  console.log(`Servidor rodando em http://127.0.0.1:${port}`);
});
