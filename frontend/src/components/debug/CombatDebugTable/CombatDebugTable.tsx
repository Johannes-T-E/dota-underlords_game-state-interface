import { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { Button } from '@/components/ui';
import './CombatDebugTable.css';

const TARGET_ACCOUNT_ID = 249722568;

interface PlayerSnapshot {
  round_number: number;
  round_phase: 'prep' | 'combat';
  combat_duration: number;
  combat_result: number;
  combat_type: number;
  opponent_player_slot: number | undefined;
  player_slot: number;
  health: number;
  losses: number;
  lose_streak: number;
  win_streak: number;
  wins: number;
  vs_opponent_draws: number;
  vs_opponent_losses: number;
  vs_opponent_wins: number;
  timestamp: number;
  updateIndex: number;
}

export interface CombatDebugTableProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CombatDebugTable = ({ isOpen, onClose }: CombatDebugTableProps) => {
  const { players, currentRound, lastUpdate } = useAppSelector((state) => state.match);
  const [snapshots, setSnapshots] = useState<PlayerSnapshot[]>([]);
  const updateIndexRef = useRef(0);
  const lastProcessedTimestampRef = useRef<number | null>(null);
  const lastProcessedSequenceRef = useRef<number | null>(null);

  // Listen to match updates and capture player data
  useEffect(() => {
    if (!isOpen || !players || players.length === 0) return;

    // Find the target player
    const targetPlayer = players.find((p) => p.account_id === TARGET_ACCOUNT_ID);
    if (!targetPlayer) return;

    // Check if this is a new update by comparing timestamp and sequence number
    const currentTimestamp = lastUpdate || Date.now();
    const currentSequence = targetPlayer.sequence_number;
    
    // Skip if this is the same update we just processed
    if (
      lastProcessedTimestampRef.current === currentTimestamp &&
      lastProcessedSequenceRef.current === currentSequence
    ) {
      return;
    }

    // Create snapshot from current state
    const snapshot: PlayerSnapshot = {
      round_number: currentRound.round_number,
      round_phase: currentRound.round_phase,
      combat_duration: targetPlayer.combat_duration,
      combat_result: targetPlayer.combat_result,
      combat_type: targetPlayer.combat_type,
      opponent_player_slot: targetPlayer.opponent_player_slot,
      player_slot: targetPlayer.player_slot,
      health: targetPlayer.health,
      losses: targetPlayer.losses,
      lose_streak: targetPlayer.lose_streak,
      win_streak: targetPlayer.win_streak,
      wins: targetPlayer.wins,
      vs_opponent_draws: targetPlayer.vs_opponent_draws,
      vs_opponent_losses: targetPlayer.vs_opponent_losses,
      vs_opponent_wins: targetPlayer.vs_opponent_wins,
      timestamp: currentTimestamp,
      updateIndex: updateIndexRef.current++,
    };

    // Update refs to track this update
    lastProcessedTimestampRef.current = currentTimestamp;
    lastProcessedSequenceRef.current = currentSequence;

    // Add snapshot
    setSnapshots((prev) => [...prev, snapshot]);
  }, [players, currentRound, lastUpdate, isOpen]);

  const handleClear = () => {
    setSnapshots([]);
    updateIndexRef.current = 0;
    lastProcessedTimestampRef.current = null;
    lastProcessedSequenceRef.current = null;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  const getPhaseColor = (phase: 'prep' | 'combat'): string => {
    return phase === 'combat' ? 'var(--lose-streak-color)' : 'var(--win-streak-color)';
  };

  if (!isOpen) return null;

  const parameterNames: (keyof PlayerSnapshot)[] = [
    'round_number',
    'round_phase',
    'combat_duration',
    'combat_result',
    'combat_type',
    'opponent_player_slot',
    'player_slot',
    'health',
    'losses',
    'lose_streak',
    'win_streak',
    'wins',
    'vs_opponent_draws',
    'vs_opponent_losses',
    'vs_opponent_wins',
  ];

  return (
    <div className="combat-debug-overlay" onClick={onClose}>
      <div className="combat-debug-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="combat-debug-header">
          <h2 className="combat-debug-title">
            Combat Debug Table (Account ID: {TARGET_ACCOUNT_ID})
          </h2>
          <div className="combat-debug-actions">
            <Button variant="secondary" size="small" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="ghost" size="small" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="combat-debug-content">
          {snapshots.length === 0 ? (
            <div className="combat-debug-empty">
              No updates captured yet. Waiting for match updates...
            </div>
          ) : (
            <div className="combat-debug-table-wrapper">
              <table className="combat-debug-table">
                <thead>
                  <tr>
                    <th className="combat-debug-table__param-header">Parameter</th>
                    {snapshots.map((snapshot, idx) => (
                      <th
                        key={idx}
                        className="combat-debug-table__column-header"
                        style={{
                          backgroundColor:
                            snapshot.round_phase === 'combat'
                              ? 'rgba(231, 76, 60, 0.1)'
                              : 'rgba(46, 204, 64, 0.1)',
                        }}
                      >
                        <div className="combat-debug-column-label">
                          <div>#{snapshot.updateIndex}</div>
                          <div className="combat-debug-column-timestamp">
                            {new Date(snapshot.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parameterNames.map((paramName) => (
                    <tr key={paramName}>
                      <td className="combat-debug-table__param-cell">{paramName}</td>
                      {snapshots.map((snapshot, idx) => {
                        const value = snapshot[paramName];
                        const isPhase = paramName === 'round_phase';
                        return (
                          <td
                            key={idx}
                            className="combat-debug-table__data-cell"
                            style={{
                              color: isPhase ? getPhaseColor(value as 'prep' | 'combat') : undefined,
                              fontWeight: isPhase ? 'bold' : undefined,
                            }}
                          >
                            {formatValue(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
