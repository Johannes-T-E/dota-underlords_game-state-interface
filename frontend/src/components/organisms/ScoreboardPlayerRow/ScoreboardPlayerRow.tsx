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
  columnOrder?: string[];
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
  columnOrder,
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
  
  // Use provided columnOrder or default order
  const DEFAULT_COLUMN_ORDER = ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'roster', 'bench'];
  const currentOrder = columnOrder || DEFAULT_COLUMN_ORDER;
  
  // Filter visible columns in the specified order
  const visibleOrderedColumns = currentOrder.filter(columnKey => 
    config[columnKey as keyof ScoreboardColumnConfig] === true
  );
  
  const units = player.units || [];
  const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
  const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);

  const renderCell = (columnKey: string) => {
    switch (columnKey) {
      case 'place':
        return (
          <div key={columnKey} className="scoreboard-player-row__place">
            <ChangeBar events={changeEvents} />
            <div className="scoreboard-player-row__rank">{rank}</div>
          </div>
        );
      
      case 'player':
        return (
          <div key={columnKey} className="scoreboard-player-row__player">
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
        );
      
      case 'playerName':
        return (
          <div key={columnKey} className="scoreboard-player-row__player-name">
            <PlayerNameDisplay
              personaName={player.persona_name}
              botPersonaName={player.bot_persona_name}
              className="scoreboard-player-row__name"
            />
          </div>
        );
      
      case 'level':
        return (
          <div key={columnKey} className="scoreboard-player-row__level">
            <LevelXpIndicator 
              level={player.level || 0} 
              xp={player.xp || 0} 
              nextLevelXp={player.next_level_xp || 1} 
              showXpText={false}
            />
          </div>
        );
      
      case 'gold':
        return (
          <div key={columnKey} className="scoreboard-player-row__gold">
            <GoldDisplay gold={player.gold} />
          </div>
        );
      
      case 'streak':
        return (
          <div key={columnKey} className="scoreboard-player-row__streak">
            <StreakBadge 
              winStreak={player.win_streak} 
              loseStreak={player.lose_streak} 
            />
          </div>
        );
      
      case 'health':
        return (
          <div key={columnKey} className="scoreboard-player-row__health">
            <HealthDisplay health={player.health} />
          </div>
        );
      
      case 'record':
        return (
          <div key={columnKey} className="scoreboard-player-row__record">
            <RecordDisplay wins={player.wins} losses={player.losses} />
          </div>
        );
      
      case 'networth':
        return (
          <div key={columnKey} className="scoreboard-player-row__networth">
            <NetWorthDisplay netWorth={player.net_worth} />
          </div>
        );
      
      case 'roster':
        return (
          <div key={columnKey} className="scoreboard-player-row__roster">
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
        );
      
      case 'bench':
        return (
          <div key={columnKey} className="scoreboard-player-row__bench">
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
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`scoreboard-player-row ${isSelected ? 'scoreboard-player-row--selected' : ''} ${className}`}
      id={`player-${player.player_id}`}
      onClick={onClick}
    >
      {visibleOrderedColumns.map(renderCell)}
    </div>
  );
});

ScoreboardPlayerRow.displayName = 'ScoreboardPlayerRow';

