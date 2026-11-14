// Anatomy of a guardrail, for AI 410 Module 3 (Lecture Part 2). Writes the figure into
// module-3/index.html between its <!-- anatomy:guardrail --> markers.
//
// A go/no-go inspection bench. The model issues a card with the tool's arguments; the card rides
// the back lane under the schema gauge (CalculateArgs, model_validate). A valid card goes on to the
// calculator (the tool runs). An invalid one is turned by the gate onto the return loop, where the
// error clip pins the ValidationError to it (correction_hint) and it goes back into the model for
// another attempt. The lamps on the model count attempts, capped at max_retries + 1. When the last
// attempt fails, the clip pins {"error": ...} instead and the card goes back as data: the request
// stays alive and the model explains, rather than an exception becoming an HTTP 500.
//
// The schema, retry loop and error are the lecture's own (Part 2's call_with_guardrail, HOS 3's
// CalculateArgs). The odds panel is the lecture's arithmetic: 30% of first attempts invalid,
// attempts independent; with the error fed back, the Module 3 simulator's assumption that a retry
// fails 0.3x as often.
import { k, EXPAND_BUTTON, embedHtml, partsHtml, inject, preview } from "../embed.mjs";

// ---------- the model ----------
const RATE = 0.3, FEED_FACTOR = 0.3, MAXR0 = 2, MAXR_TOP = 4;
const GOOD = { args: '{"expression": "25*4"}', ok: true };
const NOKEY = { args: '{"expr": "25*4"}', ok: false, msg: "expression: Field required", tag: "Field required" };
const NUM = { args: '{"expression": 25}', ok: false, msg: "expression: Input should be a valid string", tag: "should be a valid string" };
const EMPTY = { args: "{}", ok: false, msg: "expression: Field required", tag: "Field required" };
const NULL = { args: '{"expression": null}', ok: false, msg: "expression: Input should be a valid string", tag: "should be a valid string" };
// three requests, scripted so a reader sees every outcome. Fed back, an error usually fixes the
// next attempt; blind, the model tends to repeat itself (here, until the third try).
const REQUESTS = [
  { name: "valid first time", feed: [GOOD], blind: [GOOD] },
  { name: "invalid, then fixed", feed: [NOKEY, GOOD], blind: [NOKEY, NOKEY, GOOD] },
  { name: "invalid every time", feed: [NUM, NOKEY, EMPTY, NULL, NOKEY], blind: [NUM, NUM, NUM, NUM, NUM] },
];

// ---------- world ----------
const W = 640, H = 400;
const PLATE = { x: -140, y: -86, w: 268, d: 136, r: 9 };
const PLATE_H = 9, FOOT_H = 5;
const box = (cx, cy, w, d, r = 0.8) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const BASE_H = 2, LIP_H = 2.2; // lane floor, lane lips
const CARD = { w: 30, d: 10, h: 0.8 };
const TAG = { w: 27, d: 4.4, h: 0.4 };
// the model, back left
const MODEL = { x: -132, y: -74, w: 46, d: 44, r: 3 };
const MODEL_H = 24;
const LAMP_X = (i) => -126 + i * 8, LAMP_Y = -38, LAMP_R = 2.2;
// lanes: forward (back), the gate's cross lane (right), return (front), the cross lane home (left)
const FWD = { x: -86, y: -54, w: 156, d: 14, r: 0.6 };
const CR = { x: -2, y: -40, w: 32, d: 54, r: 0.6 };
const RET = { x: -118, y: 14, w: 148, d: 14, r: 0.6 };
const CL = { x: -118, y: -30, w: 32, d: 44, r: 0.6 };
const FY = -47, RY = 21, CRX = 14, CLX = -102;
// schema gauge over the forward lane
const GX = -36;
const BEAM = { x: GX - 4, y: -62, w: 8, d: 30, r: 0.8 };
const BEAM_Z = 22, BEAM_H = 5;
const ROD = { r: 1.3, foot: 2.8, up: 10, down: BASE_H + CARD.h + 0.2 };
// the gate: a blade pivoting at the back corner of the junction
const PIVOT = [CR.x - 1, FWD.y + 1.6];
const BLADE = { len: 34, t: 1.2, h: 3.2, deflect: (22 * Math.PI) / 180 };
// the tool, back right
const TOOL = { x: 72, y: -68, w: 40, d: 36, r: 3 };
const TOOL_H = 14;
// error clip over the return lane
const CX = -64;
const CBEAM = { x: CX - 4, y: 6, w: 8, d: 30, r: 0.8 };
const CBEAM_Z = 22, CBEAM_H = 5;
const RAM = { plan: box(CX, RY, 16, 8, 1), h: 4, up: 11, down: BASE_H + CARD.h + TAG.h };
// schema plaque, inside the loop, in front of the gauge
const PLAQ = { x: -68, y: -35, w: 62, d: 21, r: 1.4 };
const PLAQ_H = 1.4;
// feed lever, in front of the clip
const LEVER = { x: -82, y: 34, w: 36, d: 6, r: 1 };
const LEVER_X = [LEVER.x + 7, LEVER.x + LEVER.w - 7]; // FEED, BLIND

// tally counters, front right: how each request ended
const TALLY = { x: 44, y: -6, w: 70, d: 22, r: 2 };
const TALLY_H = 7;
const TALLY_X = [TALLY.x + 13, TALLY.x + 35, TALLY.x + 57];

// routes the card rides (plan points at lane height)
const FWD_ROUTE = [[-71, FY], [GX, FY], [CRX, FY], [52, FY]];
const REJ_ROUTE = [[GX, FY], [CRX, FY], [CRX, RY], [CX, RY], [CLX, RY], [CLX, -21]];
const lengthOf = (route) => route.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - route[i][0], p[1] - route[i][1]), 0);
const D_GAUGE = GX - FWD_ROUTE[0][0], D_PLATEN = lengthOf(FWD_ROUTE);
const D_JUNC = CRX - GX, D_CLIP = lengthOf(REJ_ROUTE.slice(0, 4)), D_HOME = lengthOf(REJ_ROUTE);

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [BEAM.x, BEAM.y, BEAM_Z + BEAM_H + 3], [MODEL.x, MODEL.y, MODEL_H + 2], [CBEAM.x, CBEAM.y + CBEAM.d, CBEAM_Z + CBEAM_H + 4]],
  W, H, { pad: 16 },
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
const alongY = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.topMatrix([x, y], z, P, "y"), text, { size, tone, anchor });
const frontText = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "left"), text, { size, tone, anchor });
const rightText = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), text, { size, tone, anchor });
const slotOn = (pts) => L(k.pathOf(pts.map(at), true), { tone: "hi" });

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
  // the two outcomes, engraved beside their lanes
  out.push(topText(34, -34.5, 0, "VALID → RUN THE TOOL", 2.6, "lo"));
  out.push(topText(-12, 33.5, 0, "INVALID → RETRY WITH THE ERROR", 2.6, "lo"));
  // label plate, front right
  const label = { x: 58, y: 28, w: 56, d: 15, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(topText(label.x + 5, label.y + 7, 0.8, "HOS 3 · GUARDRAIL", 3, "mid"));
  out.push(topText(label.x + 5, label.y + 12, 0.8, "guardrails.py", 2.4, "lo"));
  out.push(L(k.lineOnTop([label.x + 25, label.y + 11.2], [label.x + 52, label.y + 11.2], 0.8, P), { tone: "faint", free: true }));
  out.push(screws([[label.x + 2.6, label.y + 2.6], [label.x + label.w - 2.6, label.y + label.d - 2.6]], 0.8, 0.4));
  return out.join("");
}

// ---------- the model ----------
function model() {
  const out = [S(k.slabOf(MODEL, 0, MODEL_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(MODEL, MODEL_H - 4, P, 5), { tone: "faint" }) })];
  // vents along the back of the top
  out.push(L([0, 1, 2, 3, 4].map((j) => k.planOutline({ x: MODEL.x + 7, y: MODEL.y + 6 + j * 4, w: 20, d: 1.6, r: 0.6 }, MODEL_H, P, 2)).join(""), { tone: "lo" }));
  out.push(topText(MODEL.x + 31, MODEL.y + 11, MODEL_H, "MODEL", 3, "mid"));
  out.push(L(k.lineOnTop([MODEL.x + 31, MODEL.y + 13], [MODEL.x + 42, MODEL.y + 13], MODEL_H, P), { tone: "faint", free: true }));
  // the out slot on the right face (tool args leave here) and the in slot on the front (they come back)
  const rx = MODEL.x + MODEL.w;
  out.push(slotOn([[rx, FWD.y + 1.5, BASE_H + 0.4], [rx, FWD.y + FWD.d - 1.5, BASE_H + 0.4], [rx, FWD.y + FWD.d - 1.5, BASE_H + 2.4], [rx, FWD.y + 1.5, BASE_H + 2.4]]));
  const fy = MODEL.y + MODEL.d;
  out.push(slotOn([[CL.x + 1.5, fy, BASE_H + 0.4], [CL.x + CL.w - 1.5, fy, BASE_H + 0.4], [CL.x + CL.w - 1.5, fy, BASE_H + 2.4], [CL.x + 1.5, fy, BASE_H + 2.4]]));
  out.push(frontText(MODEL.x + 4, fy, 6.4, "IN", 2.2, "lo"));
  out.push(rightText(rx, FWD.y - 2, 6.4, "OUT", 2.2, "lo", "start"));
  out.push(screws(k.corners(MODEL, 3), MODEL_H, 0.45));
  return out.join("");
}
// attempt lamps on the model's top, one per allowed attempt (max_retries + 1)
function lamps() {
  const out = [topText(MODEL.x + 4, LAMP_Y - 4.6, MODEL_H, "ATTEMPT", 2.2, "lo")];
  for (let i = 0; i <= MAXR_TOP; i++) {
    out.push(`<g data-lamp="${i}">${S(k.cylinder(LAMP_X(i), LAMP_Y, LAMP_R, MODEL_H, 1.4, P, 20), { tone: "mid" })}</g>`);
    out.push(topText(LAMP_X(i), LAMP_Y + 6.4, MODEL_H, String(i + 1), 2.2, "lo", "middle"));
  }
  out.push(L(k.lineOnTop([LAMP_X(0) - 3, LAMP_Y + 7.6], [LAMP_X(MAXR_TOP) + 3, LAMP_Y + 7.6], MODEL_H, P), { tone: "faint" }) + screws([[LAMP_X(0) - 3, LAMP_Y + 7.6], [LAMP_X(MAXR_TOP) + 3, LAMP_Y + 7.6]], MODEL_H, 0.35));
  return out.join("");
}

// ---------- lanes ----------
// roller lines across a lane, every 5 units along it, ending on the lips
function rollers(along, from, to, a, b) {
  const d = [];
  for (let t = from; t <= to; t += 5) d.push(along === "x" ? k.lineOnTop([t, a], [t, b], BASE_H, P) : k.lineOnTop([a, t], [b, t], BASE_H, P));
  return L(d.join(""), { tone: "faint" });
}
// where two lanes meet, a turntable turns the card without turning it round
const turntable = (cx, cy) => L(k.ring(cx, cy, 5.5, BASE_H, P, 28), { tone: "faint" }) + L(k.ring(cx, cy, 1.6, BASE_H, P, 14), { tone: "lo" }) + Dt([at([cx, cy, BASE_H])], { size: 0.4 });
const lip = (plan) => S(k.slabOf({ ...plan, r: 0.4 }, BASE_H, LIP_H, P, 1), { tone: "mid" });
function forwardLane() {
  const out = [S(k.slabOf(FWD, 0, BASE_H, P, 2), { tone: "mid" })];
  out.push(rollers("x", FWD.x + 5, CR.x - 2, FWD.y + 1.6, FWD.y + FWD.d - 1.6), rollers("x", CR.x + CR.w + 3, FWD.x + FWD.w - 4, FWD.y + 1.6, FWD.y + FWD.d - 1.6));
  out.push(turntable(CRX, FY));
  out.push(lip({ x: FWD.x, y: FWD.y, w: FWD.w, d: 1.6 }));
  out.push(lip({ x: FWD.x, y: FWD.y + FWD.d - 1.6, w: CR.x - FWD.x, d: 1.6 }));
  out.push(lip({ x: CR.x + CR.w, y: FWD.y + FWD.d - 1.6, w: FWD.x + FWD.w - CR.x - CR.w, d: 1.6 }));
  out.push(lip({ x: FWD.x + FWD.w - 1.6, y: FWD.y + 1.6, w: 1.6, d: FWD.d - 3.2 }));
  // the platen in front of the tool
  out.push(L(k.planOutline(box(52, FY, CARD.w + 3, CARD.d + 2, 0.6), BASE_H, P, 2), { tone: "lo" }));
  out.push(screws([[FWD.x + 4, FY], [CR.x - 4, FY]], BASE_H, 0.35));
  return out.join("");
}
function returnLanes() {
  const out = [S(k.slabOf(CL, 0, BASE_H, P, 2), { tone: "mid" }), S(k.slabOf(CR, 0, BASE_H, P, 2), { tone: "mid" }), S(k.slabOf(RET, 0, BASE_H, P, 2), { tone: "mid" })];
  // rollers across each lane
  out.push(rollers("y", CR.y + 3, RET.y - 2, CR.x + 1.6, CR.x + CR.w - 1.6));
  out.push(rollers("y", CL.y + 3, RET.y - 2, CL.x + 1.6, CL.x + CL.w - 1.6));
  out.push(rollers("x", CL.x + CL.w + 3, CR.x - 2, RET.y + 1.6, RET.y + RET.d - 1.6));
  out.push(turntable(CLX, RY), turntable(CRX, RY));
  // lips on the outer edges, and the inner ones between the lanes
  out.push(lip({ x: CR.x + CR.w - 1.6, y: CR.y, w: 1.6, d: RET.y + RET.d - CR.y }));
  out.push(lip({ x: CR.x, y: CR.y, w: 1.6, d: RET.y - CR.y }));
  out.push(lip({ x: CL.x + CL.w - 1.6, y: CL.y, w: 1.6, d: RET.y - CL.y }));
  out.push(lip({ x: CL.x + CL.w, y: RET.y, w: CR.x - CL.x - CL.w, d: 1.6 }));
  out.push(lip({ x: CL.x, y: CL.y, w: 1.6, d: RET.y + RET.d - CL.y }));
  out.push(lip({ x: CL.x + 1.6, y: RET.y + RET.d - 1.6, w: CR.x + CR.w - CL.x - 3.2, d: 1.6 }));
  out.push(screws([[CRX, CR.y + 4], [CLX, CL.y + 4], [CR.x + 6, RY], [CL.x + CL.w - 6, RY]], BASE_H, 0.35));
  return out.join("");
}

// ---------- the schema gauge ----------
const post = (cx, cy, z1) => S(k.slabOf(box(cx, cy, 6, 4, 0.8), 0, z1, P, 2, 0.4), { tone: "mid" });
function gaugeBack() {
  return post(GX, BEAM.y + 2, BEAM_Z) + S(k.slabOf(box(GX, BEAM.y + 2, 9, 7, 1), 0, 1.2, P, 2), { tone: "lo" });
}
function gaugeFront() {
  const out = [post(GX, BEAM.y + BEAM.d - 2, BEAM_Z)];
  out.push(S(k.slabOf(BEAM, BEAM_Z, BEAM_H, P, 2, 0.5), { tone: "mid", inner: L(k.sideSeam(BEAM, BEAM_Z + 1.6, P, 2), { tone: "faint" }) }));
  out.push(L(k.ring(GX, FY, ROD.r + 0.8, BEAM_Z + BEAM_H, P, 18), { tone: "lo" }) + screws([[GX, BEAM.y + 2], [GX, BEAM.y + BEAM.d - 2]], BEAM_Z + BEAM_H, 0.45));
  out.push(rightText(BEAM.x + BEAM.w, BEAM.y + BEAM.d - 2.5, BEAM_Z + 1.4, "model_validate()", 2.2, "mid"));
  // knurled adjuster on top of the rod
  out.push(`<g data-cap>${S(k.cylinder(GX, FY, 2.4, BEAM_Z + BEAM_H, 2.2, P, 24), { tone: "mid" }) + L(k.knurl(GX, FY, 2.4, BEAM_Z + BEAM_H, BEAM_Z + BEAM_H + 2.2, 18, P), { tone: "lo" })}</g>`);
  return out.join("");
}
// the feeler rod and its foot, rebuilt live as it drops
const rodSvg = (bottom) => S(k.cylinder(GX, FY, ROD.r, bottom + 1, BEAM_Z - bottom - 1, P, 14), { tone: "mid" }) + S(k.cylinder(GX, FY, ROD.foot, bottom, 1, P, 20), { tone: "hi" });
function plaque() {
  const out = [S(k.slabOf(PLAQ, 0, PLAQ_H, P, 3), { tone: "mid", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(PLAQ, 1.6), PLAQ_H, P, 3), { tone: "faint" }));
  const z = PLAQ_H, x = PLAQ.x + 5;
  out.push(topText(x, PLAQ.y + 6.6, z, "class CalculateArgs(BaseModel):", 2, "mid"));
  out.push(topText(x + 4, PLAQ.y + 10.8, z, "expression: str", 2.2, "hi"));
  out.push(topText(x + 4, PLAQ.y + 14.6, z, "# must exist, must be a string", 1.9, "lo"));
  out.push(topText(x, PLAQ.y + 19, z, `max_retries = ${MAXR0}`, 2.2, "mid", "start", " data-maxr"));
  // verdict lamps on the right of the plaque
  const lx = PLAQ.x + PLAQ.w - 13;
  for (const [i, y, text] of [[0, PLAQ.y + 6.5, "GO"], [1, PLAQ.y + 15.5, "NO-GO"]]) {
    out.push(L(k.ring(lx, y, 3.2, z, P, 20), { tone: "lo" }));
    out.push(`<g data-verdict="${i}">${S(k.cylinder(lx, y, 2.2, z, 1.2, P, 20), { tone: "mid" })}</g>`);
    out.push(topText(lx + 5, y + 1, z, text, 2.2, "lo", "start", ` data-verdict-text="${i}"`));
  }
  out.push(screws(k.corners(PLAQ, 2.6), PLAQ_H, 0.4));
  return out.join("");
}

// ---------- the gate ----------
function bladeRing(angle) {
  const [px, py] = PIVOT, c = Math.cos(angle), s = Math.sin(angle), t = BLADE.t;
  const n = [-s, c];
  const a = [px - n[0] * t / 2, py - n[1] * t / 2];
  const b = [a[0] + c * BLADE.len, a[1] + s * BLADE.len];
  return [a, b, [b[0] + n[0] * t, b[1] + n[1] * t], [a[0] + n[0] * t, a[1] + n[1] * t]];
}
const bladeSvg = (angle) => S(k.extrude(bladeRing(angle), BASE_H, BLADE.h, P), { tone: "hi" });
function pivot() {
  const [px, py] = PIVOT;
  return S(k.cylinder(px, py, 2, BASE_H, BLADE.h + 1.6, P, 18), { tone: "mid" }) + Dt([at([px, py, BASE_H + BLADE.h + 1.6])], { size: 0.45 });
}

// ---------- the tool ----------
function tool() {
  const out = [S(k.slabOf(TOOL, 0, TOOL_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(TOOL, 3, P, 5), { tone: "faint" }) })];
  const win = { x: TOOL.x + 6, y: TOOL.y + 5, w: 28, d: 9, r: 0.8 };
  out.push(S(k.slabOf(win, TOOL_H, 0.6, P, 2), { tone: "lo", crease: "none" }));
  out.push(topText(win.x + win.w - 2.5, win.y + 6.6, TOOL_H + 0.6, "—", 4, "lo", "end", " data-result"));
  out.push(Dt([0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => at([TOOL.x + 10 + c * 6, TOOL.y + 19 + r * 3.6, TOOL_H]))), { size: 0.6 }));
  out.push(frontText(TOOL.x + 5, TOOL.y + TOOL.d, 5, "calculate()", 2.8, "mid"));
  out.push(screws(k.corners(TOOL, 3), TOOL_H, 0.45));
  return out.join("");
}

// ---------- the error clip ----------
function clipBack() {
  return post(CX, CBEAM.y + 2, CBEAM_Z) + S(k.slabOf(box(CX, CBEAM.y + 2, 9, 7, 1), 0, 1.2, P, 2), { tone: "lo" });
}
function clipFront() {
  const out = [post(CX, CBEAM.y + CBEAM.d - 2, CBEAM_Z), S(k.slabOf(box(CX, CBEAM.y + CBEAM.d - 2, 9, 7, 1), 0, 1.2, P, 2), { tone: "lo" })];
  out.push(S(k.slabOf(CBEAM, CBEAM_Z, CBEAM_H, P, 2, 0.5), { tone: "mid", inner: L(k.sideSeam(CBEAM, CBEAM_Z + 1.6, P, 2), { tone: "faint" }) }));
  out.push(rightText(CBEAM.x + CBEAM.w, CBEAM.y + CBEAM.d - 2.5, CBEAM_Z + 1.4, "correction_hint", 2.2, "mid"));
  // two magazines on the beam: hint tags (back) and {"error"} tags (front)
  for (const [cy, n] of [[CBEAM.y + 8, 6], [CBEAM.y + 22, 4]]) {
    const mag = box(CX, cy, 6.4, 9, 0.6);
    for (let j = 0; j < n; j++) out.push(S(k.slabOf(mag, CBEAM_Z + CBEAM_H + j * 0.7, 0.6, P, 1), { tone: j === n - 1 ? "hi" : "mid", crease: "none" }));
  }
  return out.join("");
}
const ramSvg = (bottom) =>
  S(k.cylinder(CX, RY, 1.2, bottom + RAM.h, CBEAM_Z - bottom - RAM.h, P, 14), { tone: "mid" }) +
  S(k.slabOf(RAM.plan, bottom, RAM.h, P, 2, 0.4), { tone: "mid" }) + screws([[RAM.plan.x + 2, RY], [RAM.plan.x + RAM.plan.w - 2, RY]], bottom + RAM.h, 0.35);
function lever() {
  const out = [S(k.slabOf(LEVER, 0, 1, P, 2), { tone: "mid" })];
  out.push(L(k.lineOnTop([LEVER_X[0], LEVER.y + LEVER.d / 2], [LEVER_X[1], LEVER.y + LEVER.d / 2], 1, P), { tone: "faint" }) + screws([[LEVER_X[0], LEVER.y + LEVER.d / 2], [LEVER_X[1], LEVER.y + LEVER.d / 2]], 1, 0.35));
  out.push(topText(LEVER.x, LEVER.y + LEVER.d + 4, 0, "FEED", 2.4, "hi", "start", " data-feed-text"));
  out.push(topText(LEVER.x + LEVER.w, LEVER.y + LEVER.d + 4, 0, "BLIND", 2.4, "lo", "end", " data-blind-text"));
  return out.join("");
}
const leverKnob = () => S(k.slabOf(box(LEVER_X[0], LEVER.y + LEVER.d / 2, 4, 4.4, 0.8), 1, 2.2, P, 2, 0.3), { tone: "hi" });

// ---------- the tally ----------
function tally() {
  const out = [S(k.slabOf(TALLY, 0, TALLY_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(TALLY, 2, P, 4), { tone: "faint" }) })];
  const labels = ["FIRST TRY", "RETRIED", "{ERROR}"];
  TALLY_X.forEach((cx, i) => {
    const win = box(cx, TALLY.y + 8, 16, 7.4, 0.6);
    out.push(S(k.slabOf(win, TALLY_H, 0.5, P, 2), { tone: "lo", crease: "none" }));
    out.push(topText(cx + 6.6, win.y + 5.6, TALLY_H + 0.5, "000", 3, "hi", "end", ` data-count="${i}"`));
    out.push(topText(cx, TALLY.y + 17.4, TALLY_H, labels[i], 2, "lo", "middle"));
    // the reset button beside each wheel
    out.push(S(k.cylinder(cx + 9.6, TALLY.y + 4, 1.2, TALLY_H, 1, P, 14), { tone: "mid" }));
  });
  out.push(L(k.lineOnTop([TALLY.x + 3, TALLY.y + 13.4], [TALLY.x + TALLY.w - 3, TALLY.y + 13.4], TALLY_H, P), { tone: "faint" }) + screws([[TALLY.x + 3, TALLY.y + 13.4], [TALLY.x + TALLY.w - 3, TALLY.y + 13.4]], TALLY_H, 0.4));
  return out.join("");
}

// ---------- the card ----------
function card() {
  const plan = box(0, 0, CARD.w, CARD.d, 0.5), top = BASE_H + CARD.h;
  const tag = { x: -TAG.w / 2, y: 0.4, w: TAG.w, d: TAG.d, r: 0.3 };
  return S(k.slabOf(plan, BASE_H, CARD.h, P, 1), { tone: "hi", crease: "none", inner: topText(plan.x + 2, -1, top, "", 1.8, "hi", "start", " data-args") }) +
    `<g data-tag>${S(k.slabOf(tag, top, TAG.h, P, 1), { tone: "mid", crease: "none", inner: topText(tag.x + 1.4, tag.y + 3.2, top + TAG.h, "", 1.6, "hi", "start", " data-tagtext") })}</g>`;
}

// ---------- assemble ----------
const part = (id, svg) => `<g data-part="${id}">${svg}</g>`;
const FIGURE_LABEL = `A go/no-go inspection bench for a tool call. A model box at the back left issues a card printed with the tool's arguments. The card rides a lane under a schema gauge marked CalculateArgs: expression must exist and be a string. A valid card goes on to a calculator, which runs. An invalid card is turned by a gate onto a return loop, passes an error clip that pins the validation error to it, and goes back into the model for another attempt. Lamps on the model count attempts, up to max_retries plus one. After the last failed attempt, the clip pins an error tag instead and the card returns as data, so the request stays alive.`;

const BODY = [
  plate(),
  part("model", model()),
  part("counter", lamps()),
  part("gauge", gaugeBack() + plaque()),
  forwardLane(),
  part("gate", pivot() + `<g data-blade>${bladeSvg(0)}</g>`),
  `<g data-slot="a"><g data-card>${card()}</g></g>`,
  part("gauge", `<g data-rod>${rodSvg(ROD.up)}</g>` + gaugeFront()),
  part("tool", tool()),
  returnLanes(),
  part("tally", tally()),
  part("clip", clipBack() + lever() + `<g data-knob>${leverKnob()}</g>`),
  `<g data-slot="b"></g>`,
  part("clip", `<g data-ram>${ramSvg(RAM.up)}</g>` + clipFront()),
];
const svg = k.figureSvg({ width: W, height: H, label: FIGURE_LABEL, body: BODY });

// ---------- parts ----------
const PARTS = [
  { id: "model", phase: "issue", title: "Model", fact: "model · each attempt is another roll", text: "Gemini decides the tool's arguments. It is nondeterministic, so the same request can come back valid one time and malformed the next. Each card it issues is one attempt." },
  { id: "gauge", phase: "check", title: "Schema gauge", fact: "CalculateArgs · expression must exist, must be a string", text: "model_validate() checks the arguments against a Pydantic schema before anything runs. HOS 3's CalculateArgs only checks shape: \"25*4\" passes even if the user asked for 25 + 4. A schema can't check meaning." },
  { id: "gate", phase: "reject", title: "Gate", fact: "gate · valid → tool, invalid → retry", text: "A valid card goes straight on to the tool. An invalid one never reaches it: the gate turns it onto the return loop." },
  { id: "tool", phase: "run", title: "Tool", fact: "calculate() · only ever sees valid arguments", text: "Your calculate function. Without the guardrail, malformed arguments reach it, it raises, and the user gets an HTTP 500." },
  { id: "clip", phase: "hint", title: "Error clip", fact: "correction_hint · the error goes back with the retry", text: "Pins the ValidationError to the card, so the next attempt sees what was wrong. Set the lever to BLIND and it sends the same request again, which tends to repeat the mistake. After the last attempt it pins {\"error\": …} instead." },
  { id: "tally", phase: "run", title: "Tally", fact: "tally · first try · retried · {\"error\"}", text: "Counts how each request ended. Set retries to 1 and switch on blind retries: request 2 no longer recovers and lands in {ERROR}, while with the error fed back it still does." },
  { id: "counter", phase: "fail", title: "Retry cap", fact: "max_retries · at most max_retries + 1 calls", text: "One lamp per attempt. Capping retries bounds the cost: an unbounded loop turns one bad request into a stuck server and a large bill. When the cap is reached, the guardrail fails to data: it returns {\"error\": …} and the model explains, instead of raising." },
];

const unit = (vector) => { const o = at([0, 0, 0]); const p = at(vector); return [p[0] - o[0], p[1] - o[1]]; };
const DATA = {
  EX: unit([1, 0, 0]), EY: unit([0, 1, 0]), EZ: unit([0, 0, 1]),
  P, rate: RATE, feedFactor: FEED_FACTOR, maxr0: MAXR0, maxrTop: MAXR_TOP,
  requests: REQUESTS,
  fwd: FWD_ROUTE, rej: REJ_ROUTE, dGauge: D_GAUGE, dPlaten: D_PLATEN, dJunc: D_JUNC, dClip: D_CLIP, dHome: D_HOME,
  rod: ROD, ram: RAM, gx: GX, fy: FY, cx: CX, ry: RY, beamZ: BEAM_Z, cbeamZ: CBEAM_Z,
  pivot: PIVOT, blade: BLADE, baseH: BASE_H, lever: LEVER_X,
  parts: Object.fromEntries(PARTS.map(({ id, phase, fact }) => [id, { phase, fact }])),
};

const live = `
const D = ${JSON.stringify(DATA)};
const stage = ROOT.querySelector(".iso-stage");
const readout = ROOT.querySelector("[data-readout]");
const liveText = ROOT.querySelector("[data-live]");
const prev = ROOT.querySelector("[data-prev]");
const next = ROOT.querySelector("[data-next]");
const items = [...ROOT.querySelectorAll("[data-select]")];
const fewer = ROOT.querySelector("[data-fewer]");
const more = ROOT.querySelector("[data-more]");
const feedButton = ROOT.querySelector("[data-feed]");
const nextReq = ROOT.querySelector("[data-request]");
const odds = [...ROOT.querySelectorAll("[data-odds]")];
const callsLine = ROOT.querySelector("[data-calls]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const slotA = stage.querySelector('[data-slot="a"]'), slotB = stage.querySelector('[data-slot="b"]');
const cardEl = stage.querySelector("[data-card]");
const argsEl = cardEl.querySelector("[data-args]");
const tagEl = cardEl.querySelector("[data-tag]");
const tagText = cardEl.querySelector("[data-tagtext]");
const tagSolid = tagEl.querySelector(".iso-solid");
const rodEl = stage.querySelector("[data-rod]");
const capEl = stage.querySelector("[data-cap]");
const bladeEl = stage.querySelector("[data-blade]");
const ramEl = stage.querySelector("[data-ram]");
const knobEl = stage.querySelector("[data-knob]");
const feedText = stage.querySelector("[data-feed-text]");
const blindText = stage.querySelector("[data-blind-text]");
const resultEl = stage.querySelector("[data-result]");
const maxrEl = stage.querySelector("[data-maxr]");
const lampEls = [...stage.querySelectorAll("[data-lamp]")].sort((a, b) => a.dataset.lamp - b.dataset.lamp);
const verdictEls = [...stage.querySelectorAll("[data-verdict]")].sort((a, b) => a.dataset.verdict - b.dataset.verdict);
const verdictTexts = [...stage.querySelectorAll("[data-verdict-text]")].sort((a, b) => a.dataset.verdictText - b.dataset.verdictText);
const groups = [...stage.querySelectorAll("[data-part]")];
const countEls = [...stage.querySelectorAll("[data-count]")].sort((a, b) => a.dataset.count - b.dataset.count);
const counts = [0, 0, 0];
function tallyUp() {
  const p = cur();
  const i = p.k === "run" ? (p.a === 0 ? 0 : 1) : 2;
  counts[i] = (counts[i] + 1) % 1000;
  countEls[i].textContent = String(counts[i]).padStart(3, "0");
}

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const shift = (dx, dy, dz) => [D.EX[0] * dx + D.EY[0] * dy + D.EZ[0] * dz, D.EX[1] * dx + D.EY[1] * dy + D.EZ[1] * dz];
const setT = (el, [x, y]) => { const t = Math.abs(x) < 0.005 && Math.abs(y) < 0.005 ? "" : "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")"; if (el._t !== t) { el._t = t; t ? el.setAttribute("transform", t) : el.removeAttribute("transform"); } };
const setO = (el, o) => { const v = o >= 0.999 ? "" : o.toFixed(2); if (el._o !== v) { el._o = v; el.style.opacity = v; } };
const setLit = (el, on) => { const s = el.querySelector(".iso-solid") || el; if (on) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit"); };
const follow = (x, target, rate, dt) => { const nx = target + (x - target) * Math.exp(-rate * dt); return Math.abs(nx - target) < 0.01 ? target : nx; };
function pointOn(route, dist) {
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1], [bx, by] = route[i], len = Math.hypot(bx - ax, by - ay);
    if (dist <= len || i === route.length - 1) { const f = Math.max(0, Math.min(1, dist / len)); return [ax + (bx - ax) * f, ay + (by - ay) * f]; }
    dist -= len;
  }
}

let req = 0, feed = true, maxr = D.maxr0, phases = [], ph = 0, selected = null;
let touring = !still.matches, tourClock = 0, idleTimer = 0, visible = false, frame = 0, last = 0;
let dist = 0, route = "fwd", appear = 1, rod = 0, blade = 0, ram = 0, knob = 0, tagOn = 0, shown = -1, stampT = 0;

function build() {
  const script = D.requests[req][feed ? "feed" : "blind"];
  phases = [];
  for (let a = 0; a <= maxr; a++) {
    const c = script[Math.min(a, script.length - 1)];
    phases.push({ k: "issue", a, c }, { k: "check", a, c });
    if (c.ok) { phases.push({ k: "run", a, c }); break; }
    if (a < maxr) phases.push({ k: "reject", a, c }, { k: "hint", a, c }, { k: "back", a, c });
    else phases.push({ k: "reject", a, c, last: true }, { k: "fail", a, c, last: true }, { k: "back", a, c, last: true });
  }
}
const cur = () => phases[ph];
const tries = () => maxr + 1;
const NEXT = { issue: "Validate", check: (p) => (p.c.ok ? "Run the tool" : "Turn it back"), run: "Next request", reject: (p) => (p.last ? "Return the error" : feed ? "Clip the error on" : "Send it back blind"), hint: "Back to the model", fail: "Back to the model", back: (p) => (p.last ? "Next request" : "Try again") };
// short for the readout corner; long (whole messages) for the stage and screen readers
function phaseText(p, long) {
  const n = p.a + 1;
  if (p.k === "issue") return "try " + n + "/" + tries() + " · " + p.c.args;
  if (p.k === "check") return p.c.ok ? "validate · ✓ CalculateArgs" : "validate · ✗ " + (long ? p.c.msg : p.c.tag);
  if (p.k === "run") return "calculate(\\"25*4\\") → 100" + (p.a ? " · try " + n : "");
  if (p.k === "reject") return p.last ? "invalid · no retries left" : "invalid · try " + (n + 1) + "/" + tries() + " next";
  if (p.k === "hint") return feed ? (long ? "correction_hint = \\"" + p.c.msg + "\\"" : "correction_hint = str(e)") : "blind · same request, no hint";
  if (p.k === "fail") return long ? 'return {"error": "could not get a valid response"}' : 'return {"error": …}, no raise';
  return p.last ? "fail to data · no HTTP 500" : "back to the model · try " + (n + 1);
}
function goals() {
  const p = cur(), fwd = p.k === "issue" || p.k === "check" || p.k === "run";
  return {
    route: fwd ? "fwd" : "rej",
    // at the clip: stop under it, and once the tag is on, move clear of it so the tag can be read
    dist: p.k === "issue" ? 0 : p.k === "check" ? D.dGauge : p.k === "run" ? D.dPlaten : p.k === "back" ? D.dHome : p.k === "reject" ? D.dClip : stampT > 0.9 || (p.k === "hint" && !feed) ? D.dClip + 20 : D.dClip,
    blade: (p.k === "check" && !p.c.ok) || p.k === "reject" ? 1 : 0,
    ram: (p.k === "hint" && feed) || p.k === "fail" ? 1 : 0,
  };
}
function announce(text) { if (liveText.textContent !== text) liveText.textContent = text; }

function setPhase(n, quiet) {
  n = Math.max(0, Math.min(phases.length - 1, n));
  const was = cur();
  ph = n;
  const p = cur(), g = goals();
  // a new card, or a jump to the other route: place the card there at once
  if (p.k === "issue" || !was || g.route !== route || Math.abs(was.a - p.a) > 0 || (was.k === "back" && p.k !== "back")) {
    if (p.k === "issue") { appear = 0; dist = 0; }
    else dist = g.dist;
    route = g.route;
  }
  if (p.k === "issue" || p.k === "check" || p.k === "run" || p.k === "reject") tagOn = 0;
  stampT = p.k === "back" ? 1 : 0;
  if ((p.k === "hint" || p.k === "fail") && was && was.k === "back") { stampT = 1; tagOn = 1; dist = D.dClip + 20; }
  // a request that just ended (forward onto its last phase) adds to the tally
  if (was && n === phases.length - 1 && ph !== -1 && was !== p && phases.indexOf(was) === n - 1) tallyUp();
  if (p.k === "back") tagOn = feed || p.last ? 1 : 0;
  argsEl.textContent = p.c.args;
  tagText.textContent = p.last ? '{"error": …}' : p.c.tag || "";
  controls();
  if (!quiet && !touring) announce(phaseText(p, true));
  run();
}
function setRequest(n) {
  req = (n + D.requests.length) % D.requests.length;
  build();
  setPhase(0, true);
  shown = -1;
}
function setMaxr(n) {
  n = Math.max(0, Math.min(D.maxrTop, n));
  if (n === maxr) return;
  maxr = n;
  build();
  setPhase(Math.min(ph, phases.length - 1), true);
  fillOdds();
  controls();
  announce("max_retries = " + maxr + " · " + callsText());
}
function setFeed(on) {
  if (on === feed) return;
  feed = on;
  build();
  setPhase(Math.min(ph, phases.length - 1), true);
  fillOdds();
  controls();
  announce((feed ? "feed the error back" : "blind retries") + " · " + callsText());
}

// the lecture's arithmetic: first attempts invalid 30% of the time; with the error fed back,
// the simulator's assumption that a retry fails 0.3x as often
function shares() {
  const p = D.rate, q = feed ? D.rate * D.feedFactor : D.rate;
  const failAll = p * Math.pow(q, maxr);
  let calls = 1, reach = p;
  for (let i = 1; i <= maxr; i++) { calls += reach; reach *= q; }
  return { first: 1 - p, recovered: p - failAll, failAll, calls };
}
const pct = (x) => (x >= 0.1 ? Math.round(x * 100) + "%" : x >= 0.001 ? (x * 100).toFixed(1) + "%" : "<0.1%");
function callsText() { const s = shares(); return s.calls.toFixed(2) + " calls per request on average, " + tries() + " at most; " + pct(s.failAll) + " still fail"; }
function fillOdds() {
  const s = shares();
  odds.forEach((li) => { const v = s[li.dataset.odds]; li.style.setProperty("--p", v.toFixed(4)); li.querySelector("b").textContent = pct(v); });
  callsLine.textContent = "Model calls per request: " + s.calls.toFixed(2) + " on average, " + tries() + " at most.";
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
function jumpTo(kind) {
  if (kind === "fail") { setRequest(2); const i = phases.findIndex((p) => p.k === "fail"); setPhase(i); return; }
  if (kind === "run" && !phases.some((p) => p.k === "run")) setRequest(0);
  if ((kind === "reject" || kind === "hint") && !phases.some((p) => p.k === kind)) setRequest(1);
  const i = phases.findIndex((p) => p.k === kind);
  if (i >= 0) setPhase(i);
}

function controls() {
  const p = cur();
  prev.disabled = ph === 0;
  const label = typeof NEXT[p.k] === "function" ? NEXT[p.k](p) : NEXT[p.k];
  next.querySelector("span").textContent = label;
  next.setAttribute("aria-label", label);
  stage.setAttribute("aria-valuemax", String(phases.length - 1));
  stage.setAttribute("aria-valuenow", String(ph));
  stage.setAttribute("aria-valuetext", "request " + (req + 1) + ", " + D.requests[req].name + ": " + phaseText(p, true));
  fewer.disabled = maxr === 0;
  more.disabled = maxr === D.maxrTop;
  ROOT.querySelector("[data-r]").textContent = "retries " + maxr;
  feedButton.setAttribute("aria-pressed", String(!feed));
  maxrEl.textContent = "max_retries = " + maxr;
  feedText.setAttribute("data-tone", feed ? "hi" : "lo");
  blindText.setAttribute("data-tone", feed ? "lo" : "hi");
  lampEls.forEach((el, i) => { setLit(el, i <= p.a); setO(el, i <= maxr ? 1 : 0.25); });
}

function update(dt, calm) {
  const g = goals();
  let busy = false;
  const go = (x, target, rate) => { const nx = calm ? target : follow(x, target, rate, dt); if (nx !== target) busy = true; return nx; };
  dist = go(dist, g.dist, 1.6 + (route === "rej" ? 0.4 : 0));
  appear = go(appear, 1, 5);
  const p = cur();
  const atGauge = route === "fwd" && Math.abs(dist - D.dGauge) < 3 && p.k === "check";
  rod = go(rod, atGauge ? 1 : 0, 7);
  blade = go(blade, g.blade, 5);
  const atClip = route === "rej" && Math.abs(dist - D.dClip) < 3 && (p.k === "hint" || p.k === "fail");
  if (atClip && g.ram) stampT += dt;
  if (calm && g.ram) { stampT = 1; tagOn = 1; }
  // one stroke: down, pin the tag, back up
  ram = go(ram, atClip && g.ram && stampT < 0.55 ? 1 : 0, 7);
  if (ram > 0.9) tagOn = 1;
  if (stampT > 0) busy = busy || stampT < 0.9;
  knob = go(knob, feed ? 0 : 1, 6);
  return busy;
}

function place() {
  const p = cur();
  // the card along its route, in the slot that paints it at the right depth
  const r = route === "fwd" ? D.fwd : D.rej;
  const [x, y] = pointOn(r, dist);
  const slot = route === "fwd" || dist < D.dJunc + 4 ? slotA : slotB;
  if (cardEl.parentNode !== slot) slot.appendChild(cardEl);
  setT(cardEl, shift(x, y, 0));
  const fadeHome = route === "rej" ? Math.max(0, Math.min(1, (D.dHome - dist) / 6)) : 1;
  setO(cardEl, Math.min(appear, p.k === "back" ? fadeHome : 1));
  setO(tagEl, tagOn);
  if (p.last) tagSolid.setAttribute("data-lit", ""); else tagSolid.removeAttribute("data-lit");
  // the feeler rod drops onto the card at the gauge
  const bottom = D.rod.up + (D.rod.down - D.rod.up) * ease(rod);
  const key = bottom.toFixed(2);
  if (rodEl._k !== key) { rodEl._k = key; rodEl.innerHTML = solidSvg(cylinder(D.gx, D.fy, D.rod.r, bottom + 1, D.beamZ - bottom - 1, D.P, 14), { tone: "mid" }) + solidSvg(cylinder(D.gx, D.fy, D.rod.foot, bottom, 1, D.P, 20), { tone: "hi" }); }
  // the verdict, once the rod has touched
  const judged = (p.k === "check" && rod > 0.8) || p.k === "run" || p.k === "reject" || p.k === "hint" || p.k === "fail";
  const ok = p.c.ok;
  setLit(verdictEls[0], judged && ok && p.k !== "hint");
  setLit(verdictEls[1], judged && !ok);
  verdictTexts[0].setAttribute("data-tone", judged && ok ? "hi" : "lo");
  verdictTexts[1].setAttribute("data-tone", judged && !ok ? "hi" : "lo");
  // the gate blade
  const bk = blade.toFixed(3);
  if (bladeEl._k !== bk) { bladeEl._k = bk; bladeEl.innerHTML = solidSvg(extrude(bladeRing(D.blade.deflect * ease(blade)), D.baseH, D.blade.h, D.P), { tone: "hi" }); }
  // the clip's ram
  const rb = D.ram.up + (D.ram.down - D.ram.up) * ease(ram);
  setT(ramEl, shift(0, 0, rb - D.ram.up));
  // the feed lever
  setT(knobEl, shift((D.lever[1] - D.lever[0]) * ease(knob), 0, 0));
  // the tool's display
  const ran = p.k === "run" && route === "fwd" && dist > D.dPlaten - 2;
  const res = ran ? "100" : "—";
  if (resultEl.textContent !== res) { resultEl.textContent = res; resultEl.setAttribute("data-tone", ran ? "hi" : "lo"); }
  const text = selected ? D.parts[selected].fact : phaseText(p);
  if (readout.textContent !== text) readout.textContent = text;
}
function bladeRing(angle) {
  const [px, py] = D.pivot, c = Math.cos(angle), s = Math.sin(angle), t = D.blade.t, n = [-s, c];
  const a = [px - n[0] * t / 2, py - n[1] * t / 2], b = [a[0] + c * D.blade.len, a[1] + s * D.blade.len];
  return [a, b, [b[0] + n[0] * t, b[1] + n[1] * t], [a[0] + n[0] * t, a[1] + n[1] * t]];
}

const TOUR = 1.9;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    tourClock += dt;
    if (tourClock > TOUR * (cur().k === "back" || cur().k === "run" ? 1.5 : 1)) {
      tourClock = 0;
      if (ph === phases.length - 1) setRequest(req + 1); else setPhase(ph + 1);
    }
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
    tourClock = 0;
    run();
  }, 9000);
}
const go = (n) => { hold(); setPhase(n); };
const forward = () => { hold(); if (ph === phases.length - 1) { setRequest(req + 1); announce("request " + (req + 1) + " · " + phaseText(cur(), true)); } else setPhase(ph + 1); };
const nextRequest = () => { hold(); select(null); setRequest(req + 1); announce("request " + (req + 1) + " · " + phaseText(cur(), true)); };
const toggleFeed = () => { hold(); setFeed(!feed); };

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const partAt = (target) => target.closest && target.closest("[data-part]");
stage.addEventListener("pointermove", (event) => { if (event.pointerType !== "mouse") return; hold(); const g = partAt(event.target); select(g ? g.dataset.part : null); });
stage.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
stage.addEventListener("click", (event) => { hold(); const g = partAt(event.target); if (!g) return select(null); if (event.pointerType !== "mouse") select(selected === g.dataset.part ? null : g.dataset.part); });
stage.addEventListener("keydown", (event) => {
  const keys = { ArrowRight: forward, ArrowDown: forward, ArrowLeft: () => go(ph - 1), ArrowUp: () => go(ph - 1), Home: () => go(0), End: () => go(phases.length - 1), " ": forward, Enter: forward, Escape: () => { hold(); select(null); }, r: nextRequest, R: nextRequest, b: toggleFeed, B: toggleFeed, "[": () => { hold(); setMaxr(maxr - 1); }, "]": () => { hold(); setMaxr(maxr + 1); }, "-": () => { hold(); setMaxr(maxr - 1); }, "=": () => { hold(); setMaxr(maxr + 1); }, "+": () => { hold(); setMaxr(maxr + 1); } };
  if (!keys[event.key]) return;
  event.preventDefault();
  keys[event.key]();
});
prev.addEventListener("click", () => go(ph - 1));
next.addEventListener("click", forward);
nextReq.addEventListener("click", nextRequest);
feedButton.addEventListener("click", toggleFeed);
fewer.addEventListener("click", () => { hold(); setMaxr(maxr - 1); });
more.addEventListener("click", () => { hold(); setMaxr(maxr + 1); });
for (const item of items) {
  const id = item.dataset.select;
  item.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { hold(); select(id); } });
  item.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
  const pickPart = () => { hold(); select(id); jumpTo(D.parts[id].phase); };
  item.addEventListener("click", pickPart);
  item.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pickPart(); } });
  item.addEventListener("focus", () => { hold(); select(id); });
  item.addEventListener("blur", () => select(null));
}
setRequest(0);
fillOdds();
update(0, true);
place();
`;

const first = `try 1/${MAXR0 + 1} · ${GOOD.args}`;
const plateBody = k.plateHtml({
  fig: "Fig 3",
  title: "Guardrail · validate, retry, fail to data",
  hint: "← → step · R request · [ ] retries · B blind · F expand",
  readout: first,
  keys: [
    { mark: "lit", label: "The attempt lamps, and the error tag on the last attempt" },
    { mark: "raised", label: "Gauge and gate: invalid arguments never reach the tool" },
  ],
  caption: `A guardrail around one tool call, using HOS 3's CalculateArgs schema and max_retries = 2 to start. The three requests are scripted so every outcome appears: valid at once, fixed by a retry, and invalid every time. The odds under the figure are the lecture's arithmetic: 30% of first attempts invalid and attempts independent, so blind retries give about 1.4 model calls per request and leave 2.7% failing. With the error fed back, they use the Module 3 simulator's assumption that a retry fails 0.3 times as often.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Guardrail. Arrow keys step one request through validation and retries; R starts the next request; [ and ] change max_retries; B switches between feeding the error back and blind retries; hover or tap a part to read about it." aria-valuemin="0" aria-valuemax="2" aria-valuenow="0" aria-valuetext="${first}">${svg}</div>
<div class="pc-controls"><button type="button" class="pc-btn" data-prev aria-label="Back one step" disabled>←</button><span class="pc-group pc-right"><button type="button" class="pc-btn" data-fewer aria-label="Fewer retries (lower max_retries)" aria-keyshortcuts="[">−</button><span data-r data-value>retries ${MAXR0}</span><button type="button" class="pc-btn" data-more aria-label="More retries (raise max_retries)" aria-keyshortcuts="]">+</button></span><button type="button" class="pc-btn" data-feed aria-pressed="false" aria-keyshortcuts="B">Blind retries</button><button type="button" class="pc-btn" data-request aria-keyshortcuts="R">Next request</button><button type="button" class="pc-btn pc-next" data-next><span>Validate</span> →</button>${EXPAND_BUTTON}<span class="pc-live" aria-live="polite" data-live></span></div>`,
});

const oddsHtml = `<h4 style="margin:6px 0 0">Over many requests</h4><p class="tip">If 30% of first attempts are invalid. Change the retries and switch blind retries on and off to see the trade.</p><ol class="pc-bars" style="margin-bottom:4px">${[["first", "valid first time"], ["recovered", "fixed by a retry"], ["failAll", "{\"error\"} after the last try"]].map(([key, label]) => `<li data-odds="${key}" style="--p:0"><span>${label}</span><i></i><b></b></li>`).join("")}</ol><p class="tip" data-calls style="margin-bottom:10px"></p>`;
const html = embedHtml({
  slug: "guardrail",
  plate: plateBody,
  parts: partsHtml(PARTS, { extra: oddsHtml }),
  task: "Switch on blind retries and step through request 2. Then raise retries from 2 to 4: how do the share that still fails and the worst-case number of calls change?",
  live: live,
});
inject("module-3/index.html", "guardrail", html);
preview("guardrail", html);
