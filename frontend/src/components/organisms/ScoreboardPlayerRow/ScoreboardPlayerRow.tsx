import { memo } from 'react';
import { 
  PlayerNameDisplay, 
  StatDisplay, 
  StreakBadge, 
  RecordDisplay, 
  ChangeBar, 
  HeroPortrait,
  LevelXpIndicator,
  HealthDisplay,
  NetWorthDisplay,
  GoldDisplay
} from '../../molecules';
import type { ChangeEventData } from '../../molecules';
import type { PlayerState, ScoreboardColumnConfig } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './ScoreboardPlayerRow.css';

export interface ScoreboardPlayerRowProps {
  player: PlayerState;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  changeEvents: ChangeEventData[];
  heroesData: HeroesData | null;
  visibleColumns?: ScoreboardColumnConfig;
  className?: string;
}

export const ScoreboardPlayerRow = memo(({ 
  player, 
  rank, 
  isSelected, 
  onClick,
  changeEvents,
  heroesData,
  visibleColumns,
  className = ''
}: ScoreboardPlayerRowProps) => {
  const defaultVisible: ScoreboardColumnConfig = {
    place: true,
    player: false,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    bench: true
  };
  
  const config = visibleColumns || defaultVisible;
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
      {config.place && (
        <div className="scoreboard-player-row__place">
          <ChangeBar events={changeEvents} />
          <div className="scoreboard-player-row__rank">{rank}</div>
        </div>
      )}

      {/* Compact Player Name with Stats*/}
      {config.player && <div className="scoreboard-player-row__player">
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
      </div>}

      {/* Player Name */}
      {config.playerName && (
        <div className="scoreboard-player-row__player-name">
          <PlayerNameDisplay
            personaName={player.persona_name}
            botPersonaName={player.bot_persona_name}
            className="scoreboard-player-row__name"
          />
        </div>
      )}

      {/* Level */}
      {config.level && (
        <div className="scoreboard-player-row__level">
          <LevelXpIndicator 
            level={player.level || 0} 
            xp={player.xp || 0} 
            nextLevelXp={player.next_level_xp || 1} 
            showXpText={false}
          />
        </div>
      )}

      {/* Gold */}
      {config.gold && (
        <div className="scoreboard-player-row__gold">
          <GoldDisplay gold={player.gold} />
        </div>
      )}

      {/* Streak */}
      {config.streak && (
        <div className="scoreboard-player-row__streak">
          <StreakBadge 
            winStreak={player.win_streak} 
            loseStreak={player.lose_streak} 
          />
        </div>
      )}

      {/* Health */}
      {config.health && (
        <div className="scoreboard-player-row__health">
          <HealthDisplay health={player.health} />
        </div>
      )}

      {/* Record */}
      {config.record && (
        <div className="scoreboard-player-row__record">
          <RecordDisplay wins={player.wins} losses={player.losses} />
        </div>
      )}

      {/* Net Worth */}
      {config.networth && (
        <div className="scoreboard-player-row__networth">
          <NetWorthDisplay netWorth={player.net_worth} />
        </div>
      )}

      {/* Roster */}
      {config.roster && (
        <div className="scoreboard-player-row__roster">
          {rosterUnits.map((unit, idx) => (
            <div key={idx} className="scoreboard-player-row__unit">
              <HeroPortrait 
                unitId={unit.unit_id}
                rank={unit.rank || 0}
                heroesData={heroesData}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bench */}
      {config.bench && (
        <div className="scoreboard-player-row__bench">
          {benchUnits.map((unit, idx) => (
            <div key={idx} className="scoreboard-player-row__unit scoreboard-player-row__unit--bench">
              <HeroPortrait 
                unitId={unit.unit_id}
                rank={unit.rank || 0}
                heroesData={heroesData}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ScoreboardPlayerRow.displayName = 'ScoreboardPlayerRow';

