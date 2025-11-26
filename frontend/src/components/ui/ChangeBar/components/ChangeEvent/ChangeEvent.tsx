import './ChangeEvent.css';

export type ChangeEventType = 'gold' | 'health' | 'level' | 'units';

export interface ChangeEventProps {
  type: ChangeEventType;
  delta: number;
  timestamp?: number;
  className?: string;
}

export const ChangeEvent = ({ type, delta, className = '' }: ChangeEventProps) => {
  const getColor = () => {
    switch (type) {
      case 'gold':
        return delta > 0 ? '#bada55' : '#e6c200';
      case 'health':
        return delta > 0 ? '#2ecc40' : '#e74c3c';
      case 'level':
        return '#00bfff';
      case 'units':
        return '#aaa';
      default:
        return '#aaa';
    }
  };

  const getText = () => {
    switch (type) {
      case 'gold':
        return `${delta > 0 ? '+' : ''}${delta}g`;
      case 'health':
        return `${delta > 0 ? '+' : ''}${delta}hp`;
      case 'level':
        return `Lv${delta > 0 ? '+' : ''}${delta}`;
      case 'units':
        return 'Units';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`change-event ${className}`}
      style={{ color: getColor() }}
    >
      {getText()}
    </div>
  );
};

