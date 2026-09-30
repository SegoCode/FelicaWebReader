const INIT = [
  [0x62, 0x01, 0x82],
  [0x62, 0x02, 0x80, 0x81],
  [0x62, 0x22, 0x80, 0xcc, 0x81, 0x88],
  [0x62, 0x02, 0x80, 0x81],
  [0x62, 0x02, 0x82, 0x87],
  [0x62, 0x21, 0x25, 0x58],
  [0x5a, 0x80],
];

export async function init(transceive) {
  for (const cmd of INIT) await transceive(cmd, 500);
}

async function felica(transceive, cmd, ms) {
  const r = await transceive([0x5c, cmd.length + 1, ...cmd], ms);
  if (r[0] !== 0x5d) throw new Error("trama");
  return r.slice(2, 2 + r[1]);
}

export async function poll(transceive) {
  const payload = await felica(transceive, [0x00, 0x00, 0x03, 0x00, 0x00], 600);
  if (payload.length < 17 || payload[0] !== 0x01) {
    const err = new Error("nocard");
    err.code = "nocard";
    throw err;
  }
  return payload.slice(1, 9);
}

async function readBlocks(transceive, idm, service, from, count) {
  const list = [];
  for (let i = 0; i < count; i++) list.push(0x80, from + i);
  const p = await felica(transceive, [0x06, ...idm, 1, service & 0xff, service >> 8, count, ...list], 1200);
  if (p[0] !== 0x07 || p[9] !== 0 || p[10] !== 0) throw new Error("lectura");
  const out = [];
  for (let i = 0; i < p[11]; i++) out.push(p.slice(12 + i * 16, 28 + i * 16));
  return out;
}

function parseDate(b0, b1) {
  const x = (b0 << 8) | b1;
  if (!x) return null;
  const year = (x >> 9) + 2000;
  const month = (x >> 5) & 0xf;
  const day = x & 0x1f;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTime(b0, b1) {
  const x = (b0 << 8) | b1;
  const h = (x >> 11) & 31;
  const m = (x >> 5) & 63;
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function kindFor(term, proc) {
  if (proc === 0x02 || term === 0x07 || term === 0x08) return "topup";
  if (proc === 0x46 || term === 0x12 || term === 0xc7 || term === 0xc8) return "purchase";
  if (proc === 0x0d || proc === 0x0f || proc === 0x1f || proc === 0x23 || term === 0x05) return "bus";
  if (proc === 0x14) return "office";
  if (proc === 0x15) return "adjust";
  if (proc === 0x03) return "ticket";
  if (proc === 0x01 || term === 0x16 || term === 0x18) return "train";
  return "trip";
}

export function parseTrips(blocks) {
  const rows = [];
  for (const block of blocks) {
    if ([...block].every((x) => x === 0)) continue;
    const date = parseDate(block[4], block[5]);
    if (!date) continue;
    const kind = kindFor(block[0], block[1]);
    rows.push({
      kind,
      date,
      time: kind === "purchase" ? parseTime(block[6], block[7]) : null,
      credit: kind === "topup",
      balance: block[10] | (block[11] << 8),
    });
  }
  for (let i = 0; i < rows.length; i++) {
    const older = rows[i + 1];
    rows[i].amount = older ? Math.abs(older.balance - rows[i].balance) : null;
  }
  return rows;
}

export function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export async function readPublic(transceive, idm) {
  let balance = null;
  try {
    const [blk] = await readBlocks(transceive, idm, 0x008b, 0, 1);
    if (blk && ![...blk].every((x) => x === 0)) balance = blk[11] | (blk[12] << 8);
  } catch {}
  let raw = [];
  try { raw = raw.concat(await readBlocks(transceive, idm, 0x090f, 0, 12)); } catch {}
  try { raw = raw.concat(await readBlocks(transceive, idm, 0x090f, 12, 8)); } catch {}
  const historyRows = parseTrips(raw);
  if (historyRows[0]?.balance != null) balance = historyRows[0].balance;
  return { idm, balance, history: historyRows };
}
