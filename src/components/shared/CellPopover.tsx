import { createPortal } from 'react-dom';

interface CellPopoverProps {
  x: number;
  y: number;
  onUp: () => void;
  onDown: () => void;
  onClose: () => void;
}

const CellPopover = ({ x, y, onUp, onDown, onClose }: CellPopoverProps) => {
  const buttonStyle: React.CSSProperties = {
    padding: '6px 16px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  // 使用Portal渲染到body，避免被ScaledContainer的transform影响
  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
        onClick={onClose}
      />
      
      {/* Popover */}
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          padding: '10px',
          display: 'flex',
          gap: '8px',
          left: x,
          top: y - 50,
          transform: 'translateX(-50%)',
        }}
      >
        <button
          onClick={onUp}
          style={{ ...buttonStyle, backgroundColor: '#30C72E' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Up
        </button>
        <button
          onClick={onDown}
          style={{ ...buttonStyle, backgroundColor: '#FC4F4F' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Down
        </button>
      </div>
    </>,
    document.body
  );
};

export default CellPopover;
