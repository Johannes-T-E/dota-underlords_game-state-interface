import { memo } from 'react';
import { 
  PlayerNameDisplay, 
  StatDisplay, 
  StreakBadge, 
  RecordDisplay, 
  ChangeBar,
  HeroPortrait
} from '../../molecules';
import type { ChangeEventData } from '../../molecules';
import type { PlayerState } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './ScoreboardPlayerRow.css';

export interface ScoreboardPlayerRowProps {
  player: PlayerState;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  changeEvents: ChangeEventData[];
  heroesData: HeroesData | null;
  className?: string;
}

export const ScoreboardPlayerRow = memo(({ 
  player, 
  rank, 
  isSelected, 
  onClick,
  changeEvents,
  heroesData,
  className = ''
}: ScoreboardPlayerRowProps) => {
  const units = player.units || [];
  const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
  const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);

  return (
    <div 
      className={`scoreboard-player-row ${isSelected ? 'scoreboard-player-row--selected' : ''} ${className}`}
      id={`player-${player.player_id}`}
      onClick={onClick}
    >
      {/* Place */}
      <div className="scoreboard-player-row__place">
        <ChangeBar events={changeEvents} />
        <div className="scoreboard-player-row__rank">{rank}</div>
      </div>

      {/* Player Name */}
      <div className="scoreboard-player-row__player">
        <div className="scoreboard-player-row__name-container">
          <PlayerNameDisplay
            personaName={player.persona_name}
            botPersonaName={player.bot_persona_name}
            className="scoreboard-player-row__name"
          />
          <div className="scoreboard-player-row__stats">
            <StatDisplay type="level" value={player.level || 0} size="small" />
            <StatDisplay type="gold" value={player.gold || 0} size="small" />
            <StreakBadge 
              winStreak={player.win_streak} 
              loseStreak={player.lose_streak} 
            />
          </div>
        </div>
      </div>

      {/* Health */}
      <div className="scoreboard-player-row__health">
        <div className="scoreboard-player-row__health-value">
          {player.health !== null ? player.health : '—'}
        </div>
        <div className="scoreboard-player-row__health-icon" />
      </div>

      {/* Record */}
      <div className="scoreboard-player-row__record">
        <RecordDisplay wins={player.wins} losses={player.losses} />
      </div>

      {/* Net Worth */}
      <div className="scoreboard-player-row__networth">
        <div className="scoreboard-player-row__networth-value">
          {player.net_worth !== null ? player.net_worth : '—'}
        </div>
      </div>

      {/* Roster */}
      <div className="scoreboard-player-row__roster">
        {rosterUnits.map((unit, idx) => (
          <div key={idx} className="scoreboard-player-row__unit">
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
              size="medium"
            />
          </div>
        ))}
      </div>

      {/* Bench */}
      <div className="scoreboard-player-row__bench">
        {benchUnits.map((unit, idx) => (
          <div key={idx} className="scoreboard-player-row__unit scoreboard-player-row__unit--bench">
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
              size="medium"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

ScoreboardPlayerRow.displayName = 'ScoreboardPlayerRow';

