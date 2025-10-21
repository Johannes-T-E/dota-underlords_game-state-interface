import { PlayerState } from '../../types';

interface PlayerRowProps {
  player: PlayerState;
  rank: number;
}

export const PlayerRow = ({ player, rank }: PlayerRowProps) => {
  const getUnitIcon = (_unitId: number) => {
    // This will need heroes data loaded - simplified for now
    return `/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png`;
  };

  const getStarIcon = (rank: number) => {
    return `/icons/UI_icons/star_icons/star_rank${rank}_psd.png`;
  };

  return (
    <div className="player-row" id={`player-${player.player_id}`}>
      {/* Place */}
      <div className="col-place">
        <span className="place-number">{rank}</span>
      </div>

      {/* Player Name */}
      <div className="col-player">
        <span className="player-name" title={player.persona_name || player.bot_persona_name}>
          {player.persona_name || player.bot_persona_name || 'Unknown Player'}
        </span>
      </div>

      {/* Health */}
      <div className="col-health">
        <img
          src="/icons/UI_icons/other_icons/icon_health_psd.png"
          alt="HP"
          className="stat-icon"
        />
        <span className="health-value">{player.health}</span>
      </div>

      {/* Record (Wins - Losses) */}
      <div className="col-record">
        <span className="wins">{player.wins}</span>
        <span className="separator">-</span>
        <span className="losses">{player.losses}</span>
      </div>

      {/* Net Worth */}
      <div className="col-networth">
        <img
          src="/icons/UI_icons/other_icons/icon_gold_bevel_psd.png"
          alt="Gold"
          className="stat-icon"
        />
        <span className="networth-value">{player.net_worth}</span>
      </div>

      {/* Roster (Board Units) */}
      <div className="col-roster">
        <div className="units-container">
          {player.units && player.units.length > 0 ? (
            player.units.map((unit, idx) => (
              <div key={idx} className="unit-slot">
                <img
                  src={getUnitIcon(unit.unit_id)}
                  alt={`Unit ${unit.unit_id}`}
                  className="unit-icon"
                />
                {unit.rank > 1 && (
                  <img
                    src={getStarIcon(unit.rank)}
                    alt={`Rank ${unit.rank}`}
                    className="unit-star"
                  />
                )}
              </div>
            ))
          ) : (
            <span className="empty-units">No units</span>
          )}
        </div>
      </div>

      {/* Bench */}
      <div className="col-bench">
        <div className="bench-container">
          {/* Bench units would go here - currently empty in the data */}
          <span className="empty-bench">-</span>
        </div>
      </div>
    </div>
  );
};

