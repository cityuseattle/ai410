// Anatomy of a RAG pipeline, for AI 410 Module 2 (Lecture Part 3). Writes the figure into
// module-2/index.html between its <!-- anatomy:rag-pipeline --> markers.
//
// A card-file bench. Ingest (once): five Northwind documents in a tray are cut into chunk cards,
// each card is stamped by the embedding press (set to DOC) and filed in the card file (Chroma).
// Every question: the question card is stamped by the same press (set to QUERY), every filed card
// rises by its cosine score, the top k stay up, and those chunks go onto the prompt board with the
// system sheet and the question, which the model reads to write its answer.
//
// The documents, chunker and scores are the Module 2 simulator's own (model.mjs), at the
// simulator's first tour settings: chunk size 30 words, overlap 5, so 15 chunks.
import { k, EXPAND_BUTTON, embedHtml, partsHtml, inject, preview } from "../embed.mjs";
import { ingest, vec, cos, fingerprint } from "./model.mjs";

// ---------- the model ----------
const CHUNK = 30, OVERLAP = 5, K0 = 3;
const { store, titles } = ingest(CHUNK, OVERLAP);
const N = store.length; // 15
const SHORT = ["Returns", "Shipping", "Warranty", "Tents", "Packs"];
const LETTER = ["R", "S", "W", "T", "P"];
const QUESTIONS = [
  { q: "Do Canadian orders pay customs fees?", lines: ["DO CANADIAN ORDERS", "PAY CUSTOMS FEES?"], fact: "customs fees", re: "customs fees" },
  { q: "How much is expedited shipping?", lines: ["HOW MUCH IS", "EXPEDITED SHIPPING?"], fact: "$15", re: "\\$15" },
  { q: "How long do I have to return an item?", lines: ["HOW LONG DO I HAVE", "TO RETURN AN ITEM?"], fact: "30 days", re: "30 days" },
].map((Q) => {
  const v = vec(Q.q);
  const scores = store.map((c) => cos(v, c.v));
  const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(([, i]) => i);
  const has = store.map((c) => new RegExp(Q.re, "i").test(c.text));
  return { ...Q, scores: scores.map((s) => +s.toFixed(4)), order, has, fp: fingerprint(v) };
});
const PRINTS = store.map((c) => fingerprint(c.v));
const perDoc = titles.map((_, di) => store.filter((c) => c.di === di).length);

// ---------- world ----------
const W = 640, H = 420;
const PLATE = { x: -150, y: -102, w: 292, d: 184, r: 9 };
const PLATE_H = 9, FOOT_H = 5;
const box = (cx, cy, w, d, r = 0.8) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });

// card file (vector store), back right
const PITCH = 8;
const FILE = { x: 4, y: -92, w: N * PITCH + 10, d: 34, r: 2 };
const FLOOR_H = 3;
const CARD = { y: -87, d: 24, w: 1.6, h: 15 };
const TOOTH_MAX = 3.2;
const cardX = (i) => FILE.x + 9 + i * PITCH;
const RISE = 46; // card travel for a score of 1
const PANEL = { x: FILE.x, y: FILE.y - 5, w: FILE.w, d: 5, r: 1 };
const PANEL_H = FLOOR_H + CARD.h + TOOTH_MAX + RISE * 0.62 + 7;
const LIP = { x: FILE.x, y: FILE.y + FILE.d - 4, w: FILE.w, d: 4, r: 0.8 };
const LIP_H = 9;

// document tray, back left
const TRAY = { x: -142, y: -94, w: 50, d: 40, r: 2 };
const SHEET = { w: 38, d: 28 };
// cutter, between the tray and the press
const CUT = { x: -86, y: -94, w: 32, d: 40, r: 2 };
const CUT_H = 4;
const BLADE_Z = [16, 6.2]; // blade bar bottom: raised, cutting
// embedding press, middle
const PRESS = { x: -46, y: -60, w: 38, d: 42, r: 2 };
const BED_H = 6;
const LANE_Y = -28; // the groove between the ingest lane and the question lane
const COLS = [[PRESS.x + 5, PRESS.y + 6], [PRESS.x + PRESS.w - 5, PRESS.y + 6]];
const CROWN = { x: PRESS.x + 1, y: PRESS.y + 1, w: PRESS.w - 2, d: 11, r: 1.2 };
const CROWN_Z = 44, CROWN_H = 6;
const RAM = box(PRESS.x + PRESS.w / 2, PRESS.y + 21, 20, 16, 1);
const RAM_Z = [22, BED_H + 2.4]; // ram bottom: up, stamping
const RAM_H = 9;
const PRESS_SPOT = [PRESS.x + PRESS.w / 2, PRESS.y + 21, BED_H]; // where a card sits to be stamped
// question holder, front left
const QH = { x: -142, y: 6, w: 64, d: 32, r: 2 };
const QCARD = { w: 52, d: 20, h: 1.2 };
const Q_HOME = [QH.x + QH.w / 2, QH.y + QH.d / 2, 3];
// top-k knob, front middle
const KNOB = [-48, 56], KNOB_R = 8, DIAL_R = 14, KNOB_Z = [4, 10];
const KSPAN = (Math.PI * 4) / 3;
const knobAngle = (i) => -Math.PI / 2 - KSPAN / 2 + (KSPAN * i) / 4 + Math.PI / 4; // i = k - 1
// prompt board, front centre
const BOARD = { x: -18, y: -2, w: 58, d: 74, r: 2.5 };
const BOARD_H = 2.4;
const SLIP = { w: 46, d: 6.4, h: 0.8 };
const slipY = (n) => BOARD.y + 26 + n * 7.6;
const SYS = { x: BOARD.x + 6, y: BOARD.y + 10, w: 46, d: 12, r: 0.8 };
const Q_BOARD = [BOARD.x + BOARD.w / 2, BOARD.y + BOARD.d - 9, BOARD_H + 0.8];
// the model, front right
const MODEL = { x: 54, y: -14, w: 46, d: 60, r: 3 };
const MODEL_H = 22;
const ANS = { x: MODEL.x + 7, y: MODEL.y + MODEL.d - 26, w: 32, d: 24, r: 0.8 };
const ANS_OUT = 22; // how far the answer slides out of the front slot

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PANEL.x, PANEL.y, PANEL_H], [PANEL.x + PANEL.w, PANEL.y, PANEL_H], [PRESS.x, PRESS.y, CROWN_Z + CROWN_H + 3], [PRESS.x + PRESS.w, PRESS.y, CROWN_Z + CROWN_H + 3]],
  W, H, { pad: 16, azimuth: 46 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(...a) - depth(...b));
const screws = (list, z, size = 0.45) => Dt(list.map(([x, y]) => at([x, y, z])), { size });
const pinned = (from, to, z, tone = "faint") => L(k.lineOnTop(from, to, z, P), { tone }) + screws([from, to], z, 0.4);
const topText = (x, y, z, text, size, tone = "mid", anchor = "start", extra = "") => k.faceTextSvg(k.topMatrix([x, y], z, P, "x"), text, { size, tone, anchor }).replace("<text", `<text${extra}`);

// ---------- bench plate ----------
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const corners = k.corners(PLATE, 11);
  out.push(L(corners.map(([x, y]) => k.ring(x, y, 2.3, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(corners.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // a groove that splits the bench into its two lanes: ingest (back) and every question (front)
  // (from the plate's inset groove to the press's side: the press serves both lanes)
  out.push(L(k.lineOnTop([PLATE.x + 5, LANE_Y], [PRESS.x, LANE_Y], 0, P), { tone: "faint" }));
  out.push(topText(PLATE.x + 9, LANE_Y - 3.5, 0, "ingest.py · ONCE", 2.8, "lo"));
  out.push(topText(PLATE.x + 9, LANE_Y + 6.5, 0, "EVERY QUESTION", 2.8, "lo"));
  // label plate, front left
  const label = { x: -128, y: 62, w: 52, d: 16, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(topText(label.x + 5, label.y + 7, 0.8, "NORTHWIND · RAG", 3, "mid"));
  out.push(L([[10.5, 34], [12.8, 20]].map(([dy, len]) => k.lineOnTop([label.x + 5, label.y + dy], [label.x + 5 + len, label.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(screws([[label.x + 2.6, label.y + 2.6], [label.x + label.w - 2.6, label.y + label.d - 2.6]], 0.8, 0.4));
  return out.join("");
}

// ---------- document tray ----------
function tray() {
  const out = [S(k.slabOf(TRAY, 0, 2, P, 4, 0.4), { tone: "mid" })];
  // rails: back and left walls behind the stack
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 2.4, r: 0.6 }, 2, 6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y + 2.4, w: 2.4, d: TRAY.d - 2.4, r: 0.6 }, 2, 6, P, 2), { tone: "mid" }));
  const cx = TRAY.x + TRAY.w / 2 + 1, cy = TRAY.y + TRAY.d / 2 + 1;
  for (let i = 0; i < titles.length; i++) {
    const plan = box(cx + (i % 2 ? 0.8 : -0.4), cy + (i % 2 ? -0.5 : 0.4), SHEET.w, SHEET.d, 0.5);
    const z = 2 + i * 1.1;
    let inner = "";
    if (i === titles.length - 1) {
      inner = topText(plan.x + 4, plan.y + 6, z + 0.9, `${titles.length} DOCUMENTS`, 2.8, "mid") +
        L([9.5, 12.5, 15.5, 18.5].map((dy, j) => k.lineOnTop([plan.x + 4, plan.y + dy], [plan.x + 4 + [28, 24, 30, 18][j], plan.y + dy], z + 0.9, P)).join(""), { tone: "faint", free: true });
    }
    out.push(`<g data-sheet="${i}">${S(k.slabOf(plan, z, 0.9, P, 2), { tone: "hi", crease: "none", inner })}</g>`);
  }
  out.push(screws([[TRAY.x + TRAY.w - 2.5, TRAY.y + TRAY.d - 2.5], [TRAY.x + 4.5, TRAY.y + TRAY.d - 2.5]], 2, 0.4));
  return out.join("");
}

// ---------- cutter ----------
function cutter() {
  const out = [S(k.slabOf(CUT, 0, CUT_H, P, 4, 0.5), { tone: "mid", inner: L(k.sideSeam(CUT, 1.6, P, 4), { tone: "faint" }) })];
  // a word ruler along y: one major tick per 30-word chunk, minor every 5 words
  const rx = CUT.x + 4;
  const ticks = k.topTicks(CUT.y + 5, CUT.y + CUT.d - 5, (CUT.d - 10) / 18, 6, rx, CUT_H, [1.6, 3], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([rx, CUT.y + 5], [rx, CUT.y + CUT.d - 5], CUT_H, P), { tone: "faint" }) + screws([[rx, CUT.y + 5], [rx, CUT.y + CUT.d - 5]], CUT_H, 0.4));
  // engraved along y, in the strip the press never hides: the function and its two settings
  const alongY = (x, y, text, size, tone) => k.faceTextSvg(k.topMatrix([x, y], CUT_H, P, "y"), text, { size, tone });
  out.push(alongY(CUT.x + 12.4, CUT.y + CUT.d - 2, "chunk_text()", 2.2, "mid"));
  out.push(alongY(CUT.x + 15.8, CUT.y + CUT.d - 2, "30 W · 5 LAP", 2, "lo"));
  // the cut slot the blade drops into
  const slotY = CUT.y + 20;
  out.push(L(k.planOutline({ x: CUT.x + 7, y: slotY - 0.8, w: CUT.w - 9, d: 1.6, r: 0.4 }, CUT_H, P, 2), { tone: "lo" }));
  // chunk stack on the out side: grows to 15 thin slips while chunking
  out.push(`<g data-chunks>${Array.from({ length: N }, (_, i) => `<g data-chunk="${i}">${S(k.slabOf(box(CUT.x + 19, CUT.y + 30, 18, 7, 0.4), CUT_H + i * 0.9, 0.8, P, 1), { tone: "hi", crease: "none" })}</g>`).join("")}</g>`);
  return out.join("");
}
function bladePosts() {
  const slotY = CUT.y + 20;
  return [[CUT.x + 4, slotY], [CUT.x + CUT.w - 1.5, slotY]].map(([x, y]) => S(k.cylinder(x, y, 1.5, CUT_H, BLADE_Z[0] + 5 - CUT_H, P, 14), { tone: "mid" }) + Dt([at([x, y, BLADE_Z[0] + 5])], { size: 0.4 })).join("");
}
function blade() {
  const slotY = CUT.y + 20;
  const bar = { x: CUT.x + 5.6, y: slotY - 2, w: CUT.w - 8.6, d: 4, r: 0.6 };
  const out = [S(k.slabOf({ x: bar.x + 1, y: slotY - 0.5, w: bar.w - 2, d: 1, r: 0.2 }, BLADE_Z[0] - 2.2, 2.4, P, 1), { tone: "hi" })];
  out.push(S(k.slabOf(bar, BLADE_Z[0], 4, P, 2, 0.4), { tone: "mid" }));
  out.push(pinned([bar.x + 2.5, slotY], [bar.x + bar.w - 2.5, slotY], BLADE_Z[0] + 4, "lo"));
  return out.join("");
}

// ---------- embedding press ----------
function pressBed() {
  const out = [S(k.slabOf(PRESS, 0, BED_H, P, 4), { tone: "mid", inner: L(k.sideSeam(PRESS, 2.2, P, 4), { tone: "faint" }) })];
  // anvil plate under the ram, with eight punch seats
  const anvil = box(PRESS_SPOT[0], PRESS_SPOT[1], 22, 18, 0.8);
  out.push(L(k.planOutline(anvil, BED_H, P, 3), { tone: "lo" }));
  out.push(Dt(Array.from({ length: 8 }, (_, j) => at([anvil.x + 3 + j * 2.3, anvil.y + 3, BED_H])), { size: 0.35, tone: "lo" }));
  // mode selector, front of the bed: DOC | QUERY with a sliding lever
  const sel = { x: PRESS.x + 6, y: PRESS.y + PRESS.d - 8, w: PRESS.w - 12, d: 5, r: 0.8 };
  out.push(L(k.planOutline(sel, BED_H, P, 3), { tone: "lo" }));
  out.push(L(k.lineOnTop([sel.x + 3, sel.y + sel.d / 2], [sel.x + sel.w - 3, sel.y + sel.d / 2], BED_H, P), { tone: "faint" }) + screws([[sel.x + 3, sel.y + sel.d / 2], [sel.x + sel.w - 3, sel.y + sel.d / 2]], BED_H, 0.35));
  out.push(topText(sel.x + 0.5, sel.y + sel.d + 3.4, BED_H, "DOC", 2.5, "mid", "start", " data-mode-doc"));
  out.push(topText(sel.x + sel.w - 0.5, sel.y + sel.d + 3.4, BED_H, "QUERY", 2.5, "lo", "end", " data-mode-query"));
  out.push(screws(k.corners(PRESS, 2.6), BED_H, 0.45));
  return out.join("");
}
const SEL_X = [PRESS.x + 9.5, PRESS.x + PRESS.w - 9.5];
function lever() {
  const y = PRESS.y + PRESS.d - 5.5;
  return S(k.slabOf(box(SEL_X[0], y, 4, 3.4, 0.6), BED_H, 2.6, P, 2, 0.3), { tone: "hi" }) + Dt([at([SEL_X[0], y, BED_H + 2.6])], { size: 0.4 });
}
function pressFrame() {
  const out = [];
  for (const [x, y] of byDepth(COLS)) {
    out.push(S(k.cylinder(x, y, 3, BED_H, 2, P, 20), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 2.1, BED_H + 2, CROWN_Z - BED_H - 2, P, 20), { tone: "mid" }));
  }
  out.push(S(k.slabOf(CROWN, CROWN_Z, CROWN_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(CROWN, CROWN_Z + 2, P, 3), { tone: "faint" }) }));
  for (const [x, y] of COLS) out.push(S(k.cylinder(x, y, 2.6, CROWN_Z + CROWN_H, 1.6, P, 6), { tone: "mid" }), Dt([at([x, y, CROWN_Z + CROWN_H + 1.6])], { size: 0.45 }));
  out.push(topText(CROWN.x + 6.5, CROWN.y + 7, CROWN_Z + CROWN_H, "embed_content()", 2.1, "mid"));
  out.push(L(k.lineOnTop([CROWN.x + 4, CROWN.y + 8.8], [CROWN.x + 18, CROWN.y + 8.8], CROWN_Z + CROWN_H, P), { tone: "faint", free: true }));
  // the screw that drives the ram, from the crown down to the ram's top
  out.push(`<g data-screw>${screwSvg(RAM_Z[0] + RAM_H)}</g>`);
  return out.join("");
}
const screwSvg = (top) => S(k.cylinder(RAM.x + RAM.w / 2, RAM.y + RAM.d / 2, 1.6, top, CROWN_Z - top, P, 14), { tone: "mid" });
// the ram, drawn at rest (moved down in the page to stamp)
function ram() {
  const out = [];
  const pins = Array.from({ length: 8 }, (_, j) => [RAM.x + 3 + j * 2.0, RAM.y + RAM.d / 2]);
  for (const [x, y] of pins) out.push(S(k.cylinder(x, y, 0.6, RAM_Z[0] - 2.2, 2.4, P, 8), { tone: "mid" }));
  out.push(S(k.slabOf(RAM, RAM_Z[0], RAM_H, P, 3), { tone: "mid", inner: L(k.sideSeam(RAM, RAM_Z[0] + 3, P, 3), { tone: "faint" }) }));
  out.push(L(k.ring(RAM.x + RAM.w / 2, RAM.y + RAM.d / 2, 3, RAM_Z[0] + RAM_H, P, 18), { tone: "lo" }));
  out.push(screws([[RAM.x + 2, RAM.y + 2], [RAM.x + RAM.w - 2, RAM.y + 2], [RAM.x + RAM.w - 2, RAM.y + RAM.d - 2], [RAM.x + 2, RAM.y + RAM.d - 2]], RAM_Z[0] + RAM_H, 0.4));
  return out.join("");
}

// ---------- card file (vector store) ----------
function panel() {
  const out = [S(k.slabOf(PANEL, 0, PANEL_H, P, 3, 0.5), { tone: "mid" })];
  // a score rule on the panel face: 0 where a card rests, 1.0 at full travel (only the top of it shows)
  const face = PANEL.y + PANEL.d;
  const z0 = FLOOR_H + CARD.h + TOOTH_MAX;
  const tick = (z, len) => k.pathOf([at([PANEL.x + 1.5, face, z]), at([PANEL.x + 1.5 + len, face, z])]);
  let minor = "", major = "";
  for (let i = 0; i <= 12; i++) {
    const z = z0 + (RISE * i) / 20;
    if (z > PANEL_H - 2) break;
    i % 5 ? (minor += tick(z, 2.2)) : (major += tick(z, 4));
  }
  out.push(L(minor, { tone: "lo", free: "end" }), L(major, { tone: "mid", free: "end" }));
  for (const [z, text] of [[z0, "0"], [z0 + RISE / 4, ".25"], [z0 + RISE / 2, ".5"]]) out.push(k.faceTextSvg(k.sideMatrix([PANEL.x + 6.5, face], z - 1.1, P, "left"), text, { size: 2.6, tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([PANEL.x + PANEL.w - 4, face], PANEL_H - 5, P, "left"), "COSINE", { size: 2.6, tone: "lo", anchor: "end" }));
  out.push(Dt([[PANEL.x + 3, PANEL_H - 3], [PANEL.x + PANEL.w - 3, PANEL_H - 3], [PANEL.x + PANEL.w - 3, 3], [PANEL.x + 3, 3]].map(([x, z]) => at([x, face, z])), { size: 0.45 }));
  return out.join("");
}
function trough() {
  const out = [S(k.slabOf(FILE, 0, FLOOR_H, P, 4, 0.5), { tone: "mid" })];
  // a slot in the floor under each card, for its lifter
  out.push(L(Array.from({ length: N }, (_, i) => k.planOutline({ x: cardX(i) - 1.2, y: CARD.y + 1, w: 2.4, d: CARD.d - 2, r: 0.5 }, FLOOR_H, P, 2)).join(""), { tone: "faint" }));
  // end walls
  for (const x of [FILE.x, FILE.x + FILE.w - 2]) out.push(S(k.slabOf({ x, y: FILE.y, w: 2, d: FILE.d - 4, r: 0.4 }, FLOOR_H, 10, P, 2), { tone: "mid" }));
  return out.join("");
}
const lifterSvg = (i, rise) => S(k.slabOf(box(cardX(i), CARD.y + CARD.d / 2, 1.1, 3, 0.3), FLOOR_H - 0.4, Math.max(0.6, rise) + 0.4, P, 1), { tone: "mid" });
function card(i) {
  const plan = { x: cardX(i) - CARD.w / 2, y: CARD.y, w: CARD.w, d: CARD.d, r: 0.25 };
  const top = FLOOR_H + CARD.h;
  const out = [];
  // the body, with its doc letter and chunk number on its face
  const label = k.faceTextSvg(k.sideMatrix([plan.x + plan.w, CARD.y + CARD.d - 2], top - 4, P, "right"), `${LETTER[store[i].di]}${store.filter((c, j) => j <= i && c.di === store[i].di).length}`, { size: 2.6, tone: "mid" });
  out.push(S(k.slabOf(plan, FLOOR_H, CARD.h, P, 1), { tone: "hi", inner: label }));
  // teeth: the stamped fingerprint, eight along the top edge (hidden until the press stamps)
  const teeth = PRINTS[i].map((v, j) => [j, v]).sort((a, b) => depth(cardX(i), CARD.y + a[0] * 3) - depth(cardX(i), CARD.y + b[0] * 3));
  out.push(`<g data-teeth>${teeth.map(([j, v]) => S(k.slabOf({ x: plan.x, y: CARD.y + 0.6 + j * 2.9, w: CARD.w, d: 2.3, r: 0.15 }, top, 0.5 + v * (TOOTH_MAX - 0.5), P, 1), { tone: "hi" })).join("")}</g>`);
  return out.join("");
}
function lip() {
  const out = [S(k.slabOf(LIP, 0, LIP_H, P, 2, 0.4), { tone: "mid" })];
  const face = LIP.y + LIP.d;
  // a short groove under each card's slot, and the source document's letter
  for (let i = 0; i < N; i++) out.push(k.faceTextSvg(k.sideMatrix([cardX(i) - 1, face], 6.2, P, "left"), LETTER[store[i].di], { size: 2.6, tone: store[i].di % 2 ? "lo" : "mid" }));
  out.push(L(k.sideSeam(LIP, 2, P, 2), { tone: "faint" }));
  out.push(Dt([at([LIP.x + 2.5, face, LIP_H - 2]), at([LIP.x + LIP.w - 2.5, face, LIP_H - 2])], { size: 0.45 }));
  out.push(topText(LIP.x + LIP.w - 3, LIP.y + 3, LIP_H, "CHROMA · documents", 2.6, "lo", "end"));
  return out.join("");
}

// ---------- question holder ----------
function holder() {
  const out = [S(k.slabOf(QH, 0, 3, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(QH, 3), 3, P, 3), { tone: "faint" }));
  out.push(S(k.slabOf({ x: QH.x, y: QH.y, w: QH.w, d: 2.4, r: 0.6 }, 3, 3, P, 2), { tone: "mid" }));
  out.push(screws([[QH.x + 2.5, QH.y + QH.d - 2.5], [QH.x + QH.w - 2.5, QH.y + QH.d - 2.5]], 3, 0.4));
  out.push(topText(QH.x + 4, QH.y + QH.d - 1.6, 3, "USER QUESTION", 2.2, "lo"));
  return out.join("");
}
// the question card, drawn at its home (moved in the page)
function qcard() {
  const [cx, cy, z] = Q_HOME;
  const plan = box(cx, cy, QCARD.w, QCARD.d, 0.8);
  const top = z + QCARD.h;
  const lines = QUESTIONS[0].lines.map((t, n) => topText(plan.x + 4, plan.y + 7 + n * 4.6, top, t, 2.7, "hi", "start", ` data-qline="${n}"`)).join("");
  const print = `<g data-qprint>${L(QUESTIONS[0].fp.map((v, j) => k.lineOnTop([plan.x + 4 + j * 2.4, plan.y + 17.5], [plan.x + 4 + j * 2.4, plan.y + 17.5 - 0.6 - v * 3], top, P)).join(""), { tone: "hi", free: true })}</g>`;
  return S(k.slabOf(plan, z, QCARD.h, P, 3, 0.3), { tone: "hi", inner: L(k.planOutline(k.insetPlan(plan, 1.4), top, P, 3), { tone: "faint" }) + lines + print });
}

// ---------- top-k knob ----------
function knob() {
  const [cx, cy] = KNOB;
  const out = [S(k.cylinder(cx, cy, DIAL_R + 2, 0, 1.4, P, 40), { tone: "mid" })];
  out.push(L(k.ring(cx, cy, DIAL_R, 1.4, P, 40), { tone: "faint" }));
  const ticks = [0, 1, 2, 3, 4].map((i) => {
    const a = knobAngle(i), r0 = KNOB_R + 1.6, r1 = DIAL_R - (i === K0 - 1 ? 0 : 1);
    return k.lineOnTop([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], 1.4, P);
  });
  out.push(L(ticks.join(""), { tone: "mid", free: "both" }));
  out.push(S(k.cylinder(cx, cy, KNOB_R, KNOB_Z[0] - 2.6, 2.6, P, 36), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, KNOB_R - 1, KNOB_Z[0], KNOB_Z[1] - KNOB_Z[0], P, 36), { tone: "hi" }));
  out.push(L(k.knurl(cx, cy, KNOB_R - 1, KNOB_Z[0], KNOB_Z[1], 30, P), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, KNOB_R - 3.4, KNOB_Z[1], P, 30), { tone: "faint" }));
  out.push(`<path class="iso-line" data-tone="hi" data-knob data-free="both" d="${knobPointer(knobAngle(K0 - 1))}" style="stroke-width:1.1"/>`);
  out.push(Dt([at([cx, cy, KNOB_Z[1]])], { size: 0.55, tone: "hi" }));
  out.push(topText(cx - DIAL_R - 6, cy + DIAL_R - 2, 0, "TOP-K", 3, "mid", "middle"));
  out.push(topText(cx - DIAL_R + 1, cy + DIAL_R + 3.4, 0, "retrieve(k)", 2.3, "lo", "middle"));
  return out.join("");
}
function knobPointer(a) {
  const [cx, cy] = KNOB;
  return k.lineOnTop([cx + Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4], [cx + Math.cos(a) * (KNOB_R - 2), cy + Math.sin(a) * (KNOB_R - 2)], KNOB_Z[1], P);
}

// ---------- prompt board ----------
function board() {
  const out = [S(k.slabOf(BOARD, 0, BOARD_H, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(BOARD, 2.4), BOARD_H, P, 3), { tone: "faint" }));
  // the clip at the back edge: a hinge rod and a bar
  const hy = BOARD.y + 4;
  out.push(S(k.slabOf({ x: BOARD.x + 12, y: hy - 2.5, w: BOARD.w - 24, d: 5, r: 1 }, BOARD_H, 2.6, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([BOARD.x + 14, hy], [BOARD.x + BOARD.w - 14, hy], BOARD_H + 2.6, P), { tone: "lo" }) + screws([[BOARD.x + 14, hy], [BOARD.x + BOARD.w - 14, hy]], BOARD_H + 2.6, 0.4));
  // the system sheet, always on the board
  out.push(S(k.slabOf(SYS, BOARD_H, 0.8, P, 2), { tone: "hi", crease: "none", inner: topText(SYS.x + 3, SYS.y + 4.6, BOARD_H + 0.8, "system_instruction", 2.3, "mid") + topText(SYS.x + 3, SYS.y + 8.6, BOARD_H + 0.8, "USE CONTEXT · TOOLS OK", 2.3, "mid") }));
  // empty slip seats, one per k
  out.push(L([0, 1, 2, 3, 4].map((n) => k.planOutline(box(BOARD.x + BOARD.w / 2, slipY(n), SLIP.w, SLIP.d, 0.5), BOARD_H, P, 2)).join(""), { tone: "faint", dashed: true }));
  out.push(topText(BOARD.x + 4, BOARD.y + BOARD.d - 2, BOARD_H, "PROMPT", 2.4, "lo"));
  return out.join("");
}
// a retrieved-chunk slip on the board (text set in the page)
function slip(n) {
  const plan = box(BOARD.x + BOARD.w / 2, slipY(n), SLIP.w, SLIP.d, 0.5);
  const z = BOARD_H, top = z + SLIP.h;
  return S(k.slabOf(plan, z, SLIP.h, P, 2), { tone: "hi", crease: "none", inner: topText(plan.x + 2.5, plan.y + 4.4, top, "", 2.4, "hi", "start", ` data-sliptext="${n}"`) });
}

// ---------- the model ----------
function model() {
  const out = [S(k.slabOf(MODEL, 0, MODEL_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(MODEL, MODEL_H - 4, P, 5), { tone: "faint" }) })];
  // vents on the top
  const vx = MODEL.x + 7;
  out.push(L([0, 1, 2, 3, 4, 5].map((j) => k.planOutline({ x: vx, y: MODEL.y + 8 + j * 4, w: 18, d: 1.6, r: 0.6 }, MODEL_H, P, 2)).join(""), { tone: "lo" }));
  out.push(topText(MODEL.x + 30, MODEL.y + 12, MODEL_H, "MODEL", 3, "mid"));
  out.push(topText(MODEL.x + 7, MODEL.y + 52, MODEL_H, "agent.py · answer()", 2.2, "lo"));
  out.push(L(k.lineOnTop([MODEL.x + 30, MODEL.y + 14], [MODEL.x + 41, MODEL.y + 14], MODEL_H, P), { tone: "faint", free: true }));
  // the tools block on top: a calculator key pad (HOS 1's calculate still declared)
  const tools = { x: MODEL.x + 28, y: MODEL.y + 22, w: 13, d: 15, r: 1 };
  out.push(S(k.slabOf(tools, MODEL_H, 3.2, P, 3, 0.4), { tone: "mid" }));
  out.push(Dt([0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => at([tools.x + 3 + c * 3.5, tools.y + 4 + r * 3.5, MODEL_H + 3.2]))), { size: 0.55 }));
  out.push(topText(tools.x + tools.w / 2, tools.y + tools.d + 3.6, MODEL_H, "TOOLS", 2.4, "lo", "middle"));
  // the output slot on the front face
  const fy = MODEL.y + MODEL.d;
  out.push(L(k.pathOf([at([ANS.x - 1, fy, 3]), at([ANS.x + ANS.w + 1, fy, 3]), at([ANS.x + ANS.w + 1, fy, 5]), at([ANS.x - 1, fy, 5]), at([ANS.x - 1, fy, 3])]), { tone: "hi" }));
  out.push(screws(k.corners(MODEL, 3), MODEL_H, 0.45));
  return out.join("");
}
// the answer slip, drawn inside the model and slid out through the front slot
function answer() {
  const z = 3.2, top = z + 0.8;
  const plan = { ...ANS, y: ANS.y };
  return S(k.slabOf(plan, z, 0.8, P, 2), { tone: "hi", crease: "none", inner: topText(plan.x + 3, plan.y + 19, top, "ANSWER", 2.6, "mid") + topText(plan.x + 3, plan.y + 22.6, top, "", 2.4, "hi", "start", " data-anstext") });
}
// the answer's run-out tray in front of the model
function runout() {
  const plan = { x: ANS.x - 3, y: MODEL.y + MODEL.d, w: ANS.w + 6, d: ANS_OUT + 2, r: 1 };
  return S(k.slabOf(plan, 0, 3, P, 3, 0.4), { tone: "mid" }) + pinned([plan.x + 3, plan.y + plan.d - 2.5], [plan.x + plan.w - 3, plan.y + plan.d - 2.5], 3, "lo");
}

// ---------- assemble ----------
const part = (id, svg, extra = "") => `<g data-part="${id}"${extra}>${svg}</g>`;
const cardsByDepth = store.map((_, i) => i).sort((a, b) => depth(cardX(a), CARD.y) - depth(cardX(b), CARD.y));

const FIGURE_LABEL =
  `A card-file bench that does retrieval. At the back, a tray of ${titles.length} Northwind documents feeds a cutter that splits them into ${N} chunk cards of 30 words, an embedding press stamps a fingerprint into each card, and the cards stand in a card file labelled Chroma. In front, a question card sits in a holder. The same press stamps the question, every card in the file rises by its cosine score against it, a top-k knob keeps the highest k, and those chunks are clipped onto a prompt board below a system sheet. The board feeds a box labelled model, with a tools pad on top, and an answer slip slides out of its front.`;

const BODY = [
  plate(),
  part("store", panel()),
  part("documents", tray()),
  part("chunker", cutter() + bladePosts() + `<g data-blade>${blade()}</g>`),
  part("store", trough() + cardsByDepth.map((i) => `<g data-lifter="${i}">${lifterSvg(i, 0)}</g><g data-card="${i}">${card(i)}</g>`).join("") + lip()),
  part("embedder", pressBed() + `<g data-lever>${lever()}</g>` + pressFrame() + `<g data-ram>${ram()}</g>`),
  part("question", holder()),
  part("topk", knob()),
  part("prompt", board() + [0, 1, 2, 3, 4].map((n) => `<g data-slip="${n}">${slip(n)}</g>`).join("")),
  part("model", runout() + `<g data-answer>${answer()}</g>` + model()),
  `<g data-fly><g data-part="question" data-qcard>${qcard()}</g><g data-traveler>${S(k.slabOf(box(0, 0, 18, 7, 0.4), 0, 0.6, P, 1), { tone: "hi", crease: "none" })}</g></g>`,
];
const svg = k.figureSvg({ width: W, height: H, label: FIGURE_LABEL, body: BODY });

// ---------- steps and parts ----------
const STEPS = [
  { say: `documents · ${titles.length} Northwind policies`, next: "Chunk them" },
  { say: `chunk · ${CHUNK} words, ${OVERLAP} overlap → ${N} chunks`, next: "Embed and store" },
  { say: "embed · RETRIEVAL_DOCUMENT → Chroma", next: "Ask a question" },
  { say: "question", next: "Embed the question" },
  { say: "embed · RETRIEVAL_QUERY, same model", next: "Score every chunk" },
  { say: "score", next: "Keep the top k" },
  { say: "top-k", next: "Build the prompt" },
  { say: "prompt", next: "Send it to the model" },
  { say: "answer", next: "Ask again" },
];
const PARTS = [
  { id: "documents", step: 0, title: "Documents", fact: `documents · ${titles.length} policies, ${perDoc.join(" + ")} chunks`, text: `Northwind's ${titles.length} policy files: returns, shipping, warranty and two product guides. These are the same sample documents as the simulator and the HOS 2 starter.` },
  { id: "chunker", step: 1, title: "Chunker", fact: `chunk · every ${CHUNK - OVERLAP} words, ${CHUNK} long`, text: `Splits each document into pieces of ${CHUNK} words, stepping back ${OVERLAP} each time so a sentence on a boundary appears whole in one piece. The HOS 2 starter uses 400 and 50, which leaves each short sample document as one chunk; the figure uses the simulator's smaller setting so you can see chunks compete.` },
  { id: "embedder", step: 2, title: "Embedding press", fact: "embed · one model, two task types", text: "Turns text into a vector, stamped here as a fingerprint. Chunks are embedded once at ingest with task type RETRIEVAL_DOCUMENT; each question is embedded with RETRIEVAL_QUERY by the same model, so the two land in the same space and can be compared." },
  { id: "store", step: 2, title: "Vector store (Chroma)", fact: `Chroma · ${N} vectors + their text`, text: "Keeps each chunk's vector next to its original text, on disk. Ingest fills it once. If you edit a document and don't re-run ingest, the file still holds the old cards and the app keeps answering from them." },
  { id: "question", step: 3, title: "Question", fact: "question · embedded on every request", text: "What the user typed. Unlike the documents, it is embedded fresh on every request, so retrieval runs on every question." },
  { id: "topk", step: 6, title: "Top-k", fact: "top-k · always returns k chunks", text: "Every chunk gets a cosine score against the question, and retrieve(k) keeps the k highest. It always returns k, even when only one is relevant: ask about customs fees and watch two weak cards ride along. The simulator's threshold is the fix." },
  { id: "prompt", step: 7, title: "Prompt", fact: "prompt · system + chunks + question", text: "What the model actually receives: a system instruction, the retrieved chunks and the question. Scope the instruction to content questions and keep tools allowed, or the model stops calling calculate and nothing errors." },
  { id: "model", step: 8, title: "Model", fact: "model · reads only the prompt", text: "Gemini sees only the board, never the whole file. If the fact isn't in the retrieved chunks, the answer can't be grounded in it, however good the model is." },
];

const unit = (vector) => { const o = at([0, 0, 0]); const p = at(vector); return [p[0] - o[0], p[1] - o[1]]; };
const DATA = {
  EX: unit([1, 0, 0]), EY: unit([0, 1, 0]), EZ: unit([0, 0, 1]),
  P, steps: STEPS, n: N, k0: K0,
  parts: Object.fromEntries(PARTS.map(({ id, step, fact }) => [id, { step, fact }])),
  questions: QUESTIONS.map(({ q, lines, fact, scores, order, has, fp }) => ({ q, lines, fact, scores, order, has, fp })),
  chunks: store.map((c, i) => ({ doc: SHORT[c.di], letter: LETTER[c.di], n: store.filter((d, j) => j <= i && d.di === c.di).length, text: c.text })),
  rise: RISE, cardX: store.map((_, i) => cardX(i)), card: { y: CARD.y, d: CARD.d, floor: FLOOR_H },
  blade: BLADE_Z, ram: RAM_Z, ramTop: RAM_H, selX: SEL_X,
  stations: { tray: [TRAY.x + TRAY.w / 2, TRAY.y + TRAY.d / 2, 2 + titles.length * 1.1], cut: [CUT.x + 19, CUT.y + 30, CUT_H + 7], press: [PRESS_SPOT[0], PRESS_SPOT[1], BED_H], file: [cardX(7), CARD.y + CARD.d / 2, FLOOR_H + CARD.h + 6] },
  qHome: Q_HOME, qPress: [PRESS_SPOT[0], PRESS_SPOT[1], BED_H], qBoard: Q_BOARD,
  slipFrom: store.map((_, i) => [cardX(i), CARD.y + CARD.d / 2, FLOOR_H + CARD.h]),
  slipTo: [0, 1, 2, 3, 4].map((n) => [BOARD.x + BOARD.w / 2, slipY(n), BOARD_H]),
  ansOut: ANS_OUT,
  knob: KNOB, knobR: KNOB_R, knobZ: KNOB_Z[1], knobAngles: [0, 1, 2, 3, 4].map(knobAngle),
};

const live = `
const D = ${JSON.stringify(DATA)};
const LAST = D.steps.length - 1;
const stage = ROOT.querySelector(".iso-stage");
const readout = ROOT.querySelector("[data-readout]");
const liveText = ROOT.querySelector("[data-live]");
const prev = ROOT.querySelector("[data-prev]");
const next = ROOT.querySelector("[data-next]");
const dots = [...ROOT.querySelectorAll("[data-dot]")];
const items = [...ROOT.querySelectorAll("[data-select]")];
const fewer = ROOT.querySelector("[data-fewer]");
const more = ROOT.querySelector("[data-more]");
const askButton = ROOT.querySelector("[data-ask]");
const bars = [...ROOT.querySelectorAll("[data-bar]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const N = D.n;
const sorted = (sel, key) => [...stage.querySelectorAll(sel)].sort((a, b) => a.dataset[key] - b.dataset[key]);
const cards = sorted("[data-card]", "card");
const lifters = sorted("[data-lifter]", "lifter");
const chunksEl = sorted("[data-chunk]", "chunk");
const slips = sorted("[data-slip]", "slip");
const slipText = slips.map((s) => s.querySelector("[data-sliptext]"));
const sheets = sorted("[data-sheet]", "sheet");
const bladeEl = stage.querySelector("[data-blade]");
const ramEl = stage.querySelector("[data-ram]");
const screwEl = stage.querySelector("[data-screw]");
const leverEl = stage.querySelector("[data-lever]");
const modeDoc = stage.querySelector("[data-mode-doc]");
const modeQuery = stage.querySelector("[data-mode-query]");
const qcard = stage.querySelector("[data-qcard]");
const qlines = [...stage.querySelectorAll("[data-qline]")].sort((a, b) => a.dataset.qline - b.dataset.qline);
const qprint = stage.querySelector("[data-qprint]");
const traveler = stage.querySelector("[data-traveler]");
const answerEl = stage.querySelector("[data-answer]");
const ansText = stage.querySelector("[data-anstext]");
const knobLine = stage.querySelector("[data-knob]");
const groups = [...stage.querySelectorAll("[data-part]")];
const teeth = cards.map((c) => c.querySelector("[data-teeth]"));

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const shift = (dx, dy, dz) => [D.EX[0] * dx + D.EY[0] * dy + D.EZ[0] * dz, D.EX[1] * dx + D.EY[1] * dy + D.EZ[1] * dz];
const setT = (el, [x, y]) => { const t = Math.abs(x) < 0.005 && Math.abs(y) < 0.005 ? "" : "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")"; if (el._t !== t) { el._t = t; t ? el.setAttribute("transform", t) : el.removeAttribute("transform"); } };
const setO = (el, o) => { const v = o >= 0.999 ? "" : o.toFixed(2); if (el._o !== v) { el._o = v; el.style.opacity = v; } };
const follow = (x, target, rate, dt) => { const nx = target + (x - target) * Math.exp(-rate * dt); return Math.abs(nx - target) < 0.002 ? target : nx; };
const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];

let qi = 0, kk = D.k0, step = 0, selected = null;
let touring = !still.matches, tourClock = 0, idleTimer = 0, visible = false, frame = 0, last = 0, clock = 0;
const Q = () => D.questions[qi];
const top = () => Q().order.slice(0, kk);
const riseNow = new Array(N).fill(0);
let filed = 0, cut = 0, travel = 0, qpos = 0, slipIn = 0, ansOut = 0, cycle = 0, mode = 0, printed = 0;

function goals() {
  const T = top();
  return {
    rise: D.cardX.map((_, i) => (step === 5 ? Q().scores[i] * D.rise : step === 6 && T.includes(i) ? Q().scores[i] * D.rise : 0)),
    filed: step >= 2 ? 1 : 0,
    cut: step === 0 ? 0 : step === 1 ? 1 : 0,
    travel: step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 3 : 4,
    qpos: step < 4 ? 0 : step < 7 ? 1 : 2,
    printed: step >= 4 ? 1 : 0,
    slipIn: step >= 7 ? 1 : 0,
    ansOut: step >= 8 ? 1 : 0,
    mode: step >= 3 ? 1 : 0,
  };
}

function announce(text) { if (liveText.textContent !== text) liveText.textContent = text; }
const pctS = (s) => s.toFixed(2);
function factLine() {
  const T = top(), found = T.find((i) => Q().has[i]);
  return found === undefined ? "fact missing from the top " + kk : "grounded · “" + Q().fact + "” in " + D.chunks[found].letter + D.chunks[found].n;
}
function stepText(n) {
  const T = top();
  if (n === 3) return "question · “" + Q().q + "”";
  if (n === 5) return "cosine · best " + T.slice(0, 3).map((i) => D.chunks[i].letter + D.chunks[i].n + " " + pctS(Q().scores[i])).join(" · ");
  if (n === 6) return "top-" + kk + " · " + T.map((i) => pctS(Q().scores[i])).join(" · ");
  if (n === 7) return "prompt · system + " + kk + " chunk" + (kk > 1 ? "s" : "") + " + question";
  if (n === 8) return factLine();
  return D.steps[n].say;
}

function setStep(n) {
  n = Math.max(0, Math.min(LAST, n));
  if (n === step) return;
  step = n;
  if (step === 2 || step === 4) cycle = 0;
  controls();
  if (!touring) announce(stepText(step));
  run();
}

function setQuestion(n) {
  qi = (n + D.questions.length) % D.questions.length;
  qlines.forEach((el, j) => (el.textContent = Q().lines[j]));
  qprint.querySelector("path").setAttribute("d", printPath());
  fillSlips();
  bars.forEach(fillBar);
}
function printPath() {
  // rebuild the question's fingerprint bars from its own fingerprint
  const [cx, cy, z] = D.qHome, top = z + 1.2, x0 = cx - 26 + 4, y0 = cy - 10 + 17.5;
  return Q().fp.map((v, j) => lineOnTop([x0 + j * 2.4, y0], [x0 + j * 2.4, y0 - 0.6 - v * 3], top, D.P)).join("");
}
function fillSlips() {
  const T = top();
  slipText.forEach((el, n) => { const i = T[n]; el.textContent = i === undefined ? "" : D.chunks[i].letter + D.chunks[i].n + " · " + D.chunks[i].doc + " · " + pctS(Q().scores[i]); });
  const found = T.find((i) => Q().has[i]);
  ansText.textContent = found === undefined ? "NOT IN CONTEXT" : "“" + Q().fact + "”";
  cards.forEach((c, i) => { const s = c.querySelector(".iso-solid"); if (step >= 6 && T.includes(i)) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit"); });
}
function fillBar(bar) {
  const r = Number(bar.dataset.bar), i = Q().order[r], s = Q().scores[i];
  bar.style.setProperty("--p", s.toFixed(4));
  bar.querySelector("span").textContent = D.chunks[i].letter + D.chunks[i].n + " " + D.chunks[i].doc;
  bar.querySelector("b").textContent = pctS(s);
  if (r < kk) bar.setAttribute("data-on", ""); else bar.removeAttribute("data-on");
  bar.title = D.chunks[i].text;
}

function setK(n) {
  n = Math.max(1, Math.min(5, n));
  if (n === kk) return;
  kk = n;
  const a = D.knobAngles[kk - 1];
  knobLine.setAttribute("d", lineOnTop([D.knob[0] + Math.cos(a) * 1.4, D.knob[1] + Math.sin(a) * 1.4], [D.knob[0] + Math.cos(a) * (D.knobR - 2), D.knob[1] + Math.sin(a) * (D.knobR - 2)], D.knobZ, D.P));
  if (step < 6) setStep(6);
  controls();
  announce(stepText(step));
  run();
}

function ask() {
  hold();
  select(null);
  setQuestion(qi + 1);
  if (step < 3) { step = 3; } else { step = 2; }
  setStep(3);
  controls();
  announce("question · “" + Q().q + "”");
}

function select(id) {
  if (selected === id) return;
  selected = id;
  for (const g of groups) { if (id && g.dataset.part === id) g.setAttribute("data-on", ""); else g.removeAttribute("data-on"); }
  if (id) stage.setAttribute("data-focus", ""); else stage.removeAttribute("data-focus");
  for (const item of items) { if (item.dataset.select === id) item.setAttribute("data-on", ""); else item.removeAttribute("data-on"); }
  if (id) announce(D.parts[id].fact);
  place();
}

function controls() {
  prev.disabled = step === 0;
  next.querySelector("span").textContent = D.steps[step].next;
  next.setAttribute("aria-label", D.steps[step].next);
  dots.forEach((dot, index) => (index < step ? dot.setAttribute("data-on", "") : dot.removeAttribute("data-on")));
  stage.setAttribute("aria-valuenow", String(step));
  stage.setAttribute("aria-valuetext", stepText(step));
  fewer.disabled = kk === 1;
  more.disabled = kk === 5;
  ROOT.querySelector("[data-k]").textContent = "k " + kk;
  fillSlips();
  bars.forEach(fillBar);
}

function update(dt, calm) {
  const g = goals();
  let busy = false;
  const go = (x, target, rate) => { const nx = calm ? target : follow(x, target, rate, dt); if (nx !== target) busy = true; return nx; };
  for (let i = 0; i < N; i++) riseNow[i] = go(riseNow[i], g.rise[i], 5);
  filed = go(filed, g.filed, 4);
  cut = go(cut, g.cut, 3);
  travel = go(travel, g.travel, 2.4);
  qpos = go(qpos, g.qpos, 3);
  printed = go(printed, g.printed, 3);
  slipIn = go(slipIn, g.slipIn, 3.5);
  ansOut = go(ansOut, g.ansOut, 2.6);
  mode = go(mode, g.mode, 6);
  // the press and the blade cycle while their step is running
  const stamping = !calm && ((step === 2 && travel > 1.6 && travel < 2.6) || (step === 4 && qpos > 0.9 && printed < 0.95));
  const chopping = !calm && step === 1 && cut < 0.97;
  if (stamping || chopping) { cycle += dt * 2.2; busy = true; } else cycle = go(cycle, Math.ceil(cycle), 6);
  return busy;
}

function travelerAt(t) {
  const s = D.stations, seq = [s.tray, s.cut, s.press, s.file, s.file];
  const i = Math.min(3, Math.floor(t)), f = ease(t - i);
  const p = lerp3(seq[i], seq[i + 1], f);
  return [p[0], p[1], p[2] + Math.sin(Math.PI * f) * 16];
}

function place() {
  // chunk slips pile up on the cutter's out side while chunking, then leave for the file
  const pile = Math.round(cut * N);
  chunksEl.forEach((c, i) => setO(c, i < pile && filed < 0.5 ? 1 : 0));
  sheets.forEach((s) => setO(s, 1));
  // the cutter's blade and the press's ram: down at the middle of each cycle
  const stroke = (c) => Math.max(0, Math.sin(Math.PI * (c % 1)));
  const chop = step === 1 ? stroke(cycle) : 0;
  setT(bladeEl, shift(0, 0, -(D.blade[0] - D.blade[1]) * chop));
  const stamp = step === 2 || step === 4 ? stroke(cycle) : 0;
  const ramDrop = -(D.ram[0] - D.ram[1]) * stamp;
  setT(ramEl, shift(0, 0, ramDrop));
  const key = stamp.toFixed(2);
  if (screwEl._k !== key) { screwEl._k = key; screwEl.innerHTML = solidSvg(cylinder(D.stations.press[0], D.stations.press[1], 1.6, D.ram[0] + D.ramTop + ramDrop, 44 - (D.ram[0] + D.ramTop + ramDrop), D.P, 14), { tone: "mid" }); }
  // mode lever: DOC at ingest, QUERY for questions
  setT(leverEl, shift((D.selX[1] - D.selX[0]) * ease(mode), 0, 0));
  modeDoc.setAttribute("data-tone", mode < 0.5 ? "hi" : "lo");
  modeQuery.setAttribute("data-tone", mode >= 0.5 ? "hi" : "lo");
  // the traveler: one chunk card riding tray → cutter → press → file
  const showT = travel > 0.02 && travel < 3.95 && step <= 2;
  setO(traveler, showT ? 1 : 0);
  if (showT) setT(traveler, shift(...travelerAt(travel)));
  // filed cards and their stamped teeth
  cards.forEach((c, i) => { setO(c, filed); setO(lifters[i], filed); setO(teeth[i], filed); });
  for (let i = 0; i < N; i++) {
    setT(cards[i], shift(0, 0, riseNow[i]));
    const kz = Math.max(0.6, riseNow[i]).toFixed(1);
    if (lifters[i]._k !== kz) {
      lifters[i]._k = kz;
      const x = D.cardX[i], y = D.card.y + D.card.d / 2;
      lifters[i].innerHTML = solidSvg(slabOf({ x: x - 0.55, y: y - 1.5, w: 1.1, d: 3, r: 0.3 }, D.card.floor - 0.4, Math.max(0.6, riseNow[i]) + 0.4, D.P, 1), { tone: "mid" });
    }
  }
  // the question card: holder → press → board
  const qa = qpos <= 1 ? lerp3(D.qHome, D.qPress, ease(qpos)) : lerp3(D.qPress, D.qBoard, ease(qpos - 1));
  const qf = qpos <= 1 ? qpos : qpos - 1;
  const lift = Math.sin(Math.PI * Math.min(1, Math.max(0, qf))) * 18;
  setT(qcard, shift(qa[0] - D.qHome[0], qa[1] - D.qHome[1], qa[2] - D.qHome[2] + lift));
  setO(qprint, printed);
  // chunk slips drop onto the board from above their cards
  const T = top();
  slips.forEach((s, n) => {
    const i = T[n];
    if (i === undefined) { setO(s, 0); return; }
    const f = ease(Math.min(1, Math.max(0, slipIn * 1.4 - n * 0.1)));
    const from = D.slipFrom[i], to = D.slipTo[n];
    const p = lerp3(from, to, f);
    setT(s, shift(p[0] - to[0], p[1] - to[1], p[2] - to[2] + Math.sin(Math.PI * f) * 14));
    setO(s, slipIn > 0.02 ? 1 : 0);
  });
  // the answer slides out of the model's front slot
  setT(answerEl, shift(0, D.ansOut * ease(ansOut), 0));
  setO(answerEl, ansOut > 0.02 ? 1 : 0);
  const text = selected ? D.parts[selected].fact : stepText(step);
  if (readout.textContent !== text) readout.textContent = text;
}

const TOUR = 2.6;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) {
    tourClock += dt;
    const beat = Math.floor(tourClock / TOUR);
    // the first lap walks all of it; later laps skip ingest (it ran once) and change the question
    const lap = beat < D.steps.length ? beat : 3 + ((beat - D.steps.length) % (D.steps.length - 3));
    if (lap === 3 && step === LAST) setQuestion(qi + 1);
    if (lap !== step) setStep(lap);
  }
  const busy = update(dt, still.matches);
  place();
  frame = visible && (busy || touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }

function hold() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches || selected || stage.matches(":hover, :focus-within") || ROOT.matches(":focus-within")) return hold();
    touring = true;
    tourClock = (D.steps.length + Math.max(0, step - 3)) * TOUR;
    run();
  }, 9000);
}
const go = (n) => { hold(); setStep(n); };
// after the answer, a new question starts at step 3: ingest isn't repeated
const forward = () => { if (step === LAST) ask(); else go(step + 1); };

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const partAt = (target) => target.closest && target.closest("[data-part]");
stage.addEventListener("pointermove", (event) => { if (event.pointerType !== "mouse") return; hold(); const g = partAt(event.target); select(g ? g.dataset.part : null); });
stage.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
stage.addEventListener("click", (event) => { hold(); const g = partAt(event.target); if (!g) return select(null); if (event.pointerType !== "mouse") select(selected === g.dataset.part ? null : g.dataset.part); });
stage.addEventListener("keydown", (event) => {
  const keys = { ArrowRight: () => go(step + 1), ArrowDown: () => go(step + 1), ArrowLeft: () => go(step - 1), ArrowUp: () => go(step - 1), Home: () => go(0), End: () => go(LAST), " ": forward, Enter: forward, Escape: () => { hold(); select(null); }, q: ask, Q: ask, "[": () => { hold(); setK(kk - 1); }, "]": () => { hold(); setK(kk + 1); }, "-": () => { hold(); setK(kk - 1); }, "=": () => { hold(); setK(kk + 1); }, "+": () => { hold(); setK(kk + 1); } };
  if (!keys[event.key]) return;
  event.preventDefault();
  keys[event.key]();
});
prev.addEventListener("click", () => go(step - 1));
next.addEventListener("click", forward);
askButton.addEventListener("click", ask);
fewer.addEventListener("click", () => { hold(); setK(kk - 1); });
more.addEventListener("click", () => { hold(); setK(kk + 1); });
for (const item of items) {
  const id = item.dataset.select;
  item.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { hold(); select(id); } });
  item.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
  const pickPart = () => { hold(); select(id); setStep(D.parts[id].step); };
  item.addEventListener("click", pickPart);
  item.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pickPart(); } });
  item.addEventListener("focus", () => { hold(); select(id); });
  item.addEventListener("blur", () => select(null));
}
setQuestion(0);
update(0, true);
controls();
place();
`;

const plateBody = k.plateHtml({
  fig: "Fig 2",
  title: "RAG pipeline · Northwind",
  hint: "← → step · Q next question · [ ] top-k · F expand",
  readout: STEPS[0].say,
  keys: [
    { mark: "lit", label: "The top-k cards: the only chunks the model will see" },
    { mark: "raised", label: "Tray, cutter, press and file: ingest, run once" },
  ],
  caption: `Retrieval-augmented generation in two phases. Ingest runs once: ${titles.length} documents are cut into ${N} chunks (${CHUNK} words, ${OVERLAP} overlap), each chunk is embedded and stored in Chroma with its text. Then, for every question, the same embedding model embeds the question, every stored chunk gets a cosine score, the top k go into the prompt with the system instruction, and the model answers from that prompt alone. The documents and scores are the Module 2 simulator's: a word-count stand-in for a real embedding, with real arithmetic.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="RAG pipeline. Arrow keys step through ingest and one question; Q asks the next question; [ and ] change top-k; hover or tap a part to read about it." aria-valuemin="0" aria-valuemax="${STEPS.length - 1}" aria-valuenow="0" aria-valuetext="${STEPS[0].say}">${svg}</div>
<div class="pc-controls"><button type="button" class="pc-btn" data-prev aria-label="Back one step" disabled>←</button><span class="pc-dots" aria-hidden="true">${STEPS.slice(1).map(() => "<i data-dot></i>").join("")}</span><span class="pc-group pc-right"><button type="button" class="pc-btn" data-fewer aria-label="Fewer chunks (lower top-k)" aria-keyshortcuts="[">−</button><span data-k data-value>k ${K0}</span><button type="button" class="pc-btn" data-more aria-label="More chunks (raise top-k)" aria-keyshortcuts="]">+</button></span><button type="button" class="pc-btn" data-ask aria-keyshortcuts="Q">Next question</button><button type="button" class="pc-btn pc-next" data-next><span>${STEPS[0].next}</span> →</button>${EXPAND_BUTTON}<span class="pc-live" aria-live="polite" data-live></span></div>`,
});

const scores = `<h4 style="margin:6px 0 0">Scores for this question</h4><p class="tip">The five best of ${N} chunks. The top k (bold) go into the prompt. Hover a row for the chunk's text.</p><ol class="pc-bars" style="margin-bottom:10px">${[0, 1, 2, 3, 4].map((r) => `<li data-bar="${r}" style="--p:0"><span></span><i></i><b></b></li>`).join("")}</ol>`;
const html = embedHtml({ slug: "rag-pipeline", plate: plateBody, parts: partsHtml(PARTS, { extra: scores }), task: "Set top-k to 1 (press −) and step through all three questions. Does the one chunk still hold the answer? Then look at the scores: what were the other four adding at k = 5?", live });
inject("module-2/index.html", "rag-pipeline", html);
preview("rag-pipeline", html);
