import "./Squads.css";

export default function Squads({ team1, team2, players1, players2, isDesktop }) {
  const teams = [
    { name: team1, players: players1, dark: false },
    { name: team2, players: players2, dark: true  },
  ];

  return (
    <div className={`squads-grid${isDesktop ? " grid-2" : ""}`}>
      {teams.map(({ name, players, dark }) => (
        <div key={name} className="card">
          <div className="squad-card__head">
            <div className={`team-badge${dark ? " team-badge--dark" : ""}`}>
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="sec-title" style={{ marginBottom: 0 }}>{name}</div>
          </div>
          <ol className="squad-list">
            {players.map((p, i) => (
              <li key={i} className="squad-player">
                <span className="squad-player__num">{i + 1}.</span>
                <span className="squad-player__name">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}