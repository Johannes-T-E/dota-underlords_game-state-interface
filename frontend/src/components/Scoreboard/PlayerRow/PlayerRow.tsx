import { memo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { togglePlayerBoard } from '../../../store/boardSlice';
import { useHeroesData } from '../../../hooks/useHeroesData';
import { usePlayerChanges } from '../../../hooks/usePlayerChanges';
import { HeroPortrait } from '../HeroPortrait/HeroPortrait';
import { PlayerState } from '../../../types';
import './PlayerRow.css';

interface PlayerRowProps {
  player: PlayerState;
  rank: number;
}

export const PlayerRow = memo(({ player, rank }: PlayerRowProps) => {
  const dispatch = useAppDispatch();
  const { selectedPlayerIds } = useAppSelector((state) => state.board);
  const { heroesData } = useHeroesData();
  const changeEvents = usePlayerChanges(player.player_id, player);

  const handleRowClick = () => {
    dispatch(togglePlayerBoard({ playerId: player.player_id, playerData: player }));
  };


  const isSelected = selectedPlayerIds.includes(player.player_id);

  // Separate units into roster (y >= 0) and bench (y = -1)
  const units = player.units || [];
  const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
  const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);

  const formatRecord = () => {
    if (player.wins === null || player.losses === null) {
      return '—';
    }
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    return `${wins}-${losses}`;
  };

  const renderChangeBar = () => {
    return (
      <div className="change-bar">
        {changeEvents.map((event, idx) => (
          <div
            key={idx}
            className="change-event"
            style={{
              color: event.type === 'gold' 
                ? (event.delta > 0 ? '#bada55' : '#e6c200')
                : event.type === 'health'
                ? (event.delta > 0 ? '#2ecc40' : '#e74c3c')
                : event.type === 'level'
                ? '#00bfff'
                : '#aaa'
            }}
          >
            {event.type === 'gold' && `${event.delta > 0 ? '+' : ''}${event.delta}g`}
            {event.type === 'health' && `${event.delta > 0 ? '+' : ''}${event.delta}hp`}
            {event.type === 'level' && `Lv${event.delta > 0 ? '+' : ''}${event.delta}`}
            {event.type === 'units' && 'Units'}
          </div>
        ))}
      </div>
    );
  };

  const createRosterContainer = () => {
    return (
      <div className="roster-container">
        {rosterUnits.map((unit, idx) => (
          <div key={idx} className="roster-unit">
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
            />
          </div>
        ))}
      </div>
    );
  };

  const createBenchContainer = () => {
    return (
      <div className="bench-container">
        {benchUnits.map((unit, idx) => (
          <div key={idx} className="roster-unit">
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`player-row ${isSelected ? 'selected' : ''}`} 
      id={`player-${player.player_id}`}
      onClick={handleRowClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Place */}
      <div className="col-place" style={{ display: 'flex', alignItems: 'center' }}>
        {renderChangeBar()}
        <div className="place-number">{rank}</div>
      </div>

      {/* Player Name */}
      <div className="col-player">
        <div className="name-container">
          <div className="player-name" title={player.persona_name || player.bot_persona_name}>
            {player.persona_name || player.bot_persona_name || 'Unknown Player'}
          </div>
          <div className="name-bottom">
            <div className="unit-display">
              <div className="unit-icon"></div>
              <div className="unit-label">{player.level || 0}</div>
            </div>
            <div className="gold-display">
              <div className="gold-icon"></div>
              <div className="gold-label">{player.gold || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health */}
      <div className="col-health">
        <div className="health-column">
          <div className="health-large">{player.health !== null ? player.health : '—'}</div>
          <div className="health-icon-large"></div>
        </div>
      </div>

      {/* Record (Wins - Losses) */}
      <div className="col-record">
        <div className="record-label">{formatRecord()}</div>
      </div>

      {/* Net Worth */}
      <div className="col-networth">
        <div className="networth-label">{player.net_worth !== null ? player.net_worth : '—'}</div>
      </div>

      {/* Roster (Board Units) */}
      <div className="col-roster">
        {createRosterContainer()}
      </div>

      {/* Bench */}
      <div className="col-bench">
        {createBenchContainer()}
      </div>
    </div>
  );
});

