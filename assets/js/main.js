const weddingDate = new Date("2026-09-18T16:00:00-03:00");
const unitElements = {
  days: document.querySelector("[data-unit='days']"),
  hours: document.querySelector("[data-unit='hours']"),
  minutes: document.querySelector("[data-unit='minutes']"),
  seconds: document.querySelector("[data-unit='seconds']"),
};
const unitLabels = {
  days: "dias",
  hours: "horas",
  minutes: "minutos",
  seconds: "segundos",
};
const unitState = {};

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const desktopNavGroup = document.querySelector(".desktop-nav__group");
const desktopNavTrigger = document.querySelector(".desktop-nav__trigger");
const rsvpOpenTriggers = document.querySelectorAll("[data-open-rsvp='true']");
const visitorCountElement = document.querySelector("#visitor-count");
const siteHeader = document.querySelector(".site-header");
const heroSection = document.querySelector(".hero");
const messageForm = document.querySelector("#message-form");
const messageWall = document.querySelector("#message-wall");
const messageFeedback = document.querySelector("#message-feedback");
const messagesPanel = document.querySelector("#messages-panel");
const messageStage = document.querySelector("#message-stage");
const messagePrimaryView = document.querySelector("#message-primary-view");
const messageBoard = document.querySelector("#message-board");
const messageToggle = document.querySelector("#message-toggle");
const rsvpModal = document.querySelector("#rsvp-modal");
const rsvpModalClose = document.querySelector("#rsvp-modal-close");
const rsvpForm = document.querySelector("#rsvp-form");
const rsvpFeedback = document.querySelector("#rsvp-feedback");
const messageRotation = {
  messages: [],
  currentIndex: 0,
  timerId: null,
  isBoardMode: false,
};

function formatNumber(value) {
  return String(value).padStart(2, "0");
}

function sanitizePhone(value) {
  return String(value).replace(/[^\d()+\-\s]/g, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setUnitValue(element, value, unitKey, animate = false) {
  const currentValues = element.querySelectorAll(".flip-unit__value--current");
  const nextValues = element.querySelectorAll(".flip-unit__value--next");
  const previousValue = unitState[unitKey];

  element.setAttribute("aria-label", `${value} ${unitLabels[unitKey]}`);

  if (previousValue === undefined || previousValue === value || !animate) {
    currentValues.forEach((node) => {
      node.textContent = value;
    });
    nextValues.forEach((node) => {
      node.textContent = value;
    });
    unitState[unitKey] = value;
    return;
  }

  nextValues.forEach((node) => {
    node.textContent = value;
  });
  element.classList.remove("is-flipping");
  void element.offsetWidth;
  element.classList.add("is-flipping");

  const onAnimationEnd = () => {
    currentValues.forEach((node) => {
      node.textContent = value;
    });
    nextValues.forEach((node) => {
      node.textContent = value;
    });
    element.classList.remove("is-flipping");
    element.removeEventListener("animationend", onAnimationEnd);
  };

  element.addEventListener("animationend", onAnimationEnd);
  unitState[unitKey] = value;
}

function updateCountdown() {
  const now = new Date();
  const difference = Math.max(0, weddingDate.getTime() - now.getTime());

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  setUnitValue(unitElements.days, formatNumber(days), "days", true);
  setUnitValue(unitElements.hours, formatNumber(hours), "hours", true);
  setUnitValue(unitElements.minutes, formatNumber(minutes), "minutes", true);
  setUnitValue(unitElements.seconds, formatNumber(seconds), "seconds", true);
}

async function updateVisitorCount() {
  if (!visitorCountElement) return;

  try {
    const response = await fetch("/api/visitors");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    visitorCountElement.textContent = String(data.uniqueVisitors ?? 0);
  } catch (error) {
    console.error("Nao foi possivel carregar a contagem de visitantes.", error);
  }
}

function createMessageCard({ name, message }) {
  return `
    <article class="message-card message-card--active">
      <strong class="message-card__name">${escapeHtml(name)}</strong>
      <p class="message-card__text">${escapeHtml(message)}</p>
    </article>
  `;
}

function createBoardMessageCard({ name, message }) {
  return `
    <article class="message-board__card">
      <strong class="message-board__name">${escapeHtml(name)}</strong>
      <p class="message-board__text">${escapeHtml(message)}</p>
    </article>
  `;
}

function stopMessageRotation() {
  if (!messageRotation.timerId) return;

  clearInterval(messageRotation.timerId);
  messageRotation.timerId = null;
}

function getMessageDisplayDuration(messageItem) {
  const nameLength = String(messageItem?.name ?? "").trim().length;
  const messageLength = String(messageItem?.message ?? "").trim().length;
  const contentLength = nameLength + messageLength;
  const baseDuration = 3200;
  const extraDuration = contentLength * 42;
  const longMessageBonus = messageLength > 120 ? (messageLength - 120) * 18 : 0;

  return Math.min(13500, Math.max(3600, baseDuration + extraDuration + longMessageBonus));
}

function scheduleNextMessage() {
  stopMessageRotation();

  if (messageRotation.messages.length <= 1) {
    return;
  }

  const currentMessage = messageRotation.messages[messageRotation.currentIndex];
  const duration = getMessageDisplayDuration(currentMessage);

  messageRotation.timerId = window.setTimeout(() => {
    messageRotation.currentIndex = (messageRotation.currentIndex + 1) % messageRotation.messages.length;
    showMessage(messageRotation.currentIndex);
    scheduleNextMessage();
  }, duration);
}

function showMessage(index) {
  if (!messageWall) return;

  const selectedMessage = messageRotation.messages[index];

  if (!selectedMessage) return;

  messageWall.innerHTML = createMessageCard(selectedMessage);
}

function renderMessageBoard(messages) {
  if (!messageBoard) return;

  if (!messages.length) {
    messageBoard.innerHTML = '<div class="message-card__empty">Nenhuma mensagem ainda. Seja o primeiro a deixar um recado para o casal.</div>';
    return;
  }

  messageBoard.innerHTML = messages.map((item) => createBoardMessageCard(item)).join("");
}

function resizeMessageStage(immediate = false) {
  if (!messageStage || !messagePrimaryView || !messageBoard) return;

  const activeView = messageRotation.isBoardMode ? messageBoard : messagePrimaryView;
  const nextHeight = activeView.scrollHeight;

  if (immediate) {
    messageStage.style.height = `${nextHeight}px`;
    return;
  }

  requestAnimationFrame(() => {
    messageStage.style.height = `${nextHeight}px`;
  });
}

function syncMessageMode() {
  if (!messageForm || !messageWall || !messageBoard || !messageToggle || !messagesPanel || !messagePrimaryView || !messageStage) return;

  const boardMode = messageRotation.isBoardMode;
  const wasBoardMode = messagesPanel.classList.contains("messages-panel--board-mode");
  const fromView = wasBoardMode ? messageBoard : messagePrimaryView;

  if (boardMode) {
    stopMessageRotation();
    renderMessageBoard(messageRotation.messages);
  } else if (messageRotation.messages.length) {
    showMessage(messageRotation.currentIndex);
    scheduleNextMessage();
  } else {
    renderMessages([]);
    return;
  }

  messageStage.style.height = `${fromView.scrollHeight}px`;
  messagesPanel.classList.toggle("messages-panel--board-mode", boardMode);
  messagePrimaryView.setAttribute("aria-hidden", String(boardMode));
  messageBoard.setAttribute("aria-hidden", String(!boardMode));
  messageToggle.textContent = boardMode ? "Voltar para destaque" : "Ver todas as mensagens";
  messageToggle.setAttribute("aria-expanded", String(boardMode));

  if (!messageStage.dataset.ready) {
    messageStage.dataset.ready = "true";
    resizeMessageStage(true);
    return;
  }

  resizeMessageStage(false);
}

function renderMessages(messages) {
  if (!messageWall) return;

  stopMessageRotation();
  messageRotation.messages = messages;

  if (messageRotation.isBoardMode) {
    renderMessageBoard(messages);
    resizeMessageStage(true);
    return;
  }

  if (!messages.length) {
    messageWall.innerHTML = '<div class="message-card__empty">Nenhuma mensagem ainda. Seja o primeiro a deixar um recado para o casal.</div>';
    resizeMessageStage(true);
    return;
  }

  messageRotation.currentIndex = 0;
  showMessage(messageRotation.currentIndex);
  scheduleNextMessage();
  resizeMessageStage(true);
}

async function loadMessages() {
  if (!messageWall) return;

  try {
    const response = await fetch("/api/messages");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderMessages(data.messages ?? []);
  } catch (error) {
    console.error("Nao foi possivel carregar as mensagens.", error);
    messageWall.innerHTML = '<div class="message-card__empty">Nao foi possivel carregar as mensagens agora.</div>';
  }
}

async function submitMessage(event) {
  event.preventDefault();

  if (!messageForm || !messageFeedback) return;

  const formData = new FormData(messageForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    message: String(formData.get("message") || "").trim(),
  };

  if (!payload.name || !payload.message) {
    messageFeedback.textContent = "Preencha seu nome e sua mensagem.";
    return;
  }

  if (payload.message.length < 25) {
    messageFeedback.textContent = "Capricha na mensagem, só aceito com no mínimo 25 letras, né? Vai, você consegue.";
    return;
  }

  try {
    messageFeedback.textContent = "Enviando mensagem...";

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderMessages(data.messages ?? []);
    messageForm.reset();
    messageFeedback.textContent = "Mensagem enviada com sucesso.";
  } catch (error) {
    console.error("Nao foi possivel enviar a mensagem.", error);
    messageFeedback.textContent = "Nao foi possivel enviar sua mensagem agora.";
  }
}

function setMenuState(isOpen) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.hidden = !isOpen;
}

function setDesktopPagesMenuState(isOpen) {
  if (!desktopNavGroup || !desktopNavTrigger) return;

  desktopNavGroup.classList.toggle("desktop-nav__group--open", isOpen);
  desktopNavTrigger.setAttribute("aria-expanded", String(isOpen));
}

function openRsvpModal() {
  if (!rsvpModal) return;

  rsvpModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => {
    rsvpModal.classList.add("rsvp-modal--visible");
    rsvpForm?.querySelector("input")?.focus();
  }, 10);
}

function closeRsvpModal() {
  if (!rsvpModal) return;

  rsvpModal.classList.remove("rsvp-modal--visible");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    rsvpModal.hidden = true;
  }, 220);
}

function updateHeaderState() {
  if (!siteHeader || !heroSection) return;

  const headerHeight = siteHeader.offsetHeight;
  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  const shouldBeSolid = window.scrollY + headerHeight >= heroBottom - 24;

  siteHeader.classList.toggle("site-header--solid", shouldBeSolid);
}

async function submitRsvp(event) {
  event.preventDefault();

  if (!rsvpForm || !rsvpFeedback) return;

  const formData = new FormData(rsvpForm);
  const payload = {
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    phone: sanitizePhone(formData.get("phone") || ""),
  };

  if (!payload.firstName || !payload.lastName || !payload.phone) {
    rsvpFeedback.textContent = "Preenche nome, sobrenome e número para confirmar sua presença.";
    return;
  }

  try {
    rsvpFeedback.textContent = "Confirmando presença...";

    const response = await fetch("/api/rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    rsvpForm.reset();
    rsvpFeedback.textContent = "Presença confirmada com sucesso.";
    window.setTimeout(() => {
      closeRsvpModal();
    }, 650);
  } catch (error) {
    console.error("Nao foi possivel confirmar a presenca.", error);
    rsvpFeedback.textContent = "Nao foi possivel confirmar sua presença agora.";
  }
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

desktopNavTrigger?.addEventListener("click", () => {
  const isOpen = desktopNavTrigger.getAttribute("aria-expanded") === "true";
  setDesktopPagesMenuState(!isOpen);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

desktopNavGroup?.querySelectorAll(".desktop-nav__submenu a").forEach((link) => {
  link.addEventListener("click", () => setDesktopPagesMenuState(false));
});

messageForm?.addEventListener("submit", submitMessage);
rsvpForm?.addEventListener("submit", submitRsvp);
messageToggle?.addEventListener("click", () => {
  messageRotation.isBoardMode = !messageRotation.isBoardMode;
  syncMessageMode();
});
rsvpOpenTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setMenuState(false);
    openRsvpModal();
  });
});
rsvpModalClose?.addEventListener("click", closeRsvpModal);

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    setMenuState(false);
  }

  updateHeaderState();
});

window.addEventListener("scroll", updateHeaderState, { passive: true });

document.addEventListener("click", (event) => {
  if (!desktopNavGroup || !desktopNavTrigger) return;

  if (!desktopNavGroup.contains(event.target)) {
    setDesktopPagesMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDesktopPagesMenuState(false);
    closeRsvpModal();
  }
});

rsvpModal?.addEventListener("click", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement && target.hasAttribute("data-close-rsvp")) {
    closeRsvpModal();
  }
});

Object.entries(unitElements).forEach(([unitKey, element]) => {
  if (element) {
    setUnitValue(element, "00", unitKey, false);
  }
});

if (Object.values(unitElements).every(Boolean)) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

updateVisitorCount();
updateHeaderState();
loadMessages();
syncMessageMode();
