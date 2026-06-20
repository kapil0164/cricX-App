// ─── MATH HELPERS ─────────────────────────────────────
export const calcSR  = (r, b) => (!b ? "0.00" : ((r / b) * 100).toFixed(2));
export const calcER  = (r, b) => (!b ? "0.00" : (r / (b / 6)).toFixed(2));
export const calcCRR = (r, b) => (!b ? "0.00" : (r / (b / 6)).toFixed(2));
export const ovD     = (b)    => `${Math.floor(b / 6)}.${b % 6}`;

export function findManOfTheMatch(innings, team1, team2, battingTeamFirst) {
  const players = new Map();

  const addPlayer = (name, team) => {
    const key = `${team}::${name}`;
    if (!players.has(key)) {
      players.set(key, {
        name,
        team,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        bowlBalls: 0,
        maidens: 0,
        runsConceded: 0,
        out: false,
      });
    }
    return players.get(key);
  };

  const addBat = (batsman, team) => {
    if (!batsman || !batsman.name) return;
    const player = addPlayer(batsman.name, team);
    player.runs += batsman.runs || 0;
    player.balls += batsman.balls || 0;
    player.fours += batsman.fours || 0;
    player.sixes += batsman.sixes || 0;
    player.out = player.out || batsman.out;
  };

  const addBowl = (bowler, team) => {
    if (!bowler || !bowler.name) return;
    const player = addPlayer(bowler.name, team);
    player.wickets += bowler.wickets || 0;
    player.bowlBalls += bowler.balls || 0;
    player.maidens += bowler.maidens || 0;
    player.runsConceded += bowler.runs || 0;
  };

  if (innings[0]) {
    const inn1BatTeam = battingTeamFirst === "team1" ? team1 : team2;
    const inn1BowlTeam = battingTeamFirst === "team1" ? team2 : team1;
    innings[0].batsmen?.forEach(b => addBat(b, inn1BatTeam));
    innings[0].bowlers?.forEach(b => addBowl(b, inn1BowlTeam));
  }
  if (innings[1]) {
    const inn2BatTeam = battingTeamFirst === "team1" ? team2 : team1;
    const inn2BowlTeam = battingTeamFirst === "team1" ? team1 : team2;
    innings[1].batsmen?.forEach(b => addBat(b, inn2BatTeam));
    innings[1].bowlers?.forEach(b => addBowl(b, inn2BowlTeam));
  }

  let best = null;
  players.forEach(player => {
    const batScore = player.runs * 2 + player.fours * 3 + player.sixes * 4 + (player.balls > 0 && !player.out ? 10 : 0);
    const bowlScore = player.wickets * 25 + player.maidens * 8 - (player.runsConceded / 2);
    const totalScore = batScore + bowlScore;

    const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(2) : "0.00";
    const economy = player.bowlBalls > 0 ? (player.runsConceded / (player.bowlBalls / 6)).toFixed(2) : "0.00";
    player.role = player.wickets > 0 && player.runs > 0 ? "All-rounder"
      : player.wickets > 0 ? "Bowler"
      : "Batsman";
    player.strikeRate = strikeRate;
    player.economy = economy;
    player.overs = Math.floor(player.bowlBalls / 6);
    player.performanceScore = totalScore;

    if (!best || totalScore > best.performanceScore) {
      best = { ...player };
    }
  });

  if (!best) return null;
  best.summary = `${best.role} · ${best.runs} runs${best.balls ? ` (${best.balls})` : ""}`;
  if (best.wickets) {
    best.summary += ` · ${best.wickets} wickets`;
  }
  if (best.overs || best.runsConceded) {
    best.summary += ` · ${best.overs}.${best.bowlBalls % 6} overs, ${best.runsConceded} runs`; 
  }
  return best;
}

export function extractBestPerformances(innings, team1, team2, battingTeamFirst = "team1") {
  const players = new Map();

  const addPlayer = (name, team) => {
    const key = `${team}::${name}`;
    if (!players.has(key)) {
      players.set(key, {
        name,
        team,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        bowlBalls: 0,
        maidens: 0,
        runsConceded: 0,
      });
    }
    return players.get(key);
  };

  const addBat = (batsman, team) => {
    if (!batsman || !batsman.name) return;
    const player = addPlayer(batsman.name, team);
    player.runs += batsman.runs || 0;
    player.balls += batsman.balls || 0;
    player.fours += batsman.fours || 0;
    player.sixes += batsman.sixes || 0;
  };

  const addBowl = (bowler, team) => {
    if (!bowler || !bowler.name) return;
    const player = addPlayer(bowler.name, team);
    player.wickets += bowler.wickets || 0;
    player.bowlBalls += bowler.balls || 0;
    player.maidens += bowler.maidens || 0;
    player.runsConceded += bowler.runs || 0;
  };

  if (innings[0]) {
    const inn1BatTeam = battingTeamFirst === "team1" ? team1 : team2;
    const inn1BowlTeam = battingTeamFirst === "team1" ? team2 : team1;
    innings[0].batsmen?.forEach(b => addBat(b, inn1BatTeam));
    innings[0].bowlers?.forEach(b => addBowl(b, inn1BowlTeam));
  }
  if (innings[1]) {
    const inn2BatTeam = battingTeamFirst === "team1" ? team2 : team1;
    const inn2BowlTeam = battingTeamFirst === "team1" ? team1 : team2;
    innings[1].batsmen?.forEach(b => addBat(b, inn2BatTeam));
    innings[1].bowlers?.forEach(b => addBowl(b, inn2BowlTeam));
  }

  const batting = Array.from(players.values()).filter(p => p.balls > 0 || p.runs > 0);
  const bowling = Array.from(players.values()).filter(p => p.bowlBalls > 0 || p.wickets > 0);

  const bestBatting = batting.sort((a, b) => {
    if (b.runs !== a.runs) return b.runs - a.runs;
    if (a.balls !== b.balls) return a.balls - b.balls;
    return (b.fours + b.sixes) - (a.fours + a.sixes);
  })[0] || null;

  const bestBowling = bowling.sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    const econA = a.bowlBalls > 0 ? a.runsConceded / (a.bowlBalls / 6) : Infinity;
    const econB = b.bowlBalls > 0 ? b.runsConceded / (b.bowlBalls / 6) : Infinity;
    if (econA !== econB) return econA - econB;
    return a.runsConceded - b.runsConceded;
  })[0] || null;

  const formatPlayer = (player) => {
    if (!player) return null;
    return {
      ...player,
      overs: Math.floor(player.bowlBalls / 6),
      strikeRate: player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(2) : "0.00",
      economy: player.bowlBalls > 0 ? (player.runsConceded / (player.bowlBalls / 6)).toFixed(2) : "0.00",
      summary: player.wickets > 0
        ? `${player.wickets}/${player.runsConceded} in ${Math.floor(player.bowlBalls / 6)}.${player.bowlBalls % 6}`
        : `${player.runs}(${player.balls})`,
    };
  };

  return {
    bestBatting: formatPlayer(bestBatting),
    bestBowling: formatPlayer(bestBowling),
  };
}

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