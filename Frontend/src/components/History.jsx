import "./History.css";
import { ovD } from "../utils";

export default function History({ history, isDesktop, onResume, onScoreboard, onDelete }) {
  if (history.length === 0) {
    return (
      <div className={`history-scroll${isDesktop ? " history-scroll--desktop" : ""}`}>
        <div className="empty-state">
          <span className="empty-state__icon">🏏</span>
          <p className="empty-state__title">No matches yet</p>
          <p className="empty-state__sub">Start a new match to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-scroll${isDesktop ? " history-scroll--desktop" : ""}`}>
      <div className={isDesktop ? "grid-2" : ""}>
        {history.map((h, i) => {
          const inProgress = h.status === "In Progress";
          return (
            <div key={i} className={`card${inProgress ? " card--in-progress" : ""}`}>
              <div className="history-card__header">
                <div className="history-card__date">{h.date} – {h.time}</div>
                {inProgress && <span className="badge-live">IN PROGRESS</span>}
              </div>

              {[[h.team1, h.inn1, false], [h.team2, h.inn2, true]].map(([name, inn, dark], j) => (
                <div key={j} className="history-card__team-row">
                  <div className="history-card__team-left">
                    <div className={`team-badge team-badge--sm${dark ? " team-badge--dark" : ""}`}>
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="history-card__team-name">{name}</span>
                  </div>
                  <span className="history-card__score">
                    {inn.runs}/{inn.wickets}
                    <span className="history-card__score-overs"> ({ovD(inn.balls)})</span>
                  </span>
                </div>
              ))}

              <div className="history-card__status">{h.status}</div>

              <div className="history-card__actions">
                {/* Resume always shown — for in-progress it continues, for completed it reviews */}
                <button className="btn-link" onClick={() => onResume && onResume(h)}>
                  {inProgress ? "▶ Resume" : "Resume"}
                </button>
                {!inProgress && (
                  <button className="btn-link" onClick={() => onScoreboard && onScoreboard(h)}>
                    Scoreboard
                  </button>
                )}
                <button
                  className="history-card__delete"
                  onClick={() => onDelete && onDelete(i)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}