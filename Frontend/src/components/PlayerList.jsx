import "./PlayerList.css";
import { calcSR } from "../utils";

export default function PlayerList({ inn, title }) {
  return (
    <div className="card">
      <div className="sec-title">{title || "Players"}</div>
      <table className="cric-table">
        <thead>
          <tr>
            <th>#</th><th>Player</th><th>R</th><th>B</th>
            <th>4s</th><th>6s</th><th>SR</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inn.batsmen.map((b, i) => {
            const isActive = inn.activeBat.includes(i);
            const isStriker = inn.activeBat[0] === i;
            return (
              <tr key={i} className={isActive ? "row-active" : ""}>
                <td style={{ color: "var(--c-faint)", fontSize: 11 }}>{i + 1}</td>
                <td>
                  <div className={b.out ? "player-name player-name--out" : "player-name"}>
                    {b.name}{isStriker ? " *" : ""}
                  </div>
                  {b.out && <div className="player-how-out">{b.howOut}</div>}
                </td>
                <td>{b.runs}</td>
                <td>{b.balls}</td>
                <td>{b.fours}</td>
                <td>{b.sixes}</td>
                <td>{calcSR(b.runs, b.balls)}</td>
                <td>
                  <span className={
                    `status-badge ${b.out ? "status-badge--out" : isActive ? "status-badge--batting" : "status-badge--dnb"}`
                  }>
                    {b.out ? "Out" : isActive ? "Bat" : "DNB"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}