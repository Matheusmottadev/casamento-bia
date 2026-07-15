const summaryGrid = document.querySelector("#dashboard-summary");
const reservationsTable = document.querySelector("#dashboard-reservations");
const purchasesTable = document.querySelector("#dashboard-purchases");
const rsvpsTable = document.querySelector("#dashboard-rsvps");
const giftsTable = document.querySelector("#dashboard-gifts");
const dashboardFeedback = document.querySelector("#dashboard-feedback");
const dashboardMeta = document.querySelector("#dashboard-meta");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrencyFromCents(amountInCents, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(amountInCents) || 0) / 100);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
}

function formatGiftType(type) {
  return type === "reservation" ? "Lista fisica" : "Compra online";
}

function formatGiftQuantity(gift) {
  return gift.type === "purchase" ? "Infinita" : String(gift.quantity || 1);
}

function renderBadge(label, tone = "neutral") {
  return `<span class="dashboard-badge dashboard-badge--${tone}">${escapeHtml(label)}</span>`;
}

function getGiftAvailability(gift) {
  if (gift.type !== "reservation") {
    return {
      label: gift.paidCount > 0 ? "Pago" : gift.pendingCount > 0 ? "Pendente" : "Disponivel",
      tone: gift.paidCount > 0 ? "success" : gift.pendingCount > 0 ? "warning" : "neutral",
    };
  }

  const totalQuantity = Number(gift.quantity || 1);
  const reservedCount = Number(gift.reservedCount || 0);
  const remaining = totalQuantity - reservedCount;

  if (remaining <= 0) {
    return { label: "Esgotado", tone: "muted" };
  }

  if (remaining === 1) {
    return { label: "1 unidade", tone: "warning" };
  }

  return { label: `${remaining} unidades`, tone: "success" };
}

function formatPurchaseStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "paid", "succeeded"].includes(normalized)) {
    return renderBadge("Pago", "success");
  }

  if (["pending", "in_process", "authorized"].includes(normalized)) {
    return renderBadge("Pendente", "warning");
  }

  if (normalized) {
    return renderBadge(normalized, "muted");
  }

  return "-";
}

function renderRows(items, columns, emptyLabel) {
  if (!items.length) {
    return `<tr><td colspan="${columns.length}" class="dashboard-empty-cell">${escapeHtml(emptyLabel)}</td></tr>`;
  }

  return items
    .map(
      (item) => `
        <tr>
          ${columns.map((column) => `<td>${column(item)}</td>`).join("")}
        </tr>
      `,
    )
    .join("");
}

async function loadCoupleDashboard() {
  if (!summaryGrid || !dashboardFeedback) return;

  try {
    dashboardFeedback.textContent = "Carregando dados dos noivos...";
    const response = await fetch("/api/couple-dashboard");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    summaryGrid.innerHTML = `
      <article class="dashboard-metric"><strong>${data.summary.totalGuests}</strong><span>Confirmacoes de presenca</span></article>
      <article class="dashboard-metric"><strong>${data.summary.totalReservations}</strong><span>Itens da lista fisica reservados</span></article>
      <article class="dashboard-metric"><strong>${data.summary.totalPurchases}</strong><span>Compras registradas</span></article>
      <article class="dashboard-metric"><strong>${formatCurrencyFromCents(data.summary.totalPaidAmount)}</strong><span>Total pago aprovado</span></article>
    `;

    const sortedGifts = [...data.gifts].sort((left, right) => {
      if (left.type !== right.type) {
        return left.type.localeCompare(right.type);
      }

      return String(left.title || "").localeCompare(String(right.title || ""));
    });

    giftsTable.innerHTML = renderRows(
      sortedGifts,
      [
        (gift) => `<strong>${escapeHtml(gift.title)}</strong>`,
        (gift) => escapeHtml(formatGiftType(gift.type)),
        (gift) => {
          const availability = getGiftAvailability(gift);
          return renderBadge(availability.label, availability.tone);
        },
        (gift) => formatGiftQuantity(gift),
        (gift) => String(gift.reservedCount || 0),
        (gift) => String(gift.paidCount || 0),
        (gift) => String(gift.pendingCount || 0),
      ],
      "Nenhum presente cadastrado ainda.",
    );

    reservationsTable.innerHTML = renderRows(
      data.reservations,
      [
        (item) => `<strong>${escapeHtml(item.giftTitle)}</strong>`,
        (item) => escapeHtml(item.name),
        (item) => escapeHtml(item.contact || "-"),
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma reserva registrada.",
    );

    purchasesTable.innerHTML = renderRows(
      data.purchases,
      [
        (item) => `<strong>${escapeHtml(item.giftTitle)}</strong>`,
        (item) => escapeHtml(`${item.firstName} ${item.lastName}`.trim() || "-"),
        (item) => formatCurrencyFromCents(item.amountTotal, item.currency || "brl"),
        (item) => formatPurchaseStatus(item.paymentStatus),
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma compra registrada.",
    );

    rsvpsTable.innerHTML = renderRows(
      data.rsvps,
      [
        (item) => `<strong>${escapeHtml(`${item.firstName} ${item.lastName}`.trim())}</strong>`,
        (item) => escapeHtml(item.phone || "-"),
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma confirmação de presença registrada.",
    );

    dashboardFeedback.textContent = "";
    if (dashboardMeta) {
      dashboardMeta.textContent = `Atualizado em ${new Date().toLocaleString("pt-BR")}`;
    }
  } catch (error) {
    console.error("Nao foi possivel carregar o painel dos noivos.", error);
    dashboardFeedback.textContent = "Nao foi possivel carregar o painel agora.";
    if (dashboardMeta) {
      dashboardMeta.textContent = "Falha ao atualizar";
    }
  }
}

loadCoupleDashboard();
