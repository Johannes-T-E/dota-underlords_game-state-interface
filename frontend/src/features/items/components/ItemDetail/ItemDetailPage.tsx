import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { useItemsData } from '@/hooks/useItemsData';
import { useItemsLocalization } from '../../hooks/useItemsLocalization';
import { ItemDisplay, getItemName, getItemDescription } from '@/components/ui/ItemDisplay';
import { getTierColor } from '@/utils/tierColors';
import type { ItemData } from '@/utils/itemHelpers';
import './ItemDetailPage.css';

export const ItemDetailPage = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { itemsData, loaded } = useItemsData();
  const { itemsLocalization, loading: localizationLoading } = useItemsLocalization();

  // Find current item (prioritize set_balance)
  const item = useMemo(() => {
    if (!itemsData || !itemId) {
      return null;
    }
    
    const itemIdNum = Number(itemId);
    
    // First try set_balance
    if (itemsData.set_balance) {
      const balanceItem = Object.values(itemsData.set_balance).find(
        (i: ItemData) => i.id === itemIdNum
      );
      if (balanceItem) return balanceItem;
    }
    
    // Then try set_base
    if (itemsData.set_base) {
      const baseItem = Object.values(itemsData.set_base).find(
        (i: ItemData) => i.id === itemIdNum
      );
      if (baseItem) return baseItem;
    }
    
    return null;
  }, [itemsData, itemId]);

  const itemName = useMemo(() => {
    if (!item) return '';
    return getItemName(item.id, item.displayName, itemsLocalization);
  }, [item, itemsLocalization]);

  const itemDescription = useMemo(() => {
    if (!item) return '';
    return getItemDescription(item.id, item.description, itemsLocalization);
  }, [item, itemsLocalization]);

  const tierColor = useMemo(() => {
    if (!item || !item.tier) return '#595959';
    return getTierColor(item.tier);
  }, [item]);

  const typeDisplay = useMemo(() => {
    if (!item || !item.type) return '';
    return item.type
      .replace('equipment_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  }, [item]);

  const isLoading = !loaded || localizationLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <MainContentTemplate className="item-detail-page" centered={false}>
          <div className="item-detail-page__container">
            <EmptyState
              title="Loading Item..."
              message="Please wait while we load item data."
              showSpinner
            />
          </div>
        </MainContentTemplate>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <MainContentTemplate className="item-detail-page" centered={false}>
          <div className="item-detail-page__container">
            <EmptyState
              title="Item Not Found"
              message={`Item with ID ${itemId} could not be found.`}
            />
          </div>
        </MainContentTemplate>
      </AppLayout>
    );
  }

  // Format stat arrays for display
  const formatStat = (stat: number | number[] | undefined): string => {
    if (stat === undefined) return '-';
    if (Array.isArray(stat)) {
      return stat.join(' / ');
    }
    return String(stat);
  };

  return (
    <AppLayout>
      <MainContentTemplate className="item-detail-page" centered={false}>
        <div className="item-detail-page__container">
          <div className="item-detail-page__header">
            <button
              className="item-detail-page__back-button"
              onClick={() => navigate('/items')}
            >
              ← Back to Items
            </button>
          </div>

          <div className="item-detail-page__content">
            <div className="item-detail-page__main-info">
              <div className="item-detail-page__icon">
                <ItemDisplay
                  items={item}
                  itemsLocalization={itemsLocalization}
                  size="large"
                />
              </div>
              <div className="item-detail-page__info">
                <h1 className="item-detail-page__name">{itemName}</h1>
                {item.tier && (
                  <div className="item-detail-page__tier" style={{ color: tierColor }}>
                    Tier {item.tier}
                  </div>
                )}
                {typeDisplay && (
                  <div className="item-detail-page__type">{typeDisplay}</div>
                )}
                {itemDescription && (
                  <div className="item-detail-page__description">{itemDescription}</div>
                )}
              </div>
            </div>

            <div className="item-detail-page__stats-section">
              <h2 className="item-detail-page__section-title">Stats</h2>
              <table className="item-detail-page__stats-table">
                <tbody>
                  {item.attack_damage && (
                    <tr>
                      <td className="item-detail-page__stat-label">Attack Damage</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.attack_damage)}</td>
                    </tr>
                  )}
                  {item.bonus_armor !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Armor</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.bonus_armor)}</td>
                    </tr>
                  )}
                  {item.health_bonus !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Health</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.health_bonus)}</td>
                    </tr>
                  )}
                  {item.attack_speed !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Attack Speed</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.attack_speed)}</td>
                    </tr>
                  )}
                  {item.mana_per_second !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Mana Regen</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.mana_per_second)}</td>
                    </tr>
                  )}
                  {item.health_regen !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Health Regen</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.health_regen)}</td>
                    </tr>
                  )}
                  {item.lifesteal_percentage !== undefined && (
                    <tr>
                      <td className="item-detail-page__stat-label">Lifesteal</td>
                      <td className="item-detail-page__stat-value">{formatStat(item.lifesteal_percentage)}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Special Properties */}
            {(() => {
              const specialProperties = Object.entries(item)
                .filter(([key, value]) => 
                  (key.startsWith('offensive_') || key.startsWith('defensive_') || key.startsWith('support_')) &&
                  value !== undefined && value !== null && value !== false
                );
              
              if (specialProperties.length === 0) return null;
              
              return (
                <div className="item-detail-page__properties-section">
                  <h2 className="item-detail-page__section-title">Special Properties</h2>
                  <div className="item-detail-page__properties">
                    {specialProperties.map(([key, value]) => (
                      <div key={key} className="item-detail-page__property">
                        <span className="item-detail-page__property-key">{key.replace(/_/g, ' ')}</span>
                        <span className="item-detail-page__property-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

