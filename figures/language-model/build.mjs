// Anatomy of a language model, for AI 410 Module 1 (Lecture Part 2). Writes the figure into
// module-1/index.html between its <!-- anatomy:language-model --> markers.
// Adapted from clarkngo/anatomy-of (language-model/build.mjs).
// A next-word bench: the model reads the context, scores every candidate word, turns the
// scores into probabilities (softmax, shaped by temperature), draws one at random and appends it.
// Uses the Anatomy kit (MIT, vendored in figures/kit). The numbers are a small toy model.
import { k, EXPAND_BUTTON, embedHtml, partsHtml, inject, preview } from "../embed.mjs";

// ---------- the model (toy numbers, true arithmetic) ----------
const CONTEXT = ["the", "cat", "sat", "on", "the"];
const WORDS = ["mat", "floor", "sofa", "bed", "roof", "moon"];
const LOGITS = [3.0, 2.2, 1.6, 1.3, 0.4, -1.0];
const TEMPS = [0.25, 0.5, 1, 1.5, 2];
const T0 = 2; // index into TEMPS: T = 1
const LAYERS = 6;
const softmax = (logits, t) => {
  const top = Math.max(...logits);
  const e = logits.map((z) => Math.exp((z - top) / t));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / sum);
};

// ---------- world ----------
const W = 640;
const H = 400;
const PLATE = { x: -134, y: -94, w: 270, d: 178, r: 9 };
const PLATE_H = 9;
const FOOT_H = 5;

// context rail, front left
const SLOT = 30; // tile pitch
const TILE = { w: 26, d: 13, h: 6 };
const RAIL = { x: -128, y: 36, w: 6 * SLOT + 8, d: 19, r: 2 };
const RAIL_H = 4;
const slotX = (i) => RAIL.x + 4 + SLOT / 2 + i * SLOT; // tile centre
const TILE_Y = RAIL.y + RAIL.d / 2;

// read head: a carriage on a tall rail just behind the tiles, a finger over each tile
const READ = { x: RAIL.x, y: 22, w: RAIL.w, d: 7, r: 1.2 };
const READ_H = 15;
const HEAD = { w: 12, d: 11 };
const HEAD_Z = [READ_H, READ_H + 8];

// layer stack, back left
const STACK = { x: -126, y: -86, w: 66, d: 54, r: 3 };
const STACK_BASE = 7;
const LAYER_PITCH = 7.5;
const LAYER_H = 4;
const STACK_TOP = STACK_BASE + LAYERS * LAYER_PITCH;

// rack of candidate pistons, back right
const COL = 19;
const colX = (i) => 6 + COL / 2 + i * COL;
const COL_Y = -58;
const SLEEVE = { w: 13, d: 13, h: 9 };
const PISTON = { w: 8, d: 8 };
const CAND = { w: 17, d: 13, h: 4.5 };
const RISE = 62; // piston travel for p = 1
const LOGIT_FLOOR = -1.5;
const LOGIT_SCALE = 9; // piston travel per unit of score
const PANEL = { x: 0, y: -84, w: COL * 6 + 12, d: 5, r: 1 };
const PANEL_H = RISE + SLEEVE.h + CAND.h + 6;

// manifold from the stack to the rack
const BUS = { x: STACK.x + STACK.w - 2, y: COL_Y - 4, w: colX(0) - SLEEVE.w / 2 - (STACK.x + STACK.w) + 2, d: 8, r: 1 };
const BUS_H = 5;

// sampling tape: 100 units long = probability 1
const TAPE = { x: 6, len: 114, y: -38, d: 13 };
const TAPE_Z = 1.2;
const TAPE_K = TAPE.len; // units per probability
const CARR_RAIL = { x: TAPE.x - 6, y: TAPE.y + TAPE.d + 1.5, w: TAPE.len + 12, d: 5, r: 1 };
const CARR = { w: 10, d: 9, h: 6 };

// temperature knob, front right
const KNOB = [100, 44];
const KNOB_R = 9;
const KNOB_Z = [4, 11];
const DIAL_R = 15;
const KNOB_SPAN = (Math.PI * 4) / 3;
const knobAngle = (i) => -Math.PI / 2 - KNOB_SPAN / 2 + (KNOB_SPAN * i) / (TEMPS.length - 1) + Math.PI / 4;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PANEL.x, PANEL.y, PANEL_H], [PANEL.x + PANEL.w, PANEL.y, PANEL_H], [STACK.x, STACK.y, STACK_TOP + 10], [STACK.x + STACK.w, STACK.y, STACK_TOP + 10]],
  W,
  H,
  { pad: 18, azimuth: 50 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(...a) - depth(...b));
const box = (cx, cy, w, d, r = 0.8) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const screws = (list, z, size = 0.45) => Dt(list.map(([x, y]) => at([x, y, z])), { size });
// a line on a top face that ends on a screw at each end
const pinned = (from, to, z, tone = "faint") => L(k.lineOnTop(from, to, z, P), { tone }) + screws([from, to], z, 0.4);

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
  // label plate, front middle, with an engraved title and two rule lines
  const label = { x: -40, y: 62, w: 46, d: 15, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 7], 0.8, P, "x"), "NEXT WORD", { size: 3.2, tone: "mid" }));
  out.push(L([[10.5, 30], [12.5, 18]].map(([dy, len]) => k.lineOnTop([label.x + 5, label.y + dy], [label.x + 5 + len, label.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(screws([[label.x + 2.6, label.y + 2.6], [label.x + label.w - 2.6, label.y + label.d - 2.6]], 0.8, 0.4));
  return out.join("");
}

// ---------- layer stack: six plates on four guide posts ----------
function stack() {
  const out = [];
  const base = STACK;
  out.push(S(k.slabOf(base, 0, STACK_BASE, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(base, 2.5, P, 6), { tone: "faint" }) }));
  const posts = k.corners(base, 6);
  const [back, ...rest] = byDepth(posts);
  const postSvg = ([x, y]) => S(k.cylinder(x, y, 1.8, STACK_BASE, STACK_TOP - STACK_BASE + 4, P, 16), { tone: "mid" });
  out.push(postSvg(back));
  for (let i = 0; i < LAYERS; i++) {
    const z = STACK_BASE + 3.5 + i * LAYER_PITCH;
    const plan = k.insetPlan(base, 2);
    const lamps = [0, 1, 2, 3, 4, 5].map((j) => at([plan.x + plan.w - 0.01, plan.y + 9 + j * 6.5, z + LAYER_H / 2]));
    out.push(`<g data-layer="${i}">${S(k.slabOf(plan, z, LAYER_H, P, 6, 0.5), { tone: "hi" })}${Dt(lamps, { size: 0.65, tone: "lo" })}</g>`);
    // spacer collars on the posts between plates
    if (i < LAYERS - 1) for (const [x, y] of rest.slice(0, 2)) out.push(S(k.cylinder(x, y, 2.4, z + LAYER_H, LAYER_PITCH - LAYER_H, P, 16), { tone: "mid" }));
  }
  for (const p of rest) out.push(postSvg(p));
  // top cap nut on each post
  for (const [x, y] of posts) out.push(S(k.cylinder(x, y, 2.6, STACK_TOP + 4, 1.6, P, 6), { tone: "mid" }), Dt([at([x, y, STACK_TOP + 5.6])], { size: 0.45 }));
  // engraved layer count on the top plate
  const topZ = STACK_BASE + 3.5 + (LAYERS - 1) * LAYER_PITCH + LAYER_H;
  out.push(k.faceTextSvg(k.topMatrix([base.x + 10, base.y + 30], topZ, P, "x"), `${LAYERS} LAYERS`, { size: 3.4, tone: "lo" }));
  out.push(L(k.lineOnTop([base.x + 10, base.y + 34], [base.x + 40, base.y + 34], topZ, P), { tone: "faint", free: true }));
  return out.join("");
}

function bus() {
  const out = [S(k.slabOf(BUS, 0, BUS_H, P, 3, 0.4), { tone: "mid", inner: pinned([BUS.x + 10, BUS.y + BUS.d / 2], [BUS.x + BUS.w - 10, BUS.y + BUS.d / 2], BUS_H) })];
  out.push(screws([[BUS.x + 6, BUS.y + 2], [BUS.x + 6, BUS.y + BUS.d - 2], [BUS.x + BUS.w - 6, BUS.y + 2], [BUS.x + BUS.w - 6, BUS.y + BUS.d - 2]], BUS_H, 0.4));
  return out.join("");
}

// ---------- the rack ----------
function panel() {
  const out = [S(k.slabOf(PANEL, 0, PANEL_H, P, 3, 0.5), { tone: "mid" })];
  // a percentage rule on the panel face: 0 at the sleeve tops, 100% at full travel
  const face = PANEL.y + PANEL.d;
  const z0 = SLEEVE.h;
  const tick = (z, len) => k.pathOf([at([PANEL.x + 1.5, face, z]), at([PANEL.x + 1.5 + len, face, z])]);
  let minor = "", major = "";
  for (let i = 0; i <= 20; i++) (i % 5 ? (minor += tick(z0 + (RISE * i) / 20, 2.2)) : (major += tick(z0 + (RISE * i) / 20, 4)));
  out.push(L(minor, { tone: "lo", free: "end" }), L(major, { tone: "mid", free: "end" }));
  for (const [z, text] of [[z0, "0"], [z0 + RISE / 2, "50"], [z0 + RISE, "100%"]]) {
    out.push(k.faceTextSvg(k.sideMatrix([PANEL.x + 6.5, face], z - 1.1, P, "left"), text, { size: 2.6, tone: "lo" }));
  }
  // a rule line across each column at the top, and screws
  // a guide slot behind each column, from the sleeve top to full travel, with a stop screw at each end
  for (let i = 0; i < 6; i++) {
    const x = colX(i);
    out.push(L(k.pathOf([at([x, face, z0 + 2]), at([x, face, z0 + RISE + CAND.h])]), { tone: "faint" }));
    out.push(Dt([at([x, face, z0 + 2]), at([x, face, z0 + RISE + CAND.h])], { size: 0.45 }));
  }
  out.push(Dt([[PANEL.x + 3, PANEL_H - 3], [PANEL.x + PANEL.w - 3, PANEL_H - 3], [PANEL.x + PANEL.w - 3, 3]].map(([x, z]) => at([x, face, z])), { size: 0.45 }));
  out.push(screws([[PANEL.x + 2.5, PANEL.y + 2.5], [PANEL.x + PANEL.w - 2.5, PANEL.y + 2.5]], PANEL_H, 0.4));
  return out.join("");
}

function rackBase() {
  const plan = { x: PANEL.x, y: COL_Y - 10, w: PANEL.w, d: 20, r: 1.5 };
  return S(k.slabOf(plan, 0, 2, P, 3, 0.4), { tone: "lo" }) + screws([[plan.x + 3, plan.y + 3], [plan.x + 3, plan.y + plan.d - 3], [plan.x + plan.w - 3, plan.y + plan.d - 3]], 2, 0.4);
}

function sleeve(i) {
  const cx = colX(i);
  const plan = box(cx, COL_Y, SLEEVE.w, SLEEVE.d, 1);
  const out = [S(k.slabOf(plan, 2, SLEEVE.h - 2, P, 3, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(box(cx, COL_Y, PISTON.w + 1.6, PISTON.d + 1.6, 0.6), SLEEVE.h, P, 2), { tone: "lo" }));
  out.push(screws([[plan.x + 1.8, plan.y + 1.8], [plan.x + plan.w - 1.8, plan.y + plan.d - 1.8]], SLEEVE.h, 0.35));
  return out.join("");
}

// the piston column, rebuilt in the page as it rises (drawn here at a rest height)
const pistonSvg = (cx, rise) => {
  const h = Math.max(0.6, rise);
  const plan = box(cx, COL_Y, PISTON.w, PISTON.d, 0.6);
  return S(k.slabOf(plan, SLEEVE.h - 0.5, h + 0.5, P, 2), { tone: "mid" });
};

// a word tile, drawn at a given centre and base height
function tileSvg(cx, cy, z, word, size) {
  const plan = box(cx, cy, size.w, size.d, 1.2);
  const top = z + size.h;
  const inner = L(k.planOutline(k.insetPlan(plan, 1.3), top, P, 3), { tone: "faint" });
  const text = k.faceTextSvg(k.topMatrix([cx, cy + 1.3], top, P, "x"), word, { size: word.length > 4 ? 3.4 : 3.9, tone: "hi", anchor: "middle" });
  return S(k.slabOf(plan, z, size.h, P, 3, 0.6), { tone: "hi", inner: inner + text });
}

// ---------- sampling tape and carriage ----------
function tape() {
  const out = [];
  const strip = { x: TAPE.x - 3, y: TAPE.y, w: TAPE.len + 6, d: TAPE.d, r: 1 };
  out.push(S(k.slabOf(strip, 0, TAPE_Z, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(TAPE.x, TAPE.x + TAPE.len, TAPE.len / 20, 5, TAPE.y + TAPE.d, TAPE_Z, [1.6, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([TAPE.x, TAPE.y + 1.6], [TAPE.x + TAPE.len, TAPE.y + 1.6], TAPE_Z, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([TAPE.x, TAPE.y + 1.2], [TAPE.x, TAPE.y + TAPE.d], TAPE_Z, P) + k.lineOnTop([TAPE.x + TAPE.len, TAPE.y + 1.2], [TAPE.x + TAPE.len, TAPE.y + TAPE.d], TAPE_Z, P), { tone: "mid" }));
  out.push(Dt([at([strip.x + 1.5, strip.y + 1.5, TAPE_Z]), at([strip.x + strip.w - 1.5, strip.y + 1.5, TAPE_Z])], { size: 0.4 }));
  // end blocks
  for (const x of [TAPE.x - 7, TAPE.x + TAPE.len + 3]) out.push(S(k.slabOf({ x, y: TAPE.y - 1, w: 4, d: CARR_RAIL.y + CARR_RAIL.d - TAPE.y + 1, r: 0.8 }, 0, 4, P, 2, 0.3), { tone: "mid" }), screws([[x + 2, TAPE.y + 2]], 4, 0.4));
  // carriage rail
  out.push(S(k.slabOf(CARR_RAIL, 0, 2.2, P, 2, 0.3), { tone: "mid" }));
  out.push(pinned([CARR_RAIL.x + 3, CARR_RAIL.y + CARR_RAIL.d / 2], [CARR_RAIL.x + CARR_RAIL.w - 3, CARR_RAIL.y + CARR_RAIL.d / 2], 2.2));
  return out.join("");
}

// segment dividers: thin fences standing on the tape, one at each running total (drawn at x = 0)
const dividerSvg = () => S(k.slabOf({ x: -0.5, y: TAPE.y + 0.4, w: 1, d: TAPE.d - 0.8, r: 0.2 }, TAPE_Z, 3.2, P, 1), { tone: "mid", crease: "none" });
// the segment's word, engraved on the tape between dividers (drawn at x = 0)
const segText = (word) => k.faceTextSvg(k.topMatrix([0, TAPE.y + 8.6], TAPE_Z, P, "x"), word, { size: 3.4, tone: "hi", anchor: "middle" });

function carriage() {
  const x = TAPE.x;
  const plan = box(x, CARR_RAIL.y + CARR_RAIL.d / 2, CARR.w, CARR.d, 1.2);
  const out = [S(k.slabOf(plan, 2.2, CARR.h, P, 3, 0.5), { tone: "mid" })];
  out.push(screws([[plan.x + 2, plan.y + 2], [plan.x + plan.w - 2, plan.y + plan.d - 2]], 2.2 + CARR.h, 0.4));
  // the pin: an arm reaching back over the tape, ending in a needle point
  const armY0 = plan.y + 2;
  const arm = { x: x - 1, y: TAPE.y + 3, w: 2, d: armY0 - TAPE.y - 3, r: 0.4 };
  out.push(S(k.slabOf(arm, 2.2 + CARR.h - 1.6, 1.6, P, 1), { tone: "hi" }));
  out.push(S(k.cylinder(x, TAPE.y + 4, 0.9, TAPE_Z, 2.2 + CARR.h - 1.6 - TAPE_Z, P, 12), { tone: "hi", lit: true }));
  out.push(Dt([at([x, TAPE.y + 4, 2.2 + CARR.h])], { size: 0.6, tone: "hi" }));
  return out.join("");
}

// ---------- context rail and read head ----------
function rail() {
  const out = [S(k.slabOf(RAIL, 0, RAIL_H, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.sideSeam(RAIL, 1.5, P, 4), { tone: "faint" }));
  // slot marks between tiles and end stops
  for (let i = 0; i <= 6; i++) {
    const x = slotX(i) - SLOT / 2;
    out.push(L(k.lineOnTop([x, RAIL.y + 1.5], [x, RAIL.y + 3.5], RAIL_H, P), { tone: "lo", free: true }));
  }
  for (const x of [RAIL.x + 1, RAIL.x + RAIL.w - 3]) out.push(S(k.slabOf({ x, y: RAIL.y + 2, w: 2, d: RAIL.d - 4, r: 0.4 }, RAIL_H, 3, P, 1), { tone: "mid" }));
  // the empty slot: an inset outline and a caret
  const sx = slotX(5);
  out.push(L(k.planOutline(box(sx, TILE_Y, TILE.w - 2, TILE.d - 2, 1), RAIL_H, P, 3), { tone: "lo", dashed: true }));
  out.push(`<g data-caret>${L(k.lineOnTop([sx - 4, TILE_Y + 3], [sx - 4, TILE_Y - 3], RAIL_H, P), { tone: "hi", free: "both" })}</g>`);
  out.push(screws([[RAIL.x + 6, RAIL.y + RAIL.d - 2.5], [RAIL.x + RAIL.w - 6, RAIL.y + RAIL.d - 2.5]], RAIL_H, 0.4));
  return out.join("");
}

function readRail() {
  const out = [S(k.slabOf(READ, 0, READ_H, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(READ, 4, P, 3), { tone: "faint" }) })];
  out.push(pinned([READ.x + 3, READ.y + READ.d / 2], [READ.x + READ.w - 3, READ.y + READ.d / 2], READ_H, "lo"));
  return out.join("");
}

// the head over slot 0 (moved along x in the page)
function head() {
  const cx = slotX(0);
  const plan = box(cx, READ.y + READ.d / 2, HEAD.w, HEAD.d, 1.4);
  const out = [S(k.slabOf(plan, HEAD_Z[0], HEAD_Z[1] - HEAD_Z[0], P, 3, 0.6), { tone: "hi" })];
  out.push(screws([[plan.x + 2, plan.y + 2], [plan.x + plan.w - 2, plan.y + 2]], HEAD_Z[1], 0.4));
  // a finger reaching forward over the tile, with a reading lens at its tip
  const finger = { x: cx - 1.6, y: plan.y + plan.d, w: 3.2, d: TILE_Y - (plan.y + plan.d), r: 0.5 };
  out.push(S(k.slabOf(finger, HEAD_Z[0] + 1.5, 2, P, 1), { tone: "hi" }));
  out.push(S(k.cylinder(cx, TILE_Y, 2.4, HEAD_Z[0] + 0.5, 3, P, 20), { tone: "hi" }));
  out.push(L(k.ring(cx, TILE_Y, 1.4, HEAD_Z[0] + 3.5, P, 18), { tone: "lo" }));
  return out.join("");
}

// ---------- temperature knob ----------
function knob() {
  const [cx, cy] = KNOB;
  const out = [S(k.cylinder(cx, cy, DIAL_R + 2, 0, 1.4, P, 40), { tone: "mid" })];
  out.push(L(k.ring(cx, cy, DIAL_R, 1.4, P, 40), { tone: "faint" }));
  const ticks = TEMPS.map((_, i) => {
    const a = knobAngle(i);
    const r0 = KNOB_R + 1.6, r1 = DIAL_R - (i === T0 ? 0 : 1);
    return k.lineOnTop([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], 1.4, P);
  });
  out.push(L(ticks.join(""), { tone: "mid", free: "both" }));
  out.push(S(k.cylinder(cx, cy, KNOB_R, KNOB_Z[0] - 2.6, 2.6, P, 36), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, KNOB_R - 1, KNOB_Z[0], KNOB_Z[1] - KNOB_Z[0], P, 36), { tone: "hi" }));
  out.push(L(k.knurl(cx, cy, KNOB_R - 1, KNOB_Z[0], KNOB_Z[1], 30, P), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, KNOB_R - 3.4, KNOB_Z[1], P, 30), { tone: "faint" }));
  out.push(`<path class="iso-line" data-tone="hi" data-knob data-free="both" d="${knobPointer(knobAngle(T0))}" style="stroke-width:1.1"/>`);
  out.push(Dt([at([cx, cy, KNOB_Z[1]])], { size: 0.55, tone: "hi" }));
  // engraved T beside the dial
  out.push(k.faceTextSvg(k.topMatrix([cx - DIAL_R - 6, cy + DIAL_R - 2], 0, P, "x"), "T", { size: 4, tone: "mid", anchor: "middle" }));
  return out.join("");
}
function knobPointer(a) {
  const [cx, cy] = KNOB;
  return k.lineOnTop([cx + Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4], [cx + Math.cos(a) * (KNOB_R - 2), cy + Math.sin(a) * (KNOB_R - 2)], KNOB_Z[1], P);
}

// ---------- assemble ----------
const part = (id, svg, extra = "") => `<g data-part="${id}"${extra}>${svg}</g>`;
const columns = WORDS.map((_, i) => i).sort((a, b) => depth(colX(a), COL_Y) - depth(colX(b), COL_Y));
const probs0 = softmax(LOGITS, TEMPS[T0]);

const FIGURE_LABEL =
  "A next-word bench. Five word tiles reading 'the cat sat on the' sit on a rail with one empty slot. A read head slides over them, a stack of six layer plates stands behind, and a rack of six pistons lifts the candidate words mat, floor, sofa, bed, roof and moon to heights set first by their scores and then by their probabilities. A temperature knob reshapes the probabilities, a tape in front of the rack is divided into lengths that match them, and a pin stops at a random point on the tape to pick the next word.";

const BODY = [
  plate(),
  part("layers", stack()),
  part("scores", panel() + rackBase()),
  part("layers", bus()),
  ...columns.map((i) =>
    part("scores", sleeve(i) + `<g data-piston="${i}">${pistonSvg(colX(i), probs0[i] * RISE)}</g>` + `<g data-home="${i}"><g data-tile="${i}">${tileSvg(colX(i), COL_Y, SLEEVE.h, WORDS[i], CAND)}</g></g>`),
  ),
  part("sampler", tape() + `<g data-segs>${WORDS.map((w, i) => `<g data-seg="${i}">${segText(w)}</g>`).join("")}</g>` + `<g data-dividers>${WORDS.slice(0, -1).map((_, i) => `<g data-divider="${i}">${dividerSvg()}</g>`).join("")}</g>` + `<g data-carriage>${carriage()}</g>`),
  part("layers", readRail()),
  part("context", rail() + CONTEXT.map((w, i) => `<g data-ctx="${i}">${tileSvg(slotX(i), TILE_Y, RAIL_H, w, TILE)}</g>`).join("")),
  part("layers", `<g data-head>${head()}</g>`),
  part("temperature", knob()),
  `<g data-fly></g>`,
];
const svg = k.figureSvg({ width: W, height: H, label: FIGURE_LABEL, body: BODY });

// ---------- steps and parts ----------
const STEPS = [
  { say: `context · ${CONTEXT.length} tokens`, next: "Read the context" },
  { say: `reading · ${LAYERS} layers, every token`, next: "Score every word" },
  { say: "scores · one per candidate", next: "Turn scores into odds" },
  { say: "softmax · odds add to 100%", next: "Draw at random" },
  { say: "draw", next: "Append the word" },
  { say: "appended", next: "Start over" },
];
const PARTS = [
  { id: "context", step: 0, title: "Context", fact: `context · “${CONTEXT.join(" ")}”`, text: "Everything written so far. A real model cuts text into tokens, which are often whole words and sometimes pieces of words, and it sees every one of them at each step." },
  { id: "layers", step: 1, title: "Layers", fact: `layers · ${LAYERS} here, often dozens in practice`, text: "A stack of identical layers. In each one, every token looks back at the tokens before it (attention) and updates what it means in context. What leaves the top is a summary of the whole context, ready for scoring." },
  { id: "scores", step: 2, title: "Scores", fact: "scores · one per word in the vocabulary", text: "The model gives a score (a logit) to every token it knows, tens of thousands of them. Here only six are shown. A score is not a probability yet: it can be any number, even negative." },
  { id: "temperature", step: 3, title: "Temperature", fact: "temperature · divides every score before softmax", text: "Softmax turns scores into odds that add up to 100%. Before that, every score is divided by the temperature. Below 1 the odds sharpen towards the top word, and above 1 they flatten towards an even spread." },
  { id: "sampler", step: 4, title: "Sampler", fact: "sampler · a random point on the odds", text: "The odds are laid end to end along a tape, so each word gets a length equal to its chance. A random number between 0 and 1 picks a point on the tape, and the word under it is the one written next. Likely words win most draws but not all of them." },
];

const unit = (vector) => {
  const o = at([0, 0, 0]);
  const p = at(vector);
  return [p[0] - o[0], p[1] - o[1]];
};
const DATA = {
  EX: unit([1, 0, 0]), EY: unit([0, 1, 0]), EZ: unit([0, 0, 1]),
  P, words: WORDS, logits: LOGITS, temps: TEMPS, t0: T0, context: CONTEXT,
  steps: STEPS,
  parts: Object.fromEntries(PARTS.map(({ id, step, fact }) => [id, { step, fact }])),
  colX: WORDS.map((_, i) => colX(i)), colY: COL_Y, sleeveH: SLEEVE.h, piston: PISTON, rise: RISE,
  logitFloor: LOGIT_FLOOR, logitScale: LOGIT_SCALE,
  tape: TAPE, slot: [slotX(5), TILE_Y, RAIL_H], slots: [0, 1, 2, 3, 4].map(slotX), candZ: SLEEVE.h,
  knob: KNOB, knobR: KNOB_R, knobZ: KNOB_Z[1], knobAngles: TEMPS.map((_, i) => knobAngle(i)),
};

const live = `
const D = ${JSON.stringify(DATA)};
const LAST = D.steps.length - 1;
const stage = ROOT.querySelector(".iso-stage");
const svgEl = stage.querySelector("svg");
const readout = ROOT.querySelector("[data-readout]");
const liveText = ROOT.querySelector("[data-live]");
const prev = ROOT.querySelector("[data-prev]");
const next = ROOT.querySelector("[data-next]");
const dots = [...ROOT.querySelectorAll("[data-dot]")];
const items = [...ROOT.querySelectorAll("[data-select]")];
const cooler = ROOT.querySelector("[data-cooler]");
const warmer = ROOT.querySelector("[data-warmer]");
const drawButton = ROOT.querySelector("[data-draw]");
const bars = [...ROOT.querySelectorAll("[data-bar]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const N = D.words.length;
const pistons = [...stage.querySelectorAll("[data-piston]")].sort((a, b) => a.dataset.piston - b.dataset.piston);
const tiles = [...stage.querySelectorAll("[data-tile]")].sort((a, b) => a.dataset.tile - b.dataset.tile);
const homes = [...stage.querySelectorAll("[data-home]")].sort((a, b) => a.dataset.home - b.dataset.home);
const dividers = [...stage.querySelectorAll("[data-divider]")].sort((a, b) => a.dataset.divider - b.dataset.divider);
const segs = [...stage.querySelectorAll("[data-seg]")].sort((a, b) => a.dataset.seg - b.dataset.seg);
const segLayer = stage.querySelector("[data-segs]");
const dividerLayer = stage.querySelector("[data-dividers]");
const carriage = stage.querySelector("[data-carriage]");
const head = stage.querySelector("[data-head]");
const caret = stage.querySelector("[data-caret]");
const knobLine = stage.querySelector("[data-knob]");
const fly = stage.querySelector("[data-fly]");
const layers = [...stage.querySelectorAll("[data-layer]")];
const groups = [...stage.querySelectorAll("[data-part]")];

const softmax = (t) => { const top = Math.max(...D.logits); const e = D.logits.map((z) => Math.exp((z - top) / t)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
const pct = (p) => (p >= 0.995 ? "99" : p < 0.005 ? "<1" : Math.round(p * 100)) + "%";
const tText = (t) => "T " + (t < 1 ? t.toFixed(2).replace(/0$/, "") : t.toFixed(1));
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const shift = (dx, dy, dz) => [D.EX[0] * dx + D.EY[0] * dy + D.EZ[0] * dz, D.EX[1] * dx + D.EY[1] * dy + D.EZ[1] * dz];
const setT = (el, [x, y]) => { const t = Math.abs(x) < 0.005 && Math.abs(y) < 0.005 ? "" : "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")"; if (el._t !== t) { el._t = t; t ? el.setAttribute("transform", t) : el.removeAttribute("transform"); } };

let temp = D.t0, probs = softmax(D.temps[temp]);
let step = 0, selected = null, u = 0.5, winner = 0;
let touring = !still.matches, tourClock = 0, idleTimer = 0, visible = false, frame = 0, last = 0, clock = 0;
// eased quantities
const h = D.words.map(() => 0); // piston rise
const cut = D.words.map(() => 0); // divider positions (running totals)
let pin = 0, flight = 0, readAt = 0, segShow = 0;
const pinPos = (n) => (step >= 4 ? u : 0);

function cumulative() { const c = []; let s = 0; for (let i = 0; i < N - 1; i++) { s += probs[i]; c.push(s); } return c; }
function pick(r) { let s = 0; for (let i = 0; i < N; i++) { s += probs[i]; if (r < s) return i; } return N - 1; }

function goals() {
  const g = {};
  g.h = D.words.map((_, i) => (step < 2 ? 0 : step === 2 ? (D.logits[i] - D.logitFloor) * D.logitScale : probs[i] * D.rise));
  g.cut = cumulative();
  g.seg = step >= 3 ? 1 : 0;
  g.pin = step >= 4 ? u : 0;
  g.flight = step >= 5 ? 1 : 0;
  return g;
}

function announce(text) { if (liveText.textContent !== text) liveText.textContent = text; }
const sentence = () => D.context.join(" ") + " " + D.words[winner];
const topList = () => D.words.map((w, i) => [w, probs[i]]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, p]) => w + " " + pct(p)).join(" · ");
function stepText(n) {
  if (n === 2) return "scores · " + D.words.slice(0, 3).map((w, i) => w + " " + D.logits[i].toFixed(1)).join(" · ");
  if (n === 3) return tText(D.temps[temp]) + " · " + topList();
  if (n === 4) return "draw · " + u.toFixed(2) + " → " + D.words[winner];
  if (n === 5) return "“" + sentence() + "”";
  return D.steps[n].say;
}

function setStep(n) {
  n = Math.max(0, Math.min(LAST, n));
  if (n === step) return;
  if (n >= 4 && step < 4) { u = Math.random(); winner = pick(u); }
  if (n < 5) markWinner(false);
  step = n;
  controls();
  if (!touring) announce(stepText(step));
  run();
}

function markWinner(on) {
  tiles.forEach((tile, i) => { const solid = tile.querySelector(".iso-solid"); if (on && i === winner) solid.setAttribute("data-lit", ""); else solid.removeAttribute("data-lit"); });
}

function setTemp(n) {
  n = Math.max(0, Math.min(D.temps.length - 1, n));
  if (n === temp) return;
  temp = n;
  probs = softmax(D.temps[temp]);
  if (step >= 4) winner = pick(u);
  knobLine.setAttribute("d", lineOnTop([D.knob[0] + Math.cos(D.knobAngles[temp]) * 1.4, D.knob[1] + Math.sin(D.knobAngles[temp]) * 1.4], [D.knob[0] + Math.cos(D.knobAngles[temp]) * (D.knobR - 2), D.knob[1] + Math.sin(D.knobAngles[temp]) * (D.knobR - 2)], D.knobZ, D.P));
  if (step < 3) setStep(3);
  controls();
  announce(tText(D.temps[temp]) + " · " + topList());
  run();
}

function draw() {
  hold();
  select(null);
  u = Math.random(); winner = pick(u);
  markWinner(false);
  if (step >= 4) { step = 3; flight = Math.min(flight, 1); }
  setStep(4);
  drawTimer = 1.6;
}
let drawTimer = 0;

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
  cooler.disabled = temp === 0;
  warmer.disabled = temp === D.temps.length - 1;
  ROOT.querySelector("[data-temp]").textContent = tText(D.temps[temp]);
  bars.forEach((bar) => { const i = Number(bar.dataset.bar); bar.style.setProperty("--p", probs[i].toFixed(4)); bar.querySelector("b").textContent = pct(probs[i]); if (step >= 5 && i === winner) bar.setAttribute("data-on", ""); else bar.removeAttribute("data-on"); });
}

// exponential follow: calm, frame-rate independent
const follow = (x, target, rate, dt) => { const nx = target + (x - target) * Math.exp(-rate * dt); return Math.abs(nx - target) < 0.002 ? target : nx; };

function update(dt, calm) {
  const g = goals();
  let busy = false;
  const go = (x, target, rate) => { const nx = calm ? target : follow(x, target, rate, dt); if (nx !== target) busy = true; return nx; };
  for (let i = 0; i < N; i++) h[i] = go(h[i], g.h[i], 6);
  for (let i = 0; i < N - 1; i++) cut[i] = go(cut[i], g.cut[i], 6);
  segShow = go(segShow, g.seg, 8);
  pin = go(pin, g.pin, 3.2);
  // the tile leaves only once the pin has settled
  flight = go(flight, step >= 5 ? (Math.abs(pin - g.pin) < 0.01 ? 1 : 0) : 0, 3.5);
  if (step === 1 && !calm) { readAt = (readAt + dt * 3.2) % 5; busy = true; } else readAt = go(readAt, 0, 6);
  if (drawTimer > 0) { drawTimer -= dt; if (drawTimer <= 0 && step === 4) setStep(5); busy = true; }
  return busy || step === 1;
}

function rebuildPiston(i) {
  const rise = Math.max(0.6, h[i]);
  const key = rise.toFixed(1);
  if (pistons[i]._k === key) return;
  pistons[i]._k = key;
  const plan = { x: D.colX[i] - D.piston.w / 2, y: D.colY - D.piston.d / 2, w: D.piston.w, d: D.piston.d, r: 0.6 };
  pistons[i].innerHTML = solidSvg(slabOf(plan, D.sleeveH - 0.5, rise + 0.5, D.P, 2), { tone: "mid" });
}

function place() {
  for (let i = 0; i < N; i++) rebuildPiston(i);
  // tiles ride on their pistons, or fly to the empty slot
  for (let i = 0; i < N; i++) {
    const rise = Math.max(0.6, h[i]);
    const f = i === winner ? ease(flight) : 0;
    const tile = tiles[i];
    if (f > 0.001) {
      if (tile.parentNode !== fly) fly.appendChild(tile);
      const from = [D.colX[i], D.colY, D.candZ + rise];
      const to = D.slot;
      const lift = Math.sin(Math.PI * f) * 34;
      setT(tile, shift((to[0] - from[0]) * f, (to[1] - from[1]) * f, rise + (to[2] - from[2]) * f + lift));
    } else {
      if (tile.parentNode !== homes[i]) homes[i].appendChild(tile);
      setT(tile, shift(0, 0, rise));
    }
  }
  if (flight > 0.999 && step >= 5) markWinner(true);
  caret.style.opacity = flight > 0.2 ? 0 : 1;
  // the tape: dividers at running totals, words centred in their segments
  dividerLayer.style.opacity = segShow.toFixed(2);
  segLayer.style.opacity = segShow.toFixed(2);
  for (let i = 0; i < N - 1; i++) setT(dividers[i], shift(D.tape.x + cut[i] * D.tape.len, 0, 0));
  for (let i = 0; i < N; i++) {
    const a = i ? cut[i - 1] : 0, b = i < N - 1 ? cut[i] : 1;
    setT(segs[i], shift(D.tape.x + ((a + b) / 2) * D.tape.len, 0, 0));
    segs[i].style.visibility = (b - a) * D.tape.len > D.words[i].length * 2.2 + 2 ? "visible" : "hidden";
  }
  setT(carriage, shift(pin * D.tape.len, 0, 0));
  // the read head sweeps the tiles while reading
  const slot = Math.min(4, readAt);
  setT(head, shift(slot * (D.slots[1] - D.slots[0]), 0, 0));
  const lit = step === 1 ? Math.floor(clock * 6) % layers.length : -1;
  layers.forEach((layer, i) => layer.querySelector(".iso-dots").setAttribute("data-tone", step === 1 && i <= lit ? "hi" : "lo"));
  const text = selected ? D.parts[selected].fact : stepText(step);
  if (readout.textContent !== text) readout.textContent = text;
}

// The idle tour walks the loop: context, read, score, softmax, draw, append, and again.
const TOUR = 2.4;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) {
    tourClock += dt;
    const beat = Math.floor(tourClock / TOUR) % (LAST + 1);
    if (beat !== step) setStep(beat);
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
    if (still.matches || selected || stage.matches(":hover, :focus-within")) return hold();
    touring = true;
    tourClock = step * TOUR;
    run();
  }, 9000);
}
const go = (n) => { hold(); setStep(n); };
const forward = () => go(step === LAST ? 0 : step + 1);

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const partAt = (target) => target.closest && target.closest("[data-part]");
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  hold();
  const g = partAt(event.target);
  select(g ? g.dataset.part : null);
});
stage.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
stage.addEventListener("click", (event) => {
  hold();
  const g = partAt(event.target);
  if (!g) return select(null);
  if (event.pointerType !== "mouse") select(selected === g.dataset.part ? null : g.dataset.part);
});

stage.addEventListener("keydown", (event) => {
  const keys = { ArrowRight: () => go(step + 1), ArrowDown: () => go(step + 1), ArrowLeft: () => go(step - 1), ArrowUp: () => go(step - 1), Home: () => go(0), End: () => go(LAST), " ": forward, Enter: forward, Escape: () => { hold(); select(null); go(0); }, d: draw, D: draw, "[": () => { hold(); setTemp(temp - 1); }, "]": () => { hold(); setTemp(temp + 1); }, "-": () => { hold(); setTemp(temp - 1); }, "=": () => { hold(); setTemp(temp + 1); }, "+": () => { hold(); setTemp(temp + 1); } };
  if (!keys[event.key]) return;
  event.preventDefault();
  keys[event.key]();
});
prev.addEventListener("click", () => go(step - 1));
next.addEventListener("click", forward);
drawButton.addEventListener("click", draw);
cooler.addEventListener("click", () => { hold(); setTemp(temp - 1); });
warmer.addEventListener("click", () => { hold(); setTemp(temp + 1); });

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
update(0, true);
controls();
place();
`;

const plateBody = k.plateHtml({
  fig: "Fig 1",
  title: "Language model · next word",
  hint: "← → step · D draw · [ ] temperature · F expand",
  readout: STEPS[0].say,
  keys: [
    { mark: "lit", label: "The pin: a random number, the only part that chooses" },
    { mark: "raised", label: "Rail, layers, pistons and tape: everything that sets the odds" },
  ],
  caption: `A language model writes one token at a time. It reads the whole context (“${CONTEXT.join(" ")}”) through a stack of layers and gives every word it knows a score. Softmax turns the scores into odds that add up to 100%, after dividing each score by the temperature. Then it draws: the odds are laid end to end along a tape, a random number picks a point, and the word under that point is appended to the context. The loop repeats for the next token. The scores here are toy numbers; the arithmetic is real.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Language model. Arrow keys step through how it picks the next word; D draws a word; [ and ] change the temperature; hover or tap a part to read about it." aria-valuemin="0" aria-valuemax="${STEPS.length - 1}" aria-valuenow="0" aria-valuetext="${STEPS[0].say}">${svg}</div>
<div class="pc-controls"><button type="button" class="pc-btn" data-prev aria-label="Back one step" disabled>←</button><span class="pc-dots" aria-hidden="true">${STEPS.slice(1).map(() => "<i data-dot></i>").join("")}</span><span class="pc-group pc-right"><button type="button" class="pc-btn" data-cooler aria-label="Lower the temperature" aria-keyshortcuts="[">−</button><span data-temp data-value>T 1.0</span><button type="button" class="pc-btn" data-warmer aria-label="Raise the temperature" aria-keyshortcuts="]">+</button></span><button type="button" class="pc-btn" data-draw aria-keyshortcuts="D">Draw</button><button type="button" class="pc-btn pc-next" data-next><span>${STEPS[0].next}</span> →</button>${EXPAND_BUTTON}<span class="pc-live" aria-live="polite" data-live></span></div>`,
});

const odds = `<h4 style="margin:6px 0 0">The odds now</h4><p class="tip">Change the temperature with − and + (or [ and ] while the figure has focus) and watch the spread.</p><ol class="pc-bars" style="margin-bottom:10px">${WORDS.map((w, i) => `<li data-bar="${i}" style="--p:${probs0[i].toFixed(4)}"><span>${w}</span><i></i><b>${Math.round(probs0[i] * 100)}%</b></li>`).join("")}</ol>`;
const html = embedHtml({ slug: "language-model", plate: plateBody, parts: partsHtml(PARTS, { extra: odds }), task: "Turn the temperature down to 0.25 and press Draw five times, then turn it up to 2 and draw five more. Which setting would you want for a support bot, and why?", live });
inject("module-1/index.html", "language-model", html);
preview("language-model", html);
