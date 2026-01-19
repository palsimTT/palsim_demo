import type { SimulationLogItem } from '../../types';

interface LogItemProps {
  item: SimulationLogItem;
  isSelected: boolean;
  onClick: () => void;
}

const LogItem = ({ item, isSelected, onClick }: LogItemProps) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 16px 16px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #CAC4D0',
        transition: 'background-color 0.2s',
        minHeight: '72px',
        backgroundColor: isSelected ? '#30C72E' : 'transparent',
      }}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{
        fontSize: '24px',
        fontWeight: 400,
        flexShrink: 0,
        minWidth: '55px',
        color: isSelected ? '#ffffff' : '#000000',
      }}>
        {typeof item.winRate === 'number' ? item.winRate.toFixed(1) : item.winRate}%
      </div>
      <div style={{
        fontSize: '16px',
        lineHeight: 1.625,
        flex: 1,
        color: isSelected ? '#ffffff' : '#696969',
      }}>
        {item.description}
      </div>
    </div>
  );
};

export default LogItem;
