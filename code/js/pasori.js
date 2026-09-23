export function checksum(data) {
  let sum = 0;
  for (const b of data) sum += b;
  return (0x100 - (sum & 0xff)) & 0xff;
}

export function buildFrame(data) {
  const n = data.length;
  const out = new Uint8Array(n + 7);
  out[2] = 0xff;
  out[3] = n;
  out[4] = (0x100 - n) & 0xff;
  out.set(data, 5);
  out[5 + n] = checksum(data);
  return out;
}

export function parseFrame(buf) {
  if (buf.length < 7 || buf[0] !== 0 || buf[1] !== 0 || buf[2] !== 0xff) throw new Error("trama");
  const n = buf[3];
  if (buf[4] !== ((0x100 - n) & 0xff) || buf.length < n + 7) throw new Error("trama");
  const data = buf.subarray(5, 5 + n);
  if (buf[5 + n] !== checksum(data) || buf[6 + n] !== 0) throw new Error("trama");
  return data;
}

function concat(chunks) {
  let n = 0;
  for (const c of chunks) n += c.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export function createTransport(session) {
  function readChunk(ms) {
    const pending = session.device.transferIn(1, 8);
    pending.catch(() => {});
    let timer;
    return Promise.race([
      pending.then((result) => {
        if (!result || result.status !== "ok" || !result.data) throw new Error("lectura");
        return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength).slice();
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          session.needsReset = true;
          reject(new Error("timeout"));
        }, ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }

  async function recvFrame(ms) {
    const chunks = [];
    const start = Date.now();
    while (Date.now() - start < ms) {
      chunks.push(await readChunk(ms - (Date.now() - start)));
      const buf = concat(chunks);
      if (buf.length >= 3 && (buf[0] !== 0 || buf[1] !== 0 || buf[2] !== 0xff)) throw new Error("trama");
      if (buf.length >= 5 && buf[2] === 0xff) {
        const n = buf[3];
        if (buf[4] !== ((0x100 - n) & 0xff)) throw new Error("trama");
        if (buf.length >= n + 7) return parseFrame(buf.subarray(0, n + 7));
      }
    }
    session.needsReset = true;
    throw new Error("timeout");
  }

  async function transceive(payload, ms) {
    const armed = readChunk(ms);
    try {
      const out = await session.device.controlTransferOut({
        requestType: "vendor",
        recipient: "device",
        request: 0,
        value: 0,
        index: 0,
      }, buildFrame(payload));
      if (out.status !== "ok") throw new Error("escritura");
      const ack = await armed;
      if (ack.length < 5 || ack[4] !== 0xff) throw new Error("ack");
      return await recvFrame(ms);
    } catch (e) {
      armed.catch(() => {});
      throw e;
    }
  }

  return { transceive };
}
