import './TeamsOverview.css';
import { oversDisplay } from '../utils';

export default function TeamsOverview({ innings, t1Name, t2Name, currentInning }) {
  return (
    <div className="teams-overview">
      {[t1Name, t2Name].map((name, i) => {
        const inn = innings[i];
        const isActive = i === currentInning - 1;
        return (
          <div key={i} className={`teams-overview__row card ${isActive ? 'active' : ''}`}>
            <div className="teams-overview__left">
              <span className="team-badge teams-overview__badge">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="teams-overview__name">{name}</div>
                <div className="teams-overview__label">
                  {i === 0 ? '1st Innings' : '2nd Innings'}
                </div>
              </div>
            </div>
            <div className="teams-overview__right">
              <span className="teams-overview__score">
                {inn.runs}/{inn.wickets}
              </span>
              <span className="teams-overview__overs">
                ({oversDisplay(inn.balls)})
              </span>
              {isActive && <span className="teams-overview__live">LIVE</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}