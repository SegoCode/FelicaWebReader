import { hex } from "./felica.js";

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

  function setNote(text) {
    splashNote.hidden = !text;
    splashNote.textContent = text;
  }

  function setBusy(on) {
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
      empty.textContent = "No trips.";
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
      title.textContent = trip.title;
      const meta = document.createElement("p");
      meta.className = "flex flex-wrap gap-x-3 text-sm text-foreground-secondary";
      const date = document.createElement("span");
      date.textContent = trip.date;
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
      setNote("This browser has no WebUSB. Open it in Chrome or Edge.");
      return;
    }
    if (e.code === "insecure" || name === "SecurityError") {
      setNote("WebUSB needs localhost or HTTPS.");
      return;
    }
    if (name === "NotFoundError" || name === "NotAllowedError") {
      setNote("No reader was selected. Press Connect reader.");
      return;
    }
    if (/claim|busy|access denied|in use|protected/i.test(msg)) {
      setNote("The reader is in use. Close the other program and press again.");
      return;
    }
    if (msg === "timeout" || msg === "ack") {
      onReader();
      setNote("The reader did not respond. Plug it back in and press Connect reader.");
      return;
    }
    setNote("Could not read. Press Connect reader.");
  }

  return {
    splashCard,
    splashGo,
    get mode() { return mode; },
    setNote,
    setBusy,
    hideSplash,
    showAway,
    showLive,
    render,
    fail,
  };
}
