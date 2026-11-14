// Anatomy of a push notification, for AI 410 Module 4 (Lecture Part 2). Writes the figure into
// module-4/index.html between its <!-- anatomy:push-chain --> markers.
//
// A wiring bench. A signal runs from the phone through two knife switches on its cradle
// (permission, then an Expo push token) and a third by the backend (POST /register-device) into
// the backend's token drawer. When the worker's job finishes, a fourth switch (device_id on the
// upload) tells the backend whom to notify. The backend posts to Expo's push service: its meter
// swings to HTTP 200 and a receipt slip prints the response body. Expo hands the message to
// Apple's or Google's service, and the long wire round the front carries it to the phone.
//
// Open any switch and the signal stops there, and nothing errors: the job still shows finished,
// and with an old token on file the meter still reads 200. Only the slip (the body) says
// DeviceNotRegistered. The links, the 200 and the body are the lecture's own; the scenarios are
// the Module 4 simulator's.
import { k, EXPAND_BUTTON, embedHtml, partsHtml, inject, preview } from "../embed.mjs";

// ---------- the model ----------
const LINKS = [
  { id: "permission", short: "PERMISSION", title: "Permission", ok: "permission · granted", bad: "permission · denied, so no token" },
  { id: "token", short: "TOKEN", title: "Push token", ok: "token · ExponentPushToken[…]", bad: "no token · needs an EAS project ID" },
  { id: "register", short: "/register-device", title: "POST /register-device", ok: "POST /register-device · stored", bad: "not registered · backend has the old token" },
  { id: "device", short: "device_id", title: "device_id on the upload", ok: "job · finished · device_id ✓", bad: "job · finished · no device_id" },
];
const SCENARIOS = [
  { name: "every link holds", open: [] },
  { name: "old token on file (Expo Go reinstalled)", open: [2] },
  { name: "upload without device_id", open: [3] },
  { name: "permission denied", open: [0] },
];

// ---------- world ----------
const W = 640, H = 400;
const PLATE = { x: -142, y: -84, w: 222, d: 152, r: 9 };
const PLATE_H = 9, FOOT_H = 5;
const box = (cx, cy, w, d, r = 0.8) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const WIRE = { w: 1.4, h: 0.8 };
const WORKER = { x: -130, y: -74, w: 40, d: 28, r: 2.5 }, WORKER_H = 14;
const BACK = { x: -60, y: -72, w: 52, d: 42, r: 3 }, BACK_H = 20;
const EXPO = { x: 26, y: -72, w: 34, d: 28, r: 2.5 }, EXPO_H = 16;
const MAST = [43, -60], MAST_H = 40;
const PLAT = { x: 2, y: 2, w: 42, d: 34, r: 3 }, PLAT_H = 12;
const CRADLE = { x: -126, y: 6, w: 44, d: 56, r: 3 }, CRADLE_H = 3;
const PHONE = { x: -120, y: 10, w: 32, d: 48, r: 4 }, PHONE_H = 2.2;
const SCREEN = k.insetPlan(PHONE, 2);
const BANNER = { x: SCREEN.x + 1.6, y: SCREEN.y + 3, w: SCREEN.w - 3.2, d: 9, r: 1.2 };
const DIAL = [-24, -54], DIAL_R = 9;
const DRAWER = { x: BACK.x + 6, y: BACK.y + 6, w: 18, d: 9, r: 0.8 };
const SLIP = { y: -46, d: 9, w: 26 };
// wires (plan polylines at z 0) and where the switches sit on them
const REG = [[-104, 6], [-104, -14], [-34, -14], [-34, -30]];
const JOB = [[-90, -60], [-60, -60]];
const SEND = [[-8, -60], [26, -60]];
const DELIVER = [[46, -44], [46, -10], [23, -10], [23, 52], [-82, 52]];
const SW = [
  { at: [-104, -2], axis: "y" },
  { at: [-82, -14], axis: "x" },
  { at: [-56, -14], axis: "x" },
  { at: [-75, -60], axis: "x" },
];
const SW_LEN = 14, SW_W = 7, SW_H = 1.6, GAP = 10, OPEN = (58 * Math.PI) / 180;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [MAST[0], MAST[1], MAST_H + 4], [BACK.x, BACK.y, BACK_H + 3]],
  W, H, { pad: 16 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(...a) - depth(...b));
const screws = (list, z, size = 0.45) => Dt(list.map(([x, y]) => at([x, y, z])), { size });
const topText = (x, y, z, text, size, tone = "mid", anchor = "start", extra = "") => k.faceTextSvg(k.topMatrix([x, y], z, P, "x"), text, { size, tone, anchor }).replace("<text", `<text${extra}`);
const alongY = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.topMatrix([x, y], z, P, "y"), text, { size, tone, anchor });
const frontText = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "left"), text, { size, tone, anchor });
const rightText = (x, y, z, text, size, tone = "mid", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), text, { size, tone, anchor });
const slotOn = (pts) => L(k.pathOf(pts.map(at), true), { tone: "hi" });

// ---------- plate ----------
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
  out.push(topText(-80, 58.5, 0, "DELIVERY · EXPO → APPLE / GOOGLE → PHONE", 2.6, "lo"));
  out.push(topText(-90, 1, 0, "REGISTER THIS DEVICE · ONCE", 2.4, "lo"));
  out.push(topText(-128, -38, 0, "EVERY JOB", 2.4, "lo"));
  // label plate, front right
  const label = { x: 28, y: 44, w: 44, d: 16, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(topText(label.x + 5, label.y + 7, 0.8, "HOS 4 · PUSH", 3, "mid"));
  out.push(topText(label.x + 5, label.y + 12, 0.8, "push/send", 1.9, "lo"));
  out.push(screws([[label.x + 2.6, label.y + 2.6], [label.x + label.w - 2.6, label.y + label.d - 2.6]], 0.8, 0.4));
  return out.join("");
}

// ---------- wires: low cable channels, broken at each switch ----------
function segs(route, cuts = []) {
  // split an axis-aligned route at each switch, leaving the switch's gap
  const out = [];
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1], [bx, by] = route[i];
    const alongX = ay === by;
    let pieces = [[alongX ? ax : ay, alongX ? bx : by]];
    for (const s of cuts) {
      const [sx, sy] = s.at, c = alongX ? sx : sy, onLine = alongX ? Math.abs(sy - ay) < 0.01 : Math.abs(sx - ax) < 0.01;
      if (!onLine) continue;
      pieces = pieces.flatMap(([p, q]) => {
        const lo = Math.min(p, q), hi = Math.max(p, q);
        if (c - SW_LEN / 2 < lo || c + SW_LEN / 2 > hi) return [[p, q]];
        return [[lo, c - SW_LEN / 2], [c + SW_LEN / 2, hi]];
      });
    }
    for (const [p, q] of pieces) {
      const lo = Math.min(p, q) - (alongX ? WIRE.w / 2 : 0), hi = Math.max(p, q) + (alongX ? WIRE.w / 2 : 0);
      const plan = alongX ? { x: lo, y: ay - WIRE.w / 2, w: hi - lo, d: WIRE.w, r: 0.3 } : { x: ax - WIRE.w / 2, y: Math.min(p, q) - WIRE.w / 2, w: WIRE.w, d: Math.abs(q - p) + WIRE.w, r: 0.3 };
      out.push(S(k.slabOf(plan, 0, WIRE.h, P, 1), { tone: "mid", crease: "none" }));
    }
  }
  return out.join("");
}

// ---------- knife switches ----------
const swAxis = (s) => (s.axis === "x" ? [1, 0] : [0, -1]); // the direction the signal runs through it
function switchBase(s) {
  const [cx, cy] = s.at, [ux, uy] = swAxis(s);
  const base = s.axis === "x" ? box(cx, cy, SW_LEN, SW_W, 1) : box(cx, cy, SW_W, SW_LEN, 1);
  const hinge = [cx - ux * GAP / 2, cy - uy * GAP / 2], clip = [cx + ux * GAP / 2, cy + uy * GAP / 2];
  const out = [S(k.slabOf(base, 0, SW_H, P, 2, 0.3), { tone: "mid" })];
  out.push(screws(s.axis === "x" ? [[base.x + 1.6, cy], [base.x + base.w - 1.6, cy]] : [[cx, base.y + 1.6], [cx, base.y + base.d - 1.6]], SW_H, 0.35));
  // the clip: two jaws either side of where the blade lands
  const [px, py] = [-uy, ux];
  for (const side of [-1, 1]) {
    const jx = clip[0] + px * side * 1.1, jy = clip[1] + py * side * 1.1;
    out.push(S(k.slabOf(box(jx, jy, s.axis === "x" ? 2 : 0.8, s.axis === "x" ? 0.8 : 2, 0.2), SW_H, 3, P, 1), { tone: "mid" }));
  }
  out.push(S(k.cylinder(hinge[0], hinge[1], 1.3, SW_H, 3.2, P, 14), { tone: "mid" }) + Dt([at([hinge[0], hinge[1], SW_H + 3.2])], { size: 0.35 }));
  return out.join("");
}
function bladeRing(s, angle) {
  const [cx, cy] = s.at, [ux, uy] = swAxis(s);
  const a0 = Math.atan2(uy, ux) + angle;
  const c = Math.cos(a0), sn = Math.sin(a0), t = 0.8, len = GAP + 0.6;
  const hx = cx - ux * GAP / 2, hy = cy - uy * GAP / 2, n = [-sn, c];
  const a = [hx - n[0] * t / 2, hy - n[1] * t / 2], b = [a[0] + c * len, a[1] + sn * len];
  return { ring: [a, b, [b[0] + n[0] * t, b[1] + n[1] * t], [a[0] + n[0] * t, a[1] + n[1] * t]], tip: [hx + c * (len - 1), hy + sn * (len - 1)] };
}
const bladeSvg = (s, angle) => {
  const { ring, tip } = bladeRing(s, angle);
  return S(k.extrude(ring, SW_H + 1.6, 1, P), { tone: "hi" }) + S(k.cylinder(tip[0], tip[1], 1, SW_H + 2.6, 2.4, P, 12), { tone: "hi" });
};

// ---------- the worker ----------
function worker() {
  const out = [S(k.slabOf(WORKER, 0, WORKER_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(WORKER, 3, P, 4), { tone: "faint" }) })];
  out.push(topText(WORKER.x + 4, WORKER.y + 7, WORKER_H, "WORKER", 2.8, "mid"));
  out.push(topText(WORKER.x + 4, WORKER.y + 11.4, WORKER_H, "rq job: returns.pdf", 2, "lo"));
  out.push(L(k.ring(WORKER.x + WORKER.w - 7, WORKER.y + 7, 3.2, WORKER_H, P, 18), { tone: "lo" }));
  out.push(`<g data-joblamp>${S(k.cylinder(WORKER.x + WORKER.w - 7, WORKER.y + 7, 2.2, WORKER_H, 1.2, P, 18), { tone: "mid" })}</g>`);
  out.push(topText(WORKER.x + 4, WORKER.y + 20, WORKER_H, "status: queued", 2.2, "lo", "start", " data-jobstatus"));
  out.push(slotOn([[WORKER.x + WORKER.w, JOB[0][1] - 1.6, 0.2], [WORKER.x + WORKER.w, JOB[0][1] + 1.6, 0.2], [WORKER.x + WORKER.w, JOB[0][1] + 1.6, 2], [WORKER.x + WORKER.w, JOB[0][1] - 1.6, 2]]));
  out.push(screws(k.corners(WORKER, 2.6), WORKER_H, 0.4));
  return out.join("");
}

// ---------- the backend ----------
function backend() {
  const out = [S(k.slabOf(BACK, 0, BACK_H, P, 5, 0.8), { tone: "mid", inner: L(k.sideSeam(BACK, BACK_H - 4, P, 5), { tone: "faint" }) })];
  // token drawer, back left of the top
  out.push(S(k.slabOf(DRAWER, BACK_H, 0.5, P, 2), { tone: "lo", crease: "none" }));
  out.push(`<g data-token>${S(k.slabOf(k.insetPlan(DRAWER, 1.4), BACK_H + 0.5, 0.6, P, 2), { tone: "hi", crease: "none", inner: topText(DRAWER.x + 2.6, DRAWER.y + 5.6, BACK_H + 1.1, "TOKEN · NEW", 1.9, "hi", "start", " data-tokentext") })}</g>`);
  out.push(topText(DRAWER.x, DRAWER.y + DRAWER.d + 3.4, BACK_H, "push_tokens", 2, "lo"));
  out.push(topText(BACK.x + 6, BACK.y + 26, BACK_H, "BACKEND", 3, "mid"));
  out.push(topText(BACK.x + 6, BACK.y + 30.6, BACK_H, "FastAPI", 2.2, "lo"));
  // the status meter: a dial from 100 to 500, its needle rebuilt live
  const [dx, dy] = DIAL;
  out.push(S(k.cylinder(dx, dy, DIAL_R + 1.4, BACK_H, 1, P, 36), { tone: "mid" }));
  out.push(L(k.ring(dx, dy, DIAL_R, BACK_H + 1, P, 36), { tone: "lo" }));
  const ticks = k.radialTicks(dx, dy, DIAL_R - 0.4, 20, 5, BACK_H + 1, [1, 2.2], P, DIAL_FROM, DIAL_SPAN);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const a200 = DIAL_FROM + DIAL_SPAN * 0.25;
  // the 200 mark, labelled just outside the bezel so the needle never covers it
  out.push(topText(dx + Math.cos(a200) * (DIAL_R + 4.2) + 1, dy + Math.sin(a200) * (DIAL_R + 4.2), BACK_H, "200", 2.4, "hi", "middle"));
  out.push(topText(dx, dy + 5, BACK_H + 1, "HTTP", 1.8, "lo", "middle"));
  // receipt slot on the right face, at the slip's height
  const rx = BACK.x + BACK.w;
  out.push(slotOn([[rx, SLIP.y - SLIP.d / 2 - 0.6, 5], [rx, SLIP.y + SLIP.d / 2 + 0.6, 5], [rx, SLIP.y + SLIP.d / 2 + 0.6, 6.4], [rx, SLIP.y - SLIP.d / 2 - 0.6, 6.4]]));
  out.push(rightText(rx, SLIP.y + SLIP.d / 2 + 0.6, 9.4, "body", 2.2, "lo"));
  out.push(screws(k.corners(BACK, 3), BACK_H, 0.45));
  return out.join("");
}
const DIAL_FROM = Math.PI * 0.75 + Math.PI / 4, DIAL_SPAN = Math.PI * 1.5; // 100 at the start, 500 at the end
const needleD = (frac) => {
  const a = DIAL_FROM + DIAL_SPAN * frac, [dx, dy] = DIAL;
  return k.lineOnTop([dx, dy], [dx + Math.cos(a) * (DIAL_R - 1.4), dy + Math.sin(a) * (DIAL_R - 1.4)], BACK_H + 1.2, P);
};
// the slip, printed inside the backend and slid out of the right face
function slip() {
  const plan = { x: BACK.x + BACK.w - SLIP.w, y: SLIP.y - SLIP.d / 2, w: SLIP.w, d: SLIP.d, r: 0.5 }, z = 5.2, top = z + 0.6;
  return S(k.slabOf(plan, z, 0.6, P, 1), { tone: "hi", crease: "none", inner: topText(plan.x + 1.6, plan.y + 3.6, top, "HTTP 200 · body:", 1.6, "lo") + topText(plan.x + 1.6, plan.y + 7.2, top, '"status": "ok"', 1.8, "hi", "start", " data-sliptext") });
}
function slipTray() {
  const tray = { x: BACK.x + BACK.w, y: SLIP.y - SLIP.d / 2 - 1.5, w: SLIP.w + 2, d: SLIP.d + 3, r: 0.8 };
  return S(k.slabOf(tray, 0, 5.2, P, 2, 0.4), { tone: "mid" }) + screws([[tray.x + tray.w - 2, tray.y + 2], [tray.x + tray.w - 2, tray.y + tray.d - 2]], 5.2, 0.35);
}

// ---------- Expo and the platform services ----------
function expo() {
  const out = [S(k.slabOf(EXPO, 0, EXPO_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(EXPO, 3, P, 4), { tone: "faint" }) })];
  out.push(topText(EXPO.x + 4, EXPO.y + 20, EXPO_H, "EXPO PUSH", 2.6, "mid"));
  out.push(topText(EXPO.x + 4, EXPO.y + 24, EXPO_H, "exp.host", 2, "lo"));
  out.push(S(k.cylinder(MAST[0], MAST[1], 3, EXPO_H, 2, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(MAST[0], MAST[1], 1, EXPO_H + 2, MAST_H - EXPO_H - 2, P, 12), { tone: "mid" }));
  out.push(`<g data-beacon>${S(k.cylinder(MAST[0], MAST[1], 2, MAST_H, 2, P, 16), { tone: "mid" })}</g>`);
  out.push(S(k.cylinder(MAST[0], MAST[1], 2, MAST_H - 10, 1.4, P, 16), { tone: "mid" }));
  out.push(screws(k.corners(EXPO, 2.6), EXPO_H, 0.4));
  return out.join("");
}
function platform() {
  const out = [S(k.slabOf(PLAT, 0, PLAT_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(PLAT, 3, P, 4), { tone: "faint" }) })];
  out.push(topText(PLAT.x + 4, PLAT.y + 8, PLAT_H, "APPLE APNs", 2.4, "mid"));
  out.push(topText(PLAT.x + 4, PLAT.y + 12, PLAT_H, "GOOGLE FCM", 2.4, "mid"));
  out.push(L(k.lineOnTop([PLAT.x + 4, PLAT.y + 15], [PLAT.x + PLAT.w - 4, PLAT.y + 15], PLAT_H, P), { tone: "faint" }) + screws([[PLAT.x + 4, PLAT.y + 15], [PLAT.x + PLAT.w - 4, PLAT.y + 15]], PLAT_H, 0.35));
  for (const j of [0, 1]) out.push(`<g data-relay="${j}">${S(k.cylinder(PLAT.x + 12 + j * 18, PLAT.y + 25, 3.4, PLAT_H, 1.4, P, 20), { tone: "mid" })}</g>`);
  out.push(screws(k.corners(PLAT, 2.6), PLAT_H, 0.4));
  return out.join("");
}

// ---------- the phone ----------
function phone() {
  const out = [S(k.slabOf(CRADLE, 0, CRADLE_H, P, 4, 0.6), { tone: "mid" })];
  out.push(S(k.slabOf(PHONE, CRADLE_H, PHONE_H, P, 6, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(SCREEN, CRADLE_H + PHONE_H, 0.3, P, 6), { tone: "lo", crease: "none" }));
  // app lines on the screen, under where the banner drops in
  const z = CRADLE_H + PHONE_H + 0.3;
  out.push(L([0, 1, 2, 3, 4].map((j) => k.lineOnTop([SCREEN.x + 3, SCREEN.y + 17 + j * 4.6], [SCREEN.x + SCREEN.w - 3 - (j % 2) * 6, SCREEN.y + 17 + j * 4.6], z, P)).join(""), { tone: "faint", free: "both" }));
  out.push(Dt([at([PHONE.x + PHONE.w / 2, PHONE.y + PHONE.d - 1, CRADLE_H + PHONE_H])], { size: 0.5 }));
  out.push(frontText(CRADLE.x + 3, CRADLE.y + CRADLE.d, 2.4, "EXPO GO · iPhone", 1.8, "lo"));
  out.push(screws(k.corners(CRADLE, 2), CRADLE_H, 0.35));
  return out.join("");
}
const banner = () => S(k.slabOf(BANNER, CRADLE_H + PHONE_H + 0.3, 0.6, P, 3), { tone: "hi", crease: "none", inner: topText(BANNER.x + 2, BANNER.y + 4, CRADLE_H + PHONE_H + 0.9, "Document ready", 2, "hi") + topText(BANNER.x + 1.6, BANNER.y + 7.4, CRADLE_H + PHONE_H + 0.9, "returns.pdf is searchable now", 1.15, "lo") });

// ---------- switch labels ----------
function switchLabels() {
  const out = [];
  const [s1, s2, s3, s4] = SW;
  // in front of each switch, where its posts can't hide it
  out.push(alongY(s1.at[0] + SW_W / 2 + 4.4, s1.at[1] + SW_LEN / 2 + 1, 0, "1 PERMISSION", 2.2, "mid"));
  out.push(topText(s2.at[0], s2.at[1] + SW_W / 2 + 3.6, 0, "2 TOKEN", 2.2, "mid", "middle"));
  out.push(topText(s3.at[0], s3.at[1] + SW_W / 2 + 3.6, 0, "3 /register-device", 2.2, "mid", "middle"));
  out.push(topText(s4.at[0], s4.at[1] + 7.6, 0, "4 device_id", 2.2, "mid", "middle"));
  return out.join("");
}

// ---------- assemble ----------
const part = (id, svg) => `<g data-part="${id}">${svg}</g>`;
const swPart = (i) => part(LINKS[i].id, switchBase(SW[i]) + `<g data-blade="${i}">${bladeSvg(SW[i], 0)}</g>`);
const pulse = () => S(k.cylinder(0, 0, 1.9, WIRE.h, 1.2, P, 16), { tone: "hi", lit: true });
const FIGURE_LABEL = `A wiring bench for a push notification. A phone on a cradle at the front left sends a signal through two knife switches, permission and push token, and a third, POST /register-device, into a token drawer on the backend. A worker box at the back left finishes a job and, through a fourth switch, device_id, tells the backend whom to notify. The backend posts to Expo's push service: a meter on it reads HTTP 200 and a receipt slip prints the response body. Expo hands the message to Apple's or Google's service, and a long wire round the front carries it back to the phone, where a banner appears. Open any switch and the signal stops there without an error: the job still shows finished, and with an old token on file the meter still reads 200; only the slip says DeviceNotRegistered.`;

const BODY = [
  plate(),
  part("wires", segs(JOB, [SW[3]]) + segs(SEND) + segs(DELIVER) + segs(REG, [SW[0], SW[1], SW[2]])),
  switchLabels(),
  part("worker", worker()),
  swPart(3),
  `<g data-slot="job"></g>`,
  part("backend", backend() + slipTray() + `<g data-slip>${slip()}</g>` + `<path class="iso-line" data-tone="hi" data-needle data-free="both" d="${needleD(0)}" style="stroke-width:1.1"/>` + Dt([at([DIAL[0], DIAL[1], BACK_H + 1.2])], { size: 0.6, tone: "hi" })),
  `<g data-slot="send"></g>`,
  part("expo", expo()),
  part("platform", platform()),
  swPart(0), swPart(1), swPart(2),
  part("phone", phone() + `<g data-banner>${banner()}</g>`),
  `<g data-slot="front"><g data-pulse>${pulse()}</g></g>`,
];
const svg = k.figureSvg({ width: W, height: H, label: FIGURE_LABEL, body: BODY });

// ---------- steps and parts ----------
const STEPS = [
  { next: "Get a token" },
  { next: "Register the device" },
  { next: "Finish the job" },
  { next: "Send the push" },
  { next: "Deliver it" },
  { next: "Next scenario" },
];
const PARTS = [
  { id: "permission", step: 0, title: "1 · Permission", fact: "permission · the OS asks once", text: "The app asks for notification permission and the user says yes. If they say no, you can't ask again: they have to change it in Settings." },
  { id: "token", step: 1, title: "2 · Expo push token", fact: "token · an address for this app on this device", text: "getExpoPushTokenAsync() returns an Expo push token. It needs a free EAS project ID (run npx eas init once), and Expo Go on Android can't get one any more (SDK 53 and later)." },
  { id: "register", step: 2, title: "3 · POST /register-device", fact: "register · the backend stores the token", text: "The app sends its token to your backend. Reinstall Expo Go and the phone gets a new token; until it registers again, the backend still holds the old one." },
  { id: "device", step: 3, title: "4 · device_id on the upload", fact: "device_id · whom the job should notify", text: "The upload carries device_id, so when the job finishes the backend knows which token to use. Forget it, and the job finishes fine with no one to notify." },
  { id: "backend", step: 4, title: "5 · Backend → Expo", fact: "push/send · 200 even when delivery failed", text: "One HTTP request to Expo's push service. The status code is 200 even for a stale token; the real outcome is in the body: status ok, or error with DeviceNotRegistered. Read the body." },
  { id: "platform", step: 5, title: "6 · Apple / Google → phone", fact: "APNs · FCM · the only way onto a phone", text: "Phones only accept pushes from their platform's service. Expo hands the message to Apple's or Google's, which delivers it, even to a closed app." },
  { id: "worker", step: 3, title: "Worker", fact: "job · finished, whatever happens next", text: "The background job from HOS 3. Its status says finished in every scenario here, which is why a broken chain is so easy to miss." },
];

const unit = (vector) => { const o = at([0, 0, 0]); const p = at(vector); return [p[0] - o[0], p[1] - o[1]]; };
const lenOf = (route) => route.slice(1).reduce((s, p, i) => s + Math.abs(p[0] - route[i][0]) + Math.abs(p[1] - route[i][1]), 0);
const distTo = (route, point) => {
  let d = 0;
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1], [bx, by] = route[i];
    const onX = ay === by && Math.abs(point[1] - ay) < 0.01 && point[0] >= Math.min(ax, bx) && point[0] <= Math.max(ax, bx);
    const onY = ax === bx && Math.abs(point[0] - ax) < 0.01 && point[1] >= Math.min(ay, by) && point[1] <= Math.max(ay, by);
    if (onX) return d + Math.abs(point[0] - ax);
    if (onY) return d + Math.abs(point[1] - ay);
    d += Math.abs(bx - ax) + Math.abs(by - ay);
  }
  throw new Error("point not on route");
};
const DATA = {
  EX: unit([1, 0, 0]), EY: unit([0, 1, 0]), EZ: unit([0, 0, 1]),
  P, links: LINKS, scenarios: SCENARIOS, steps: STEPS,
  routes: { reg: REG, job: JOB, send: SEND, deliver: DELIVER },
  lens: { reg: lenOf(REG), job: lenOf(JOB), send: lenOf(SEND), deliver: lenOf(DELIVER) },
  // where each switch stops the pulse: just before its hinge
  stops: SW.map((s, i) => distTo(i === 3 ? JOB : REG, s.at) - GAP / 2 - 1),
  sw: SW, gap: GAP, swH: SW_H, open: OPEN,
  hide: [PLAT, EXPO, BACK].map(({ x, y, w, d }) => ({ x, y, w, d })),
  slipOut: SLIP.w - 2,
  parts: Object.fromEntries(PARTS.map(({ id, step, fact }) => [id, { step, fact }])),
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
const scenarioButton = ROOT.querySelector("[data-scenario]");
const evidence = [...ROOT.querySelectorAll("[data-evidence]")].sort((a, b) => a.dataset.evidence - b.dataset.evidence);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const slots = { job: stage.querySelector('[data-slot="job"]'), send: stage.querySelector('[data-slot="send"]'), front: stage.querySelector('[data-slot="front"]') };
const pulseEl = stage.querySelector("[data-pulse]");
const blades = [...stage.querySelectorAll("[data-blade]")].sort((a, b) => a.dataset.blade - b.dataset.blade);
const needle = stage.querySelector("[data-needle]");
const slipEl = stage.querySelector("[data-slip]");
const slipText = stage.querySelector("[data-sliptext]");
const tokenEl = stage.querySelector("[data-token]");
const tokenText = stage.querySelector("[data-tokentext]");
const jobLamp = stage.querySelector("[data-joblamp]");
const jobStatus = stage.querySelector("[data-jobstatus]");
const beacon = stage.querySelector("[data-beacon]");
const relays = [...stage.querySelectorAll("[data-relay]")];
const bannerEl = stage.querySelector("[data-banner]");
const groups = [...stage.querySelectorAll("[data-part]")];

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const shift = (dx, dy, dz) => [D.EX[0] * dx + D.EY[0] * dy + D.EZ[0] * dz, D.EX[1] * dx + D.EY[1] * dy + D.EZ[1] * dz];
const setT = (el, [x, y]) => { const t = Math.abs(x) < 0.005 && Math.abs(y) < 0.005 ? "" : "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")"; if (el._t !== t) { el._t = t; t ? el.setAttribute("transform", t) : el.removeAttribute("transform"); } };
const setO = (el, o) => { const v = o >= 0.999 ? "" : o.toFixed(2); if (el._o !== v) { el._o = v; el.style.opacity = v; } };
const setLit = (el, on) => { const s = el.querySelector(".iso-solid") || el; if (on) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit"); };
const follow = (x, target, rate, dt) => { const nx = target + (x - target) * Math.exp(-rate * dt); return Math.abs(nx - target) < 0.01 ? target : nx; };
function pointOn(route, dist) {
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = route[i - 1], [bx, by] = route[i], len = Math.abs(bx - ax) + Math.abs(by - ay);
    if (dist <= len || i === route.length - 1) { const f = Math.max(0, Math.min(1, dist / len)); return [ax + (bx - ax) * f, ay + (by - ay) * f]; }
    dist -= len;
  }
}

let open = [false, false, false, false], scenario = 0, step = 0, selected = null;
let touring = !still.matches, tourClock = 0, idleTimer = 0, visible = false, frame = 0, last = 0;
let pos = 0, fade = 1, swing = [0, 0, 0, 0], meter = 0, slipOut = 0, bannerOn = 0, clock = 0;

// what happened, given the open switches: the first break wins
function outcome() {
  const hasToken = !open[0] && !open[1];
  const registered = hasToken && !open[2];
  // with link 3 open, the backend still holds the token from the last install
  const tokenOnFile = registered ? "new" : open[2] ? "old" : "none";
  const knowsDevice = !open[3];
  const sent = knowsDevice && tokenOnFile !== "none";
  const delivered = sent && tokenOnFile === "new";
  return { hasToken, registered, tokenOnFile, knowsDevice, sent, delivered };
}
// each step: which route the pulse rides, and how far it gets
function leg(n) {
  const o = outcome();
  if (n === 0) return { route: "reg", to: open[0] ? D.stops[0] : D.stops[0] + D.gap + 4, dead: open[0] };
  if (n === 1) return { route: "reg", to: open[0] ? D.stops[0] : open[1] ? D.stops[1] : D.stops[2], dead: open[0] || open[1] };
  if (n === 2) return { route: "reg", to: open[0] ? D.stops[0] : open[1] ? D.stops[1] : open[2] ? D.stops[2] : D.lens.reg, dead: !o.registered };
  if (n === 3) return { route: "job", to: open[3] ? D.stops[3] : D.lens.job, dead: open[3] };
  if (n === 4) return { route: "send", to: o.sent ? D.lens.send : 0, dead: !o.sent };
  return { route: "deliver", to: o.delivered ? D.lens.deliver : o.sent ? 2 : 0, dead: !o.delivered };
}
function stepText(n) {
  const o = outcome(), L = D.links;
  if (n === 0) return open[0] ? L[0].bad : L[0].ok;
  if (n === 1) return open[0] ? "no permission · no token" : open[1] ? L[1].bad : L[1].ok;
  if (n === 2) return o.registered ? L[2].ok : open[2] && o.hasToken ? L[2].bad : "nothing to register";
  if (n === 3) return open[3] ? L[3].bad : L[3].ok;
  if (n === 4) return o.sent ? "push/send · HTTP 200" : o.knowsDevice ? "nothing sent · no token on file" : "nothing sent · no one to notify";
  if (n === 5) return o.delivered ? "body: ok · delivered" : o.sent ? "body: DeviceNotRegistered · no banner" : "no banner · and no error anywhere";
  return "";
}
function announce(text) { if (liveText.textContent !== text) liveText.textContent = text; }

function setStep(n) {
  n = Math.max(0, Math.min(LAST, n));
  if (n === step) return;
  const was = step;
  step = n;
  const g = leg(step);
  // a new leg starts at its own beginning; going back, jump to where the leg ends
  if (n !== was) { pos = n > was ? 0 : g.to; fade = 1; }
  controls();
  if (!touring) announce(stepText(step));
  run();
}
function setOpen(i, on) {
  open[i] = on;
  controls();
  announce((on ? "break link " : "close link ") + (i + 1) + " · " + stepText(step));
  pos = Math.min(pos, leg(step).to);
  run();
}
function setScenario(n) {
  scenario = (n + D.scenarios.length) % D.scenarios.length;
  open = [0, 1, 2, 3].map((i) => D.scenarios[scenario].open.includes(i));
  step = -1;
  setStep(0);
  controls();
}
function controls() {
  prev.disabled = step === 0;
  next.querySelector("span").textContent = D.steps[step].next;
  next.setAttribute("aria-label", D.steps[step].next);
  dots.forEach((dot, index) => (index < step ? dot.setAttribute("data-on", "") : dot.removeAttribute("data-on")));
  stage.setAttribute("aria-valuenow", String(step));
  stage.setAttribute("aria-valuetext", D.scenarios[scenario].name + ": " + stepText(step));
  const named = D.scenarios.findIndex((s) => [0, 1, 2, 3].every((i) => s.open.includes(i) === open[i]));
  scenarioButton.textContent = named >= 0 ? "Scenario " + (named + 1) + "/" + D.scenarios.length : "Your own";
  scenarioButton.setAttribute("aria-label", "Next scenario (now: " + (named >= 0 ? D.scenarios[named].name : "your own") + ")");
  fillEvidence();
}
function fillEvidence() {
  const o = outcome();
  const rows = [
    open[0] ? ["✗", "Permission: denied"] : ["✓", "Permission: granted"],
    o.hasToken ? ["✓", "Token: ExponentPushToken[…]"] : ["✗", open[0] ? "Token: none (no permission)" : "Token: none (no EAS project ID)"],
    o.registered ? ["✓", "push_tokens: this install's token"] : o.tokenOnFile === "old" ? ["✗", "push_tokens: an old token"] : ["✗", "push_tokens: nothing for this device"],
    open[3] ? ["✗", "Job: finished, no device_id"] : ["✓", "Job: finished, device_id set"],
    o.sent ? [o.delivered ? "✓" : "✗", o.delivered ? 'Expo: 200, body status "ok"' : 'Expo: 200, body "DeviceNotRegistered"'] : ["–", "Expo: no request sent"],
    o.delivered ? ["✓", "Phone: Document ready"] : ["✗", "Phone: nothing arrives"],
  ];
  evidence.forEach((li, i) => { li.querySelector("span").textContent = rows[i][0]; li.querySelector("b").textContent = rows[i][1]; if (rows[i][0] === "✗") li.setAttribute("data-bad", ""); else li.removeAttribute("data-bad"); });
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

function update(dt, calm) {
  const g = leg(step), o = outcome();
  let busy = false;
  const go = (x, target, rate) => { const nx = calm ? target : follow(x, target, rate, dt); if (nx !== target) busy = true; return nx; };
  pos = go(pos, g.to, 1.4);
  const arrived = Math.abs(pos - g.to) < 0.5;
  fade = go(fade, arrived && g.dead ? 0 : 1, 2.2);
  for (let i = 0; i < 4; i++) swing[i] = go(swing[i], open[i] ? 1 : 0, 6);
  meter = go(meter, step >= 4 && o.sent && (step > 4 || arrived) ? 1 : 0, 4);
  slipOut = go(slipOut, step >= 4 && o.sent && meter > 0.9 ? 1 : 0, 3);
  bannerOn = go(bannerOn, step >= 5 && o.delivered && arrived ? 1 : 0, 4);
  clock += dt;
  return busy;
}

function place() {
  const g = leg(step), o = outcome(), r = D.routes[g.route];
  const [x, y] = pointOn(r, pos);
  const slot = g.route === "job" ? slots.job : g.route === "send" ? slots.send : slots.front;
  if (pulseEl.parentNode !== slot) slot.appendChild(pulseEl);
  setT(pulseEl, shift(x, y, 0));
  // hidden while it runs under a box; gone when there's nothing to carry
  const under = D.hide.some((b) => x > b.x + 1 && x < b.x + b.w - 1 && y > b.y + 1 && y < b.y + b.d - 1);
  const none = g.to === 0 && g.dead;
  setO(pulseEl, under || none ? 0 : fade);
  // switch blades
  blades.forEach((el, i) => {
    const key = swing[i].toFixed(3);
    if (el._k === key) return;
    el._k = key;
    const s = D.sw[i], a = D.open * ease(swing[i]);
    const ux = s.axis === "x" ? 1 : 0, uy = s.axis === "x" ? 0 : -1;
    const a0 = Math.atan2(uy, ux) + a, c = Math.cos(a0), sn = Math.sin(a0), t = 0.8, len = D.gap + 0.6;
    const hx = s.at[0] - ux * D.gap / 2, hy = s.at[1] - uy * D.gap / 2, n = [-sn, c];
    const p0 = [hx - n[0] * t / 2, hy - n[1] * t / 2], p1 = [p0[0] + c * len, p0[1] + sn * len];
    const ring = [p0, p1, [p1[0] + n[0] * t, p1[1] + n[1] * t], [p0[0] + n[0] * t, p0[1] + n[1] * t]];
    const tip = [hx + c * (len - 1), hy + sn * (len - 1)];
    el.innerHTML = solidSvg(extrude(ring, D.swH + 1.6, 1, D.P), { tone: "hi" }) + solidSvg(cylinder(tip[0], tip[1], 1, D.swH + 2.6, 2.4, D.P, 12), { tone: "hi" });
  });
  // the backend's token drawer
  setO(tokenEl, step >= 2 || o.tokenOnFile === "old" ? (o.tokenOnFile === "none" ? 0 : 1) : o.tokenOnFile === "old" ? 1 : 0);
  const tt = o.tokenOnFile === "old" ? "TOKEN · OLD" : "TOKEN · NEW";
  if (tokenText.textContent !== tt) tokenText.textContent = tt;
  setLit(tokenEl, o.tokenOnFile === "new" && step >= 2);
  // the job: finished from step 3 on, in every scenario
  setLit(jobLamp, step >= 3);
  const js = step >= 3 ? "status: finished" : "status: started";
  if (jobStatus.textContent !== js) { jobStatus.textContent = js; jobStatus.setAttribute("data-tone", step >= 3 ? "hi" : "lo"); }
  // meter: 200 whenever a request went out, delivered or not
  const nk = meter.toFixed(3);
  if (needle._k !== nk) { needle._k = nk; needle.setAttribute("d", meterPath(0.25 * ease(meter))); }
  // the slip prints the body
  const st = o.delivered ? '"status": "ok"' : '"DeviceNotRegistered"';
  if (slipText.textContent !== st) slipText.textContent = st;
  setT(slipEl, shift(D.slipOut * ease(slipOut), 0, 0));
  setO(slipEl, slipOut > 0.02 ? 1 : 0);
  // relays blink while the message passes; the banner drops onto the screen
  const relaying = step === 5 && o.delivered && pos > 66 && pos < 106;
  setLit(beacon, (step === 4 && o.sent) || (step === 5 && o.sent && pos < 30));
  relays.forEach((el, i) => setLit(el, relaying && i === 0));
  setO(bannerEl, bannerOn);
  setT(bannerEl, shift(0, 0, (1 - ease(bannerOn)) * 6));
  const text = selected ? D.parts[selected].fact : stepText(step);
  if (readout.textContent !== text) readout.textContent = text;
}
function meterPath(frac) {
  const from = ${DIAL_FROM}, span = ${DIAL_SPAN}, a = from + span * frac, dx = ${DIAL[0]}, dy = ${DIAL[1]}, r = ${DIAL_R - 1.4};
  return lineOnTop([dx, dy], [dx + Math.cos(a) * r, dy + Math.sin(a) * r], ${BACK_H + 1.2}, D.P);
}

const TOUR = 2.4;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    tourClock += dt;
    if (tourClock > TOUR * (step === LAST ? 1.8 : 1)) {
      tourClock = 0;
      if (step === LAST) setScenario(scenario + 1); else setStep(step + 1);
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
const go = (n) => { hold(); setStep(n); };
const nextScenario = () => { hold(); select(null); setScenario(scenario + 1); announce(D.scenarios[scenario].name + " · " + stepText(0)); };
const forward = () => { if (step === LAST) nextScenario(); else go(step + 1); };
const toggle = (i) => { hold(); setOpen(i, !open[i]); };

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const SWITCH = { permission: 0, token: 1, register: 2, device: 3 };
const partAt = (target) => target.closest && target.closest("[data-part]");
stage.addEventListener("pointermove", (event) => { if (event.pointerType !== "mouse") return; hold(); const g = partAt(event.target); select(g ? g.dataset.part : null); });
stage.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") select(null); });
stage.addEventListener("click", (event) => {
  hold();
  const g = partAt(event.target);
  if (!g) return select(null);
  // clicking a switch opens or closes it
  if (g.dataset.part in SWITCH) { toggle(SWITCH[g.dataset.part]); return; }
  if (event.pointerType !== "mouse") select(selected === g.dataset.part ? null : g.dataset.part);
});
stage.addEventListener("keydown", (event) => {
  const keys = { ArrowRight: () => go(step + 1), ArrowDown: () => go(step + 1), ArrowLeft: () => go(step - 1), ArrowUp: () => go(step - 1), Home: () => go(0), End: () => go(LAST), " ": forward, Enter: forward, Escape: () => { hold(); select(null); }, s: nextScenario, S: nextScenario, 1: () => toggle(0), 2: () => toggle(1), 3: () => toggle(2), 4: () => toggle(3) };
  if (!keys[event.key]) return;
  event.preventDefault();
  keys[event.key]();
});
prev.addEventListener("click", () => go(step - 1));
next.addEventListener("click", forward);
scenarioButton.addEventListener("click", nextScenario);
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
setScenario(0);
update(0, true);
place();
`;

const first = LINKS[0].ok;
const plateBody = k.plateHtml({
  fig: "Fig 4",
  title: "Push notification · a chain that fails silently",
  hint: "← → step · 1–4 break a link · S scenario · F expand",
  readout: first,
  keys: [
    { mark: "lit", label: "The signal, and what it reaches: token, job, meter, banner" },
    { mark: "raised", label: "Knife switches: open one to break that link" },
  ],
  caption: "The six links from the lecture, in order. Steps 1–3 run once, when the app registers; steps 4–6 run when a job finishes. Break any link (click a switch, or press 1 to 4) and the notification never comes, but nothing errors: the job still shows finished, and when the backend sends with an old token, Expo still answers HTTP 200. Only the response body says DeviceNotRegistered. The scenarios are the Module 4 simulator's.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Push notification chain. Arrow keys step through the six links; 1 to 4 open or close a link's switch; S moves to the next scenario; hover or tap a part to read about it." aria-valuemin="0" aria-valuemax="${STEPS.length - 1}" aria-valuenow="0" aria-valuetext="${first}">${svg}</div>
<div class="pc-controls"><button type="button" class="pc-btn" data-prev aria-label="Back one step" disabled>←</button><span class="pc-dots" aria-hidden="true">${STEPS.slice(1).map(() => "<i data-dot></i>").join("")}</span><button type="button" class="pc-btn pc-right" data-scenario aria-keyshortcuts="S" aria-label="Next scenario">Scenario 1/${SCENARIOS.length}</button><button type="button" class="pc-btn pc-next" data-next><span>${STEPS[0].next}</span> →</button>${EXPAND_BUTTON}<span class="pc-live" aria-live="polite" data-live></span></div>`,
});

const CSS = `
.anatomy-embed .pc-evidence{list-style:none;margin:6px 0 10px;padding:0;display:grid;gap:4px;font:12px var(--anatomy-mono);color:var(--text)}
.anatomy-embed .pc-evidence li{display:grid;grid-template-columns:22px 1fr;gap:6px;padding:0;margin:0;border:0}
.anatomy-embed .pc-evidence li span{text-align:center;color:var(--muted)}
.anatomy-embed .pc-evidence li b{font-weight:400}
.anatomy-embed .pc-evidence li[data-bad] b,.anatomy-embed .pc-evidence li[data-bad] span{font-weight:700;color:var(--text)}
`;
const evidenceHtml = `<h4 style="margin:6px 0 0">The evidence at each link</h4><p class="tip">Walk the chain in order and read each link's evidence. It updates as you open and close switches.</p><ol class="pc-evidence">${[0, 1, 2, 3, 4, 5].map((i) => `<li data-evidence="${i}"><span></span><b></b></li>`).join("")}</ol>`;
const html = embedHtml({
  slug: "push-chain",
  plate: plateBody,
  parts: partsHtml(PARTS, { extra: evidenceHtml }),
  css: CSS,
  task: "Open switch 3 (press 3) and step to the end. What does the backend's meter say, and what does the slip say? Which one would a backend that only checks the status code believe?",
  live,
});
inject("module-4/index.html", "push-chain", html);
preview("push-chain", html);
