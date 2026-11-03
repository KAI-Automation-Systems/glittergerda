import sharp from "sharp";
import { GIFEncoder, applyPalette, quantize } from "gifenc";

const WIDTH = 480;
const HEIGHT = 480;
const FRAME_DELAY = 140;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapPhrase(phrase: string) {
  const words = phrase.trim().toUpperCase().split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const active = lines.length - 1;
    const candidate = (lines[active] + " " + word).trim();
    if (candidate.length <= 25 || lines[active] === "") {
      lines[active] = candidate;
    } else if (lines.length < 3) {
      lines.push(word);
    } else {
      lines[active] += " " + word;
    }
  }
  return lines.slice(0, 3);
}

function textOverlay(phrase: string) {
  const lines = wrapPhrase(phrase);
  const fontSize = lines.length === 1 ? 45 : lines.length === 2 ? 36 : 29;
  const startY = lines.length === 1 ? 399 : lines.length === 2 ? 378 : 360;
  const spacing = fontSize + 7;
  const tspans = lines
    .map((line, index) => {
      const y = startY + index * spacing;
      return '<text x="240" y="' + y + '">' + escapeXml(line) + "</text>";
    })
    .join("");
  return Buffer.from(
    '<svg width="480" height="480" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="14" y="326" width="452" height="142" rx="25" fill="#4b006dcc" stroke="#ffdd39" stroke-width="5"/>' +
      '<g text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="' +
      fontSize +
      '" font-weight="900" fill="#ff43b5" stroke="#190022" stroke-width="8" paint-order="stroke" stroke-linejoin="round">' +
      tspans +
      "</g>" +
      '<g text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="' +
      fontSize +
      '" font-weight="900" fill="#ff43b5" stroke="#fff3a0" stroke-width="2" paint-order="stroke" stroke-linejoin="round">' +
      tspans +
      "</g></svg>"
  );
}

function setPixel(frame: Uint8Array, x: number, y: number, color: [number, number, number, number]) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const offset = (y * WIDTH + x) * 4;
  frame[offset] = color[0];
  frame[offset + 1] = color[1];
  frame[offset + 2] = color[2];
  frame[offset + 3] = color[3];
}

function sparkle(frame: Uint8Array, cx: number, cy: number, radius: number) {
  const white: [number, number, number, number] = [255, 255, 255, 255];
  const gold: [number, number, number, number] = [255, 238, 130, 255];
  for (let delta = -radius; delta <= radius; delta++) {
    setPixel(frame, cx + delta, cy, delta === 0 ? gold : white);
    setPixel(frame, cx, cy + delta, delta === 0 ? gold : white);
  }
  for (let delta = -Math.floor(radius / 2); delta <= Math.floor(radius / 2); delta++) {
    setPixel(frame, cx + delta, cy + delta, white);
    setPixel(frame, cx + delta, cy - delta, white);
  }
}

const STAR_POSITIONS = [
  [[45, 54], [118, 138], [225, 72], [372, 58], [435, 154], [61, 275], [203, 343], [404, 391], [108, 442], [306, 424], [448, 320], [167, 238], [282, 172], [350, 280], [27, 380], [250, 454], [415, 88], [84, 205]],
  [[82, 78], [168, 48], [295, 92], [414, 106], [452, 226], [92, 318], [246, 274], [366, 349], [52, 428], [188, 407], [339, 452], [442, 419], [132, 185], [325, 221], [22, 150], [276, 52], [403, 286], [116, 383]],
  [[34, 116], [139, 73], [245, 112], [350, 45], [441, 84], [72, 222], [181, 292], [300, 320], [421, 265], [87, 397], [226, 446], [390, 430], [455, 365], [152, 348], [273, 205], [29, 305], [384, 171], [205, 46]],
  [[65, 40], [189, 98], [320, 65], [422, 178], [47, 187], [143, 251], [275, 255], [385, 304], [455, 292], [35, 350], [171, 425], [300, 390], [418, 457], [102, 362], [236, 152], [356, 118], [448, 56], [259, 456]],
] as const;

export async function createDemoBase(theme: string) {
  const palettes: Record<string, [string, string, string]> = {
    foutgoud: ["#ff2ba6", "#7724e8", "#ff8a00"],
    gerda: ["#ff157f", "#98186e", "#f5b400"],
    liefde: ["#c90e46", "#ff4ba8", "#6b1aaa"],
    feest: ["#00a7ff", "#ff2ba6", "#ffca28"],
    passief: ["#baff00", "#d8138a", "#17121f"],
    beesten: ["#00bfcf", "#7027ce", "#ff72c7"],
    bloemen: ["#ff6fae", "#8554c7", "#70c8ff"],
    ontspoord: ["#ff2b91", "#00b8ff", "#ffe229"],
  };
  const [a, b, c] = palettes[theme] ?? palettes.foutgoud;
  const svg =
    '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><radialGradient id="g"><stop stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>' +
    '<pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="22" r="15" fill="' + c + '" opacity=".55"/><circle cx="77" cy="68" r="26" fill="#111" opacity=".28"/></pattern></defs>' +
    '<rect width="1024" height="1024" fill="url(#g)"/><rect width="1024" height="1024" fill="url(#p)"/>' +
    '<circle cx="512" cy="410" r="260" fill="#2a003b" opacity=".7"/>' +
    '<path d="M512 120l45 160 160 45-160 45-45 160-45-160-160-45 160-45z" fill="#fff2a8"/>' +
    '<circle cx="512" cy="410" r="145" fill="' + c + '" opacity=".82"/></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function createGlitterGif(base: Buffer, phrase: string, chaos: number) {
  const composed = await sharp(base)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .composite([{ input: textOverlay(phrase), top: 0, left: 0 }])
    .ensureAlpha()
    .raw()
    .toBuffer();

  const amount = chaos === 1 ? 8 : chaos === 2 ? 12 : 18;
  const frames = STAR_POSITIONS.map((positions, frameIndex) => {
    const frame = new Uint8Array(composed);
    positions.slice(0, amount).forEach(([x, y], index) => {
      sparkle(frame, x, y, 3 + ((index + frameIndex) % 4));
    });
    return frame;
  });

  const sample = new Uint8Array(frames[0].length * frames.length);
  frames.forEach((frame, index) => sample.set(frame, index * frame.length));
  const palette = quantize(sample, 128);
  const gif = GIFEncoder();

  frames.forEach((frame, index) => {
    const indexed = applyPalette(frame, palette);
    gif.writeFrame(indexed, WIDTH, HEIGHT, {
      palette,
      delay: FRAME_DELAY,
      repeat: index === 0 ? 0 : undefined,
      dispose: 1,
    });
  });

  gif.finish();
  return Buffer.from(gif.bytes());
}
