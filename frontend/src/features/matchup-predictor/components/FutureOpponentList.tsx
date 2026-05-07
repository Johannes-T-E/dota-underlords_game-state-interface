import { PlayerNameDisplay, SynergiesCell, Text } from '@/components/ui';
import type { CombatResult } from '@/types';
import type { PerspectiveRow } from '../utils/predictionView';
import './FutureOpponentList.css';

interface FutureOpponentListProps {
  rows: PerspectiveRow[];
  selectedIndex: number;
  perspectiveAccountId?: number | null;
  combatHistory: Record<number, CombatResult[]>;
  onSelectIndex: (index: number) => void;
}

const getHeadToHeadCombats = (
  combatHistory: Record<number, CombatResult[]>,
  perspectiveAccountId?: number | null,
  opponentAccountId?: number
) => {
  if (!perspectiveAccountId || !opponentAccountId) {
    return [];
  }

  const history = combatHistory[perspectiveAccountId] || [];
  return history
    .filter((record) => record.opponent_account_id === opponentAccountId)
    .sort((left, right) => left.round_number - right.round_number);
};

export const FutureOpponentList = ({
  rows,
  selectedIndex,
  perspectiveAccountId,
  combatHistory,
  onSelectIndex,
}: FutureOpponentListProps) => {
  return (
    <section className="future-opponent-list">
      <div className="future-opponent-list__header">
        <Text variant="label">Round</Text>
        <Text variant="label">Opponent</Text>
      </div>

      <div className="future-opponent-list__rows app-scrollbar">
        {rows.map((row, index) => {
          const isSelected = index === selectedIndex;
          const h2hCombats = getHeadToHeadCombats(
            combatHistory,
            perspectiveAccountId,
            row.opponent?.account_id
          );

          return (
            <button
              key={`${row.roundNumber}-${row.opponentSlot ?? 'x'}`}
              type="button"
              className={`future-opponent-list__row ${isSelected ? 'future-opponent-list__row--selected' : ''}`}
              onClick={() => onSelectIndex(index)}
            >
              <div className="future-opponent-list__round">{row.roundNumber}</div>
              <div className="future-opponent-list__opponent">
                {row.opponent ? (
                  <>
                    <div className="future-opponent-list__name-row">
                      <PlayerNameDisplay
                        personaName={row.opponent.persona_name}
                        botPersonaName={row.opponent.bot_persona_name}
                        matchCount={row.opponent.match_count}
                      />
                      {h2hCombats.length > 0 ? (
                        <div className="future-opponent-list__h2h">
                          {h2hCombats.map((combat, combatIndex) => (
                            <span
                              key={`${combat.round_number}-${combat.timestamp}-${combatIndex}`}
                              className="future-opponent-list__h2h-item"
                              title={`Round ${combat.round_number}: ${combat.result}`}
                            >
                              <span className="future-opponent-list__h2h-round">{combat.round_number}</span>
                              <span className={`future-opponent-list__h2h-cell future-opponent-list__h2h-cell--${combat.result}`}>
                                {combat.result === 'win' ? 'W' : combat.result === 'loss' ? 'L' : 'D'}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="future-opponent-list__h2h-empty">No H2H</span>
                      )}
                    </div>
                    <div className="future-opponent-list__synergies-row">
                      <SynergiesCell
                        synergies={row.opponent.synergies || []}
                        showPips={false}
                        onlyActive
                        maxDisplay={6}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Text variant="body" color="secondary">Unknown</Text>
                    <span className="future-opponent-list__h2h-empty">No prediction</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
