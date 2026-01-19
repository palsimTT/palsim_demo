import type { ContextItem } from '../../types';

interface ListItemProps {
  item: ContextItem;
  isSelected: boolean;
  onClick: () => void;
}

const ListItem = ({ item, isSelected, onClick }: ListItemProps) => {
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
        backgroundColor: isSelected ? '#FC4F4F' : 'transparent',
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

export default ListItem;
