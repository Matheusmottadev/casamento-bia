const summaryGrid = document.querySelector("#dashboard-summary");
const reservationsTable = document.querySelector("#dashboard-reservations");
const purchasesTable = document.querySelector("#dashboard-purchases");
const rsvpsTable = document.querySelector("#dashboard-rsvps");
const giftsTable = document.querySelector("#dashboard-gifts");
const dashboardFeedback = document.querySelector("#dashboard-feedback");

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

function renderRows(items, columns, emptyLabel) {
  if (!items.length) {
    return `<tr><td colspan="${columns.length}">${emptyLabel}</td></tr>`;
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
      <article class="dashboard-metric"><strong>${data.summary.totalGuests}</strong><span>Confirmações</span></article>
      <article class="dashboard-metric"><strong>${data.summary.totalReservations}</strong><span>Reservas</span></article>
      <article class="dashboard-metric"><strong>${data.summary.totalPurchases}</strong><span>Compras</span></article>
      <article class="dashboard-metric"><strong>${formatCurrencyFromCents(data.summary.totalPaidAmount)}</strong><span>Total pago</span></article>
    `;

    giftsTable.innerHTML = renderRows(
      data.gifts,
      [
        (gift) => gift.title,
        (gift) => (gift.type === "reservation" ? "Lista física" : "Compra online"),
        (gift) => String(gift.quantity || 1),
        (gift) => String(gift.reservedCount || 0),
        (gift) => String(gift.paidCount || 0),
        (gift) => String(gift.pendingCount || 0),
      ],
      "Nenhum presente cadastrado ainda.",
    );

    reservationsTable.innerHTML = renderRows(
      data.reservations,
      [
        (item) => item.giftTitle,
        (item) => item.name,
        (item) => item.contact || "-",
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma reserva registrada.",
    );

    purchasesTable.innerHTML = renderRows(
      data.purchases,
      [
        (item) => item.giftTitle,
        (item) => `${item.firstName} ${item.lastName}`.trim() || "-",
        (item) => formatCurrencyFromCents(item.amountTotal, item.currency || "brl"),
        (item) => item.paymentStatus || "-",
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma compra registrada.",
    );

    rsvpsTable.innerHTML = renderRows(
      data.rsvps,
      [
        (item) => `${item.firstName} ${item.lastName}`.trim(),
        (item) => item.phone || "-",
        (item) => formatDate(item.createdAt),
      ],
      "Nenhuma confirmação de presença registrada.",
    );

    dashboardFeedback.textContent = "";
  } catch (error) {
    console.error("Nao foi possivel carregar o painel dos noivos.", error);
    dashboardFeedback.textContent = "Nao foi possivel carregar o painel agora.";
  }
}

loadCoupleDashboard();
