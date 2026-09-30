import { hex } from "./felica.js";
import { t, formatDate } from "./i18n.js";

function formatYen(n) {
  return `¥${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function createView() {
  const balanceEl = document.getElementById("balance");
  const idmEl = document.getElementById("idm");
  const trips = document.getElementById("trips");
  const cardLive = document.getElementById("card-live");
  const cardAway = document.getElementById("card-away");
  const data = document.getElementById("data");
  const history = document.getElementById("history");
  const presence = document.getElementById("presence");
  const splash = document.getElementById("splash");
  const splashCard = document.getElementById("splash-card");
  const splashGo = document.getElementById("splash-go");
  const splashNote = document.getElementById("splash-note");
  const app = document.getElementById("app");

  let mode = "";
  let blocked = false;

  function setNote(key, tone) {
    splashNote.hidden = !key;
    splashNote.textContent = key ? t(key) : "";
    if (key) splashNote.dataset.i18n = key;
    else delete splashNote.dataset.i18n;
    splashNote.classList.toggle("is-error", tone === "error");
  }

  function blockConnect(key) {
    blocked = true;
    setNote(key, "error");
    document.getElementById("splash-hint").hidden = true;
    for (const el of [splashCard, splashGo]) {
      el.disabled = true;
      el.classList.add("is-unavailable");
      el.setAttribute("aria-describedby", "splash-note");
    }
  }

  function setBusy(on) {
    if (blocked) return;
    for (const el of [splashCard, splashGo]) {
      el.disabled = on;
      if (on) el.setAttribute("aria-busy", "true");
      else el.removeAttribute("aria-busy");
    }
  }

  function hideSplash() {
    if (splash.hidden) return;
    app.hidden = false;
    const done = () => {
      splash.hidden = true;
      splash.classList.remove("is-leaving");
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done();
      return;
    }
    splash.classList.add("is-leaving");
    splash.addEventListener("animationend", done, { once: true });
    setTimeout(done, 280);
  }

  function showAway() {
    if (mode === "away") return;
    mode = "away";
    cardLive.hidden = true;
    cardAway.hidden = false;
    data.hidden = true;
    history.hidden = true;
    presence.hidden = false;
  }

  function showLive() {
    if (mode === "live") return;
    mode = "live";
    cardLive.hidden = false;
    cardAway.hidden = true;
    data.hidden = false;
    history.hidden = false;
    presence.hidden = true;
  }

  function render(card) {
    balanceEl.textContent = card.balance == null ? "—" : formatYen(card.balance);
    idmEl.textContent = hex(card.idm);
    trips.replaceChildren();
    if (!card.history.length) {
      const empty = document.createElement("p");
      empty.className = "py-3.5 text-sm text-foreground-secondary";
      empty.dataset.i18n = "empty";
      empty.textContent = t("empty");
      trips.append(empty);
      return;
    }
    for (const trip of card.history) {
      const row = document.createElement("div");
      row.className = "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-3.5 sm:gap-x-4";
      const left = document.createElement("div");
      left.className = "min-w-0";
      const title = document.createElement("p");
      title.className = "font-medium";
      title.dataset.i18n = trip.kind;
      title.textContent = t(trip.kind);
      const meta = document.createElement("p");
      meta.className = "flex flex-wrap gap-x-3 text-sm text-foreground-secondary";
      const date = document.createElement("span");
      date.dataset.date = trip.date;
      date.textContent = formatDate(trip.date);
      meta.append(date);
      if (trip.time) {
        const time = document.createElement("span");
        time.textContent = trip.time;
        meta.append(time);
      }
      left.append(title, meta);
      const right = document.createElement("div");
      right.className = "shrink-0 text-right font-mono tabular-nums";
      const amount = document.createElement("p");
      amount.className = "font-medium";
      amount.textContent = trip.amount == null ? "—" : `${trip.credit ? "+" : "−"}${formatYen(trip.amount)}`;
      const bal = document.createElement("p");
      bal.className = "text-sm text-foreground-secondary";
      bal.textContent = formatYen(trip.balance);
      right.append(amount, bal);
      row.append(left, right);
      trips.append(row);
    }
  }

  function fail(e, onReader) {
    const name = e.name || "";
    const msg = String(e.message || "");
    if (e.code === "nousb" || name === "nousb") {
      blockConnect("nousb");
      return;
    }
    if (e.code === "insecure" || name === "SecurityError") {
      setNote("insecure");
      return;
    }
    if (name === "NotFoundError" || name === "NotAllowedError") {
      setNote("unselected");
      return;
    }
    if (/claim|busy|access denied|in use|protected/i.test(msg)) {
      setNote("inuse");
      return;
    }
    if (msg === "timeout" || msg === "ack") {
      onReader();
      setNote("timeout");
      return;
    }
    setNote("failed");
  }

  return {
    splashCard,
    splashGo,
    get mode() { return mode; },
    setNote,
    blockConnect,
    setBusy,
    hideSplash,
    showAway,
    showLive,
    render,
    fail,
  };
}
