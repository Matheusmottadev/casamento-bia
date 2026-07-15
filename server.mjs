import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(__dirname, ".data");
const catalogSourceFile = path.join(__dirname, "data", "gifts-catalog.json");
const visitorsFile = path.join(dataDir, "visitors.json");
const messagesFile = path.join(dataDir, "messages.json");
const giftReservationsFile = path.join(dataDir, "gift-reservations.json");
const purchasesFile = path.join(dataDir, "purchases.json");
const rsvpsFile = path.join(dataDir, "rsvps.json");
const { Pool } = pg;

const mimeTypes = {
  ".mp3": "audio/mpeg",
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

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.DATABASE_PRIVATE_URL) return process.env.DATABASE_PRIVATE_URL;
  if (process.env.DATABASE_PUBLIC_URL) return process.env.DATABASE_PUBLIC_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;

  const host = process.env.PGHOST;
  const portValue = process.env.PGPORT || "5432";
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${portValue}/${database}`;
  }

  return "";
}

const databaseUrl = resolveDatabaseUrl();
const shouldDisableSsl =
  process.env.PGSSLMODE === "disable" ||
  (typeof databaseUrl === "string" &&
    (databaseUrl.includes("localhost") ||
      databaseUrl.includes("127.0.0.1") ||
      databaseUrl.includes(".railway.internal") ||
      databaseUrl.includes(".internal")));
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: shouldDisableSsl ? false : { rejectUnauthorized: false },
    })
  : null;
const hasDatabase = Boolean(pool);

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function ensureLocalStoreFile(filePath, rootKey) {
  await ensureDataDir();

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({ [rootKey]: [] }, null, 2));
  }
}

async function query(text, params = []) {
  if (!pool) {
    throw new Error("Banco PostgreSQL nao configurado. Defina DATABASE_URL, DATABASE_PRIVATE_URL, POSTGRES_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE.");
  }

  const result = await pool.query(text, params);
  return result.rows;
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

async function execute(text, params = []) {
  if (!pool) {
    throw new Error("Banco PostgreSQL nao configurado. Defina DATABASE_URL, DATABASE_PRIVATE_URL, POSTGRES_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE.");
  }

  await pool.query(text, params);
}

async function ensureDatabase() {
  if (!pool) {
    throw new Error("Banco PostgreSQL nao configurado. Defina DATABASE_URL, DATABASE_PRIVATE_URL, POSTGRES_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE.");
  }

  await execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      ip_hash TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS gift_catalog (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      price_label TEXT,
      quantity INTEGER NOT NULL DEFAULT 1
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS gift_reservations (
      id BIGSERIAL PRIMARY KEY,
      gift_id TEXT NOT NULL,
      name TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL DEFAULT '',
      payment_intent_id TEXT NOT NULL DEFAULT '',
      provider TEXT NOT NULL DEFAULT '',
      external_reference TEXT NOT NULL DEFAULT '',
      gateway_preference_id TEXT NOT NULL DEFAULT '',
      gateway_payment_id TEXT NOT NULL DEFAULT '',
      gift_title TEXT NOT NULL,
      amount_total INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'brl',
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      payment_status TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS purchases_external_reference_idx
    ON purchases (external_reference)
    WHERE external_reference <> '';
  `);

  await seedGiftCatalog();
  await importLegacyDataIfNeeded();
}

async function seedGiftCatalog() {
  const source = await fs.readFile(catalogSourceFile, "utf8");
  const parsed = JSON.parse(source || '{"gifts":[]}');
  const gifts = Array.isArray(parsed.gifts) ? parsed.gifts : [];

  for (const gift of gifts) {
    await execute(
      `
        INSERT INTO gift_catalog (id, type, title, price_label, quantity)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET type = EXCLUDED.type,
            title = EXCLUDED.title,
            price_label = EXCLUDED.price_label,
            quantity = EXCLUDED.quantity;
      `,
      [
        gift.id,
        gift.type,
        gift.title,
        gift.priceLabel ?? null,
        Number(gift.quantity || 1),
      ],
    );
  }
}

async function readLegacyStore(filePath, rootKey) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return Array.isArray(parsed[rootKey]) ? parsed[rootKey] : [];
  } catch {
    return [];
  }
}

async function writeLocalStore(filePath, rootKey, items) {
  await ensureLocalStoreFile(filePath, rootKey);
  await fs.writeFile(filePath, JSON.stringify({ [rootKey]: items }, null, 2));
}

async function importLegacyDataIfNeeded() {
  const [visitorsCount, messagesCount, reservationsCount, rsvpsCount, purchasesCount] = await Promise.all([
    queryOne(`SELECT COUNT(*)::INT AS total FROM visitors;`),
    queryOne(`SELECT COUNT(*)::INT AS total FROM messages;`),
    queryOne(`SELECT COUNT(*)::INT AS total FROM gift_reservations;`),
    queryOne(`SELECT COUNT(*)::INT AS total FROM rsvps;`),
    queryOne(`SELECT COUNT(*)::INT AS total FROM purchases;`),
  ]);

  if (!Number(visitorsCount?.total || 0)) {
    const visitors = await readLegacyStore(visitorsFile, "visitors");
    for (const ipHash of visitors) {
      await execute(`INSERT INTO visitors (ip_hash) VALUES ($1) ON CONFLICT (ip_hash) DO NOTHING;`, [String(ipHash)]);
    }
  }

  if (!Number(messagesCount?.total || 0)) {
    const messages = await readLegacyStore(messagesFile, "messages");
    for (const item of messages) {
      await execute(`INSERT INTO messages (name, message, created_at) VALUES ($1, $2, $3);`, [
        String(item.name || ""),
        String(item.message || ""),
        item.createdAt || new Date().toISOString(),
      ]);
    }
  }

  if (!Number(reservationsCount?.total || 0)) {
    const reservations = await readLegacyStore(giftReservationsFile, "reservations");
    for (const item of reservations) {
      await execute(`INSERT INTO gift_reservations (gift_id, name, contact, created_at) VALUES ($1, $2, $3, $4);`, [
        String(item.giftId || ""),
        String(item.name || ""),
        String(item.contact || ""),
        item.createdAt || new Date().toISOString(),
      ]);
    }
  }

  if (!Number(rsvpsCount?.total || 0)) {
    const rsvps = await readLegacyStore(rsvpsFile, "rsvps");
    for (const item of rsvps) {
      await execute(`INSERT INTO rsvps (first_name, last_name, phone, created_at) VALUES ($1, $2, $3, $4);`, [
        String(item.firstName || ""),
        String(item.lastName || ""),
        String(item.phone || ""),
        item.createdAt || new Date().toISOString(),
      ]);
    }
  }

  if (!Number(purchasesCount?.total || 0)) {
    const purchases = await readLegacyStore(purchasesFile, "purchases");
    for (const item of purchases) {
      await execute(
        `
          INSERT INTO purchases (
            session_id,
            payment_intent_id,
            provider,
            external_reference,
            gateway_preference_id,
            gateway_payment_id,
            gift_title,
            amount_total,
            currency,
            first_name,
            last_name,
            payment_method,
            phone,
            payment_status,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
        `,
        [
          String(item.sessionId || ""),
          String(item.paymentIntentId || ""),
          String(item.provider || ""),
          String(item.externalReference || ""),
          String(item.gatewayPreferenceId || ""),
          String(item.gatewayPaymentId || ""),
          String(item.giftTitle || ""),
          Number(item.amountTotal || 0),
          String(item.currency || "brl"),
          String(item.firstName || ""),
          String(item.lastName || ""),
          String(item.paymentMethod || ""),
          String(item.phone || ""),
          String(item.paymentStatus || ""),
          item.createdAt || new Date().toISOString(),
        ],
      );
    }
  }
}

async function readVisitors() {
  if (!pool) {
    return (await readLegacyStore(visitorsFile, "visitors")).map((ipHash) => ({ ipHash: String(ipHash) }));
  }

  return query(`SELECT ip_hash AS "ipHash" FROM visitors ORDER BY created_at ASC;`);
}

async function readMessages() {
  if (!pool) {
    const messages = await readLegacyStore(messagesFile, "messages");
    return messages.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  return query(`
    SELECT id, name, message, created_at AS "createdAt"
    FROM messages
    ORDER BY created_at DESC;
  `);
}

async function readGiftReservations() {
  if (!pool) {
    const reservations = await readLegacyStore(giftReservationsFile, "reservations");
    return reservations.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  return query(`
    SELECT id, gift_id AS "giftId", name, contact, created_at AS "createdAt"
    FROM gift_reservations
    ORDER BY created_at DESC;
  `);
}

async function readRsvps() {
  if (!pool) {
    const rsvps = await readLegacyStore(rsvpsFile, "rsvps");
    return rsvps.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  return query(`
    SELECT id, first_name AS "firstName", last_name AS "lastName", phone, created_at AS "createdAt"
    FROM rsvps
    ORDER BY created_at DESC;
  `);
}

async function readPurchases() {
  if (!pool) {
    const purchases = await readLegacyStore(purchasesFile, "purchases");
    return purchases.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  return query(`
    SELECT
      id,
      session_id AS "sessionId",
      payment_intent_id AS "paymentIntentId",
      provider,
      external_reference AS "externalReference",
      gateway_preference_id AS "gatewayPreferenceId",
      gateway_payment_id AS "gatewayPaymentId",
      gift_title AS "giftTitle",
      amount_total AS "amountTotal",
      currency,
      first_name AS "firstName",
      last_name AS "lastName",
      payment_method AS "paymentMethod",
      phone,
      payment_status AS "paymentStatus",
      created_at AS "createdAt"
    FROM purchases
    ORDER BY created_at DESC;
  `);
}

async function readGiftCatalog() {
  if (!pool) {
    const source = await fs.readFile(catalogSourceFile, "utf8");
    const parsed = JSON.parse(source || '{"gifts":[]}');
    const gifts = Array.isArray(parsed.gifts) ? parsed.gifts : [];
    return gifts.sort((a, b) => `${a.type}:${a.title}`.localeCompare(`${b.type}:${b.title}`));
  }

  return query(`
    SELECT id, type, title, price_label AS "priceLabel", quantity
    FROM gift_catalog
    ORDER BY type ASC, title ASC;
  `);
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

  if (!pool) {
    const visitors = await readLegacyStore(visitorsFile, "visitors");
    if (!visitors.includes(ipHash)) {
      visitors.push(ipHash);
      await writeLocalStore(visitorsFile, "visitors", visitors);
    }
    return visitors.length;
  }

  await execute(
    `
      INSERT INTO visitors (ip_hash)
      VALUES ($1)
      ON CONFLICT (ip_hash) DO NOTHING;
    `,
    [ipHash],
  );

  const result = await queryOne(`SELECT COUNT(*)::INT AS total FROM visitors;`);
  return Number(result?.total || 0);
}

async function createMessage({ name, message }) {
  if (!pool) {
    const messages = await readLegacyStore(messagesFile, "messages");
    messages.unshift({
      id: Date.now(),
      name: name.slice(0, 60),
      message: message.slice(0, 280),
      createdAt: new Date().toISOString(),
    });
    await writeLocalStore(messagesFile, "messages", messages);
    return messages;
  }

  await query(
    `
      INSERT INTO messages (name, message)
      VALUES ($1, $2);
    `,
    [name.slice(0, 60), message.slice(0, 280)],
  );

  return readMessages();
}

async function createGiftReservation({ giftId, name, contact = "" }) {
  if (!pool) {
    const reservations = await readLegacyStore(giftReservationsFile, "reservations");
    reservations.unshift({
      id: Date.now(),
      giftId: giftId.slice(0, 80),
      name: name.slice(0, 80),
      contact: contact.slice(0, 120),
      createdAt: new Date().toISOString(),
    });
    await writeLocalStore(giftReservationsFile, "reservations", reservations);
    return reservations;
  }

  await query(
    `
      INSERT INTO gift_reservations (gift_id, name, contact)
      VALUES ($1, $2, $3);
    `,
    [giftId.slice(0, 80), name.slice(0, 80), contact.slice(0, 120)],
  );

  return readGiftReservations();
}

async function createRsvp({ firstName, lastName, phone }) {
  if (!pool) {
    const rsvps = await readLegacyStore(rsvpsFile, "rsvps");
    rsvps.unshift({
      id: Date.now(),
      firstName: firstName.slice(0, 80),
      lastName: lastName.slice(0, 80),
      phone: phone.slice(0, 40),
      createdAt: new Date().toISOString(),
    });
    await writeLocalStore(rsvpsFile, "rsvps", rsvps);
    return rsvps;
  }

  await query(
    `
      INSERT INTO rsvps (first_name, last_name, phone)
      VALUES ($1, $2, $3);
    `,
    [firstName.slice(0, 80), lastName.slice(0, 80), phone.slice(0, 40)],
  );

  return readRsvps();
}

async function createPurchase(purchase) {
  if (!pool) {
    const purchases = await readLegacyStore(purchasesFile, "purchases");
    purchases.unshift({
      id: Date.now(),
      sessionId: purchase.sessionId ?? "",
      paymentIntentId: purchase.paymentIntentId ?? "",
      provider: purchase.provider ?? "",
      externalReference: purchase.externalReference ?? "",
      gatewayPreferenceId: purchase.gatewayPreferenceId ?? "",
      gatewayPaymentId: purchase.gatewayPaymentId ?? "",
      giftTitle: purchase.giftTitle.slice(0, 160),
      amountTotal: Number(purchase.amountTotal || 0),
      currency: purchase.currency.slice(0, 12),
      firstName: purchase.firstName.slice(0, 80),
      lastName: purchase.lastName.slice(0, 80),
      paymentMethod: purchase.paymentMethod.slice(0, 80),
      phone: purchase.phone.slice(0, 40),
      paymentStatus: purchase.paymentStatus.slice(0, 40),
      createdAt: purchase.createdAt,
    });
    await writeLocalStore(purchasesFile, "purchases", purchases);
    return purchases;
  }

  await query(
    `
      INSERT INTO purchases (
        session_id,
        payment_intent_id,
        provider,
        external_reference,
        gateway_preference_id,
        gateway_payment_id,
        gift_title,
        amount_total,
        currency,
        first_name,
        last_name,
        payment_method,
        phone,
        payment_status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
    `,
    [
      purchase.sessionId ?? "",
      purchase.paymentIntentId ?? "",
      purchase.provider ?? "",
      purchase.externalReference ?? "",
      purchase.gatewayPreferenceId ?? "",
      purchase.gatewayPaymentId ?? "",
      purchase.giftTitle.slice(0, 160),
      Number(purchase.amountTotal || 0),
      purchase.currency.slice(0, 12),
      purchase.firstName.slice(0, 80),
      purchase.lastName.slice(0, 80),
      purchase.paymentMethod.slice(0, 80),
      purchase.phone.slice(0, 40),
      purchase.paymentStatus.slice(0, 40),
      purchase.createdAt,
    ],
  );

  return readPurchases();
}

async function upsertPurchaseByExternalReference(externalReference, nextPurchase) {
  const normalizedReference = externalReference.slice(0, 120);

  if (!pool) {
    const purchases = await readLegacyStore(purchasesFile, "purchases");
    const existingIndex = purchases.findIndex((purchase) => String(purchase.externalReference || "") === normalizedReference);
    const nextRecord = {
      id: existingIndex >= 0 ? purchases[existingIndex].id : Date.now(),
      sessionId: nextPurchase.sessionId ?? "",
      paymentIntentId: nextPurchase.paymentIntentId ?? "",
      provider: nextPurchase.provider ?? "",
      externalReference: normalizedReference,
      gatewayPreferenceId: nextPurchase.gatewayPreferenceId ?? "",
      gatewayPaymentId: nextPurchase.gatewayPaymentId ?? "",
      giftTitle: nextPurchase.giftTitle.slice(0, 160),
      amountTotal: Number(nextPurchase.amountTotal || 0),
      currency: nextPurchase.currency.slice(0, 12),
      firstName: nextPurchase.firstName.slice(0, 80),
      lastName: nextPurchase.lastName.slice(0, 80),
      paymentMethod: nextPurchase.paymentMethod.slice(0, 80),
      phone: nextPurchase.phone.slice(0, 40),
      paymentStatus: nextPurchase.paymentStatus.slice(0, 40),
      createdAt: nextPurchase.createdAt,
    };

    if (existingIndex >= 0) {
      purchases[existingIndex] = nextRecord;
    } else {
      purchases.unshift(nextRecord);
    }

    await writeLocalStore(purchasesFile, "purchases", purchases);
    return purchases;
  }

  const existingPurchase = await queryOne(
    `
      SELECT id
      FROM purchases
      WHERE external_reference = $1
      LIMIT 1;
    `,
    [normalizedReference],
  );

  const values = [
    nextPurchase.sessionId ?? "",
    nextPurchase.paymentIntentId ?? "",
    nextPurchase.provider ?? "",
    normalizedReference,
    nextPurchase.gatewayPreferenceId ?? "",
    nextPurchase.gatewayPaymentId ?? "",
    nextPurchase.giftTitle.slice(0, 160),
    Number(nextPurchase.amountTotal || 0),
    nextPurchase.currency.slice(0, 12),
    nextPurchase.firstName.slice(0, 80),
    nextPurchase.lastName.slice(0, 80),
    nextPurchase.paymentMethod.slice(0, 80),
    nextPurchase.phone.slice(0, 40),
    nextPurchase.paymentStatus.slice(0, 40),
    nextPurchase.createdAt,
  ];

  if (existingPurchase) {
    await query(
      `
        UPDATE purchases
        SET
          session_id = $1,
          payment_intent_id = $2,
          provider = $3,
          external_reference = $4,
          gateway_preference_id = $5,
          gateway_payment_id = $6,
          gift_title = $7,
          amount_total = $8,
          currency = $9,
          first_name = $10,
          last_name = $11,
          payment_method = $12,
          phone = $13,
          payment_status = $14,
          created_at = $15
        WHERE id = $16;
      `,
      [...values, existingPurchase.id],
    );
  } else {
    await query(
      `
        INSERT INTO purchases (
          session_id,
          payment_intent_id,
          provider,
          external_reference,
          gateway_preference_id,
          gateway_payment_id,
          gift_title,
          amount_total,
          currency,
          first_name,
          last_name,
          payment_method,
          phone,
          payment_status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
      `,
      values,
    );
  }

  return readPurchases();
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

function parseIntegerEnv(name, fallback) {
  const rawValue = String(process.env[name] || "").trim();

  if (!rawValue) return fallback;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePaymentStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "paid", "succeeded"].includes(normalized)) {
    return "paid";
  }

  if (["pending", "in_process", "authorized"].includes(normalized)) {
    return "pending";
  }

  return normalized || "unknown";
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
    const details =
      data.message || data.error_description || data.error || data.cause?.[0]?.description || `Mercado Pago HTTP ${response.status}`;
    throw new Error(details);
  }

  return data;
}

function validateMercadoPagoWebhookSignature(request, requestUrl, payload) {
  const secret = String(process.env.MP_WEBHOOK_SECRET || "").trim();

  if (!secret) return;

  WebhookSignatureValidator.validate({
    xSignature: request.headers["x-signature"],
    xRequestId: request.headers["x-request-id"],
    dataId: String(payload?.data?.id || requestUrl.searchParams.get("data.id") || requestUrl.searchParams.get("id") || "").trim(),
    secret,
  });
}

async function ensureAppData() {
  if (pool) {
    await ensureDatabase();
    return;
  }

  await Promise.all([
    ensureLocalStoreFile(visitorsFile, "visitors"),
    ensureLocalStoreFile(messagesFile, "messages"),
    ensureLocalStoreFile(giftReservationsFile, "reservations"),
    ensureLocalStoreFile(rsvpsFile, "rsvps"),
    ensureLocalStoreFile(purchasesFile, "purchases"),
  ]);
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
      validateMercadoPagoWebhookSignature(request, requestUrl, payload);
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
      if (error instanceof InvalidWebhookSignatureError) {
        console.error("Assinatura invalida no webhook do Mercado Pago:", {
          reason: error.reason,
          requestId: error.requestId,
          timestamp: error.timestamp,
        });
        sendJson(response, 401, { error: "Webhook do Mercado Pago com assinatura invalida." });
        return;
      }

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
      const maxInstallments = Math.min(Math.max(parseIntegerEnv("MP_MAX_INSTALLMENTS", 12), 1), 36);
      const defaultInstallments = Math.min(
        Math.max(parseIntegerEnv("MP_DEFAULT_INSTALLMENTS", 1), 1),
        maxInstallments,
      );
      const differentialPricingId = parseIntegerEnv("MP_DIFFERENTIAL_PRICING_ID", 0);
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
          payment_methods: {
            installments: maxInstallments,
            default_installments: defaultInstallments,
          },
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
          ...(differentialPricingId > 0
            ? {
                differential_pricing: {
                  id: differentialPricingId,
                },
              }
            : {}),
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
      sendJson(response, 500, {
        error: "Nao foi possivel iniciar o pagamento agora.",
        details: error instanceof Error ? error.message : "Erro desconhecido no Mercado Pago.",
      });
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

  if (requestUrl.pathname === "/api/couple-dashboard" && request.method === "GET") {
    try {
      const [gifts, reservations, purchases, rsvps] = await Promise.all([
        readGiftCatalog(),
        readGiftReservations(),
        readPurchases(),
        readRsvps(),
      ]);

      const reservationGiftTitles = new Map(gifts.map((gift) => [gift.id, gift.title]));

      const reservationRows = reservations.map((reservation) => ({
        ...reservation,
        giftTitle: reservationGiftTitles.get(reservation.giftId) || reservation.giftId,
      }));

      const giftsWithStats = gifts.map((gift) => {
        const reservedCount = reservationRows.filter((reservation) => reservation.giftId === gift.id).length;
        const matchingPurchases = purchases.filter((purchase) => purchase.giftTitle === gift.title);
        const paidCount = matchingPurchases.filter((purchase) => normalizePaymentStatus(purchase.paymentStatus) === "paid").length;
        const pendingCount = matchingPurchases.filter((purchase) => normalizePaymentStatus(purchase.paymentStatus) === "pending").length;

        return {
          ...gift,
          reservedCount,
          paidCount,
          pendingCount,
        };
      });

      const paidPurchases = purchases.filter((purchase) => normalizePaymentStatus(purchase.paymentStatus) === "paid");
      const totalPaidAmount = paidPurchases.reduce((sum, purchase) => sum + (Number(purchase.amountTotal) || 0), 0);

      sendJson(response, 200, {
        summary: {
          totalGuests: rsvps.length,
          totalReservations: reservations.length,
          totalPurchases: purchases.length,
          totalPaidAmount,
        },
        gifts: giftsWithStats,
        reservations: reservationRows,
        purchases,
        rsvps,
      });
    } catch (error) {
      console.error("Erro ao carregar painel dos noivos:", error);
      sendJson(response, 500, { error: "Nao foi possivel carregar o painel dos noivos." });
    }
    return;
  }

  await serveStaticFile(response, requestUrl.pathname);
});

ensureAppData()
  .then(() => {
    server.listen(port, () => {
      const storageLabel = hasDatabase ? "PostgreSQL" : "armazenamento local (.data)";
      console.log(`Servidor rodando em http://127.0.0.1:${port} usando ${storageLabel}`);
    });
  })
  .catch((error) => {
    console.error("Nao foi possivel inicializar a aplicacao:", error);
    process.exit(1);
  });
