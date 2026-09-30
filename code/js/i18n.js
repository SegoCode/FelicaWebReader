const STRINGS = {
  en: {
    language: "Language",
    connect: "Connect reader",
    hint: "Tap the card or press the button. The browser asks permission for the reader.",
    connecting: "Connecting the reader.",
    place: "Place the card.",
    balance: "Balance",
    history: "History",
    empty: "No trips.",
    nousb: "This browser has no WebUSB. Open it in Chrome or Edge.",
    insecure: "WebUSB needs localhost or HTTPS.",
    unselected: "No reader was selected. Press Connect reader.",
    inuse: "The reader is in use. Close the other program and press again.",
    timeout: "The reader did not respond. Plug it back in and press Connect reader.",
    failed: "Could not read. Press Connect reader.",
    topup: "Top up",
    purchase: "Purchase",
    bus: "Bus",
    office: "Ticket office",
    adjust: "Adjustment",
    ticket: "Ticket",
    train: "Train",
    trip: "Trip",
    shinjuku: "Shinjuku",
    shibuya: "Shibuya",
  },
  ja: {
    language: "言語",
    connect: "リーダーを接続",
    hint: "カードをタップするか、ボタンを押してください。ブラウザーがリーダーの使用許可を求めます。",
    connecting: "リーダーに接続しています。",
    place: "カードをリーダーに置いてください。",
    balance: "残高",
    history: "利用履歴",
    empty: "利用履歴はありません。",
    nousb: "このブラウザーは WebUSB に対応していません。Chrome または Edge で開いてください。",
    insecure: "WebUSB には localhost または HTTPS が必要です。",
    unselected: "リーダーが選択されていません。「リーダーを接続」を押してください。",
    inuse: "リーダーは別のアプリで使用中です。そのアプリを閉じて、もう一度押してください。",
    timeout: "リーダーが応答しません。接続し直して「リーダーを接続」を押してください。",
    failed: "読み取れませんでした。「リーダーを接続」を押してください。",
    topup: "チャージ",
    purchase: "物販",
    bus: "バス",
    office: "窓口",
    adjust: "精算",
    ticket: "きっぷ購入",
    train: "乗車",
    trip: "利用",
    shinjuku: "新宿",
    shibuya: "渋谷",
  },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function saved() {
  try { return localStorage.getItem("lang"); } catch { return null; }
}

function preferred() {
  const first = (navigator.languages || [navigator.language]).find((l) => /^(en|ja)\b/i.test(l)) || "";
  return /^ja/i.test(first) ? "ja" : "en";
}

let lang = STRINGS[saved()] ? saved() : preferred();

export function t(key) {
  return STRINGS[lang][key];
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return lang === "ja" ? `${y}年${m}月${d}日` : `${d} ${MONTHS[m - 1]} ${y}`;
}

function apply() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll("[data-date]")) el.textContent = formatDate(el.dataset.date);
  for (const el of document.querySelectorAll("[data-lang]")) el.setAttribute("aria-pressed", String(el.dataset.lang === lang));
}

for (const el of document.querySelectorAll("[data-lang]")) {
  el.addEventListener("click", () => {
    lang = el.dataset.lang;
    try { localStorage.setItem("lang", lang); } catch {}
    apply();
  });
}

apply();
