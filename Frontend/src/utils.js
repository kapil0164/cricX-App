// ─── MATH HELPERS ─────────────────────────────────────
export const calcSR  = (r, b) => (!b ? "0.00" : ((r / b) * 100).toFixed(2));
export const calcER  = (r, b) => (!b ? "0.00" : (r / (b / 6)).toFixed(2));
export const calcCRR = (r, b) => (!b ? "0.00" : (r / (b / 6)).toFixed(2));
export const ovD     = (b)    => `${Math.floor(b / 6)}.${b % 6}`;

// ─── BALL CLASS HELPER ────────────────────────────────
const BALL_CLASS_MAP = {
  W:  "ball--wkt",
  "6":"ball--six",
  "4":"ball--four",
  WD: "ball--ext",
  NB: "ball--ext",
};
export const ballClass = (v) => `ball ${BALL_CLASS_MAP[v] || "ball--dot"}`;

// ─── FACTORIES ────────────────────────────────────────
export const mkBat  = (name) => ({ name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: "" });
export const mkBowl = (name) => ({ name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 });

// ─── INIT STATE ───────────────────────────────────────
export const INIT_MATCH = {
  team1: "Devansh Team",
  team2: "Kapil Team",
  overs: 8,
  playersPerTeam: 6,
  noBallRun: 1,
  wideBallRun: 1,
  tossWon: "team1",
  optedTo: "bat",
};

export const INIT_EX = {
  wide: false, noBall: false, byes: false, legByes: false, wicket: false,
};

export const INIT_INN = () => ({
  runs: 0, wickets: 0, balls: 0,
  extras: { wide: 0, nb: 0, byes: 0, lb: 0 },
  overs: [], batsmen: [], bowlers: [],
  activeBat: [0, 1], activeBowler: 0,
});

// ─── SAMPLE HISTORY ───────────────────────────────────
export const SAMPLE_HISTORY = [
  {
    date: "25/01/2026", time: "08:11 AM",
    team1: "Devansh Team", team2: "Kapil Team",
    inn1: { runs: 63, wickets: 0, balls: 48 },
    inn2: { runs: 42, wickets: 3, balls: 36 },
    status: "Kapil Team need 22 runs to win.",
  },
  {
    date: "25/01/2026", time: "06:58 AM",
    team1: "Kapil Team", team2: "Devansh Team",
    inn1: { runs: 54, wickets: 0, balls: 48 },
    inn2: { runs: 55, wickets: 1, balls: 44 },
    status: "Devansh Team won by 9 wickets.",
  },
];