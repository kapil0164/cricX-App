import "./Overs.css";
import { ballClass } from "../utils";

export default function Overs({ completedOvers, currentOver }) {
  if (completedOvers.length === 0 && currentOver.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">🏏</span>
        <p className="empty-state__title">No overs bowled yet</p>
      </div>
    );
  }

  return (
    <div className="overs-list">
      {/* Current over (live) */}
      {currentOver.length > 0 && (
        <div className="card over-card--live">
          <div className="over-card__header">
            <span className="over-card__num">
              Ov {completedOvers.length + 1}
              <span className="over-card__num-tag">(live)</span>
            </span>
          </div>
          <div className="balls-row">
            {currentOver.map((b, i) => (
              <div key={i} className={ballClass(b)}>{b}</div>
            ))}
          </div>
        </div>
      )}

      {/* Completed overs — newest first */}
      {[...completedOvers].reverse().map((ov, ri) => {
        const idx = completedOvers.length - 1 - ri;
        return (
          <div key={idx} className="card">
            <div className="over-card__header">
              <span className="over-card__num">Ov {idx + 1}</span>
              <span className="over-card__runs">{ov.runs} runs</span>
            </div>
            <div className="balls-row">
              {ov.balls.map((b, i) => (
                <div key={i} className={ballClass(b)}>{b}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}