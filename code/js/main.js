import { createTransport } from "./pasori.js";
import { init, poll, readPublic, hex } from "./felica.js";
import { createView } from "./ui.js";

const VID = 0x054c;
const PID = 0x01bb;

const view = createView();
const session = { device: null, needsReset: false };
const { transceive } = createTransport(session);

let ready = false;
let busy = false;
let watchGen = 0;
let shownIdm = "";
let shownKey = "";
let shownAt = 0;

function setBusy(on) {
  busy = on;
  view.setBusy(on);
}

function showAway() {
  if (view.mode === "away") return;
  shownIdm = "";
  shownKey = "";
  view.showAway();
}

function begin() {
  showAway();
  view.hideSplash();
  watch();
}

async function connect() {
  if (!("usb" in navigator)) {
    const err = new Error("nousb");
    err.code = "nousb";
    throw err;
  }
  if (!window.isSecureContext) {
    const err = new Error("insecure");
    err.code = "insecure";
    throw err;
  }
  session.device = await navigator.usb.requestDevice({ filters: [{ vendorId: VID, productId: PID }] });
  session.needsReset = true;
  await session.device.open();
  await session.device.selectConfiguration(1);
  await session.device.claimInterface(0);
  session.needsReset = false;
  await init(transceive);
  ready = true;
}

async function recover() {
  try { await session.device.close(); } catch {}
  await session.device.open();
  await session.device.selectConfiguration(1);
  await session.device.claimInterface(0);
  await init(transceive);
  ready = true;
  session.needsReset = false;
}

async function watch() {
  const gen = ++watchGen;
  while (gen === watchGen) {
    try {
      if (!session.device) {
        session.device = (await navigator.usb.getDevices()).find((d) => d.vendorId === VID && d.productId === PID) || null;
        if (!session.device) {
          showAway();
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        session.needsReset = true;
      }
      if (session.needsReset) await recover();
      if (gen !== watchGen) return;
      const idm = await poll(transceive);
      if (gen !== watchGen) return;
      const id = hex(idm);
      if (id !== shownIdm || Date.now() - shownAt > 2500) {
        const card = await readPublic(transceive, idm);
        if (gen !== watchGen) return;
        const key = `${id}:${card.balance}:${card.history.length}:${card.history[0]?.date || ""}:${card.history[0]?.amount ?? ""}`;
        if (key !== shownKey) {
          view.render(card);
          shownKey = key;
        }
        shownIdm = id;
        shownAt = Date.now();
        view.showLive();
      }
    } catch (e) {
      if (gen !== watchGen) return;
      session.needsReset = true;
      if (session.device && !session.device.opened) session.device = null;
      showAway();
    }
    await new Promise((r) => setTimeout(r, view.mode === "live" ? 200 : 80));
  }
}

function fail(e) {
  view.fail(e, () => {
    ready = false;
  });
}

if ("usb" in navigator) {
  navigator.usb.addEventListener("disconnect", (ev) => {
    if (ev.device.vendorId !== VID || ev.device.productId !== PID) return;
    if (session.device && ev.device !== session.device) return;
    session.device = null;
    session.needsReset = true;
    showAway();
  });
}

async function onActivate() {
  if (busy) return;
  setBusy(true);
  try {
    view.setNote("Connecting the reader.");
    if (!session.device) await connect();
    else if (session.needsReset) await recover();
    begin();
  } catch (e) {
    session.needsReset = true;
    fail(e);
  } finally {
    setBusy(false);
  }
}

view.splashCard.addEventListener("click", onActivate);
view.splashGo.addEventListener("click", onActivate);

async function resume() {
  if (!("usb" in navigator)) {
    view.blockConnect("This browser has no WebUSB. Open it in Chrome or Edge.");
    return;
  }
  if (!window.isSecureContext) {
    view.setNote("WebUSB needs localhost or HTTPS.");
    return;
  }
  busy = true;
  try {
    const found = (await navigator.usb.getDevices()).find((d) => d.vendorId === VID && d.productId === PID);
    if (!found) return;
    session.device = found;
    await session.device.open();
    await session.device.selectConfiguration(1);
    await session.device.claimInterface(0);
    await init(transceive);
    ready = true;
    session.needsReset = false;
    begin();
  } catch (e) {
    session.needsReset = true;
    fail(e);
  } finally {
    setBusy(false);
  }
}

resume();
