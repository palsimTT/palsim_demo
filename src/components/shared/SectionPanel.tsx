import type { ReactNode } from 'react';

interface SectionPanelProps {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

const SectionPanel = ({ icon, title, children, className = '', headerRight }: SectionPanelProps) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        border: '3px solid #696969',
      }}
      className={className}
    >
      {/* Section Header */}
      <div style={{ 
        height: '50px', 
        position: 'relative', 
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div 
          style={{ 
            background: '#696969',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0% 100%)',
            paddingLeft: '8px',
            paddingRight: '35px',
            gap: '8px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img 
            src={icon} 
            alt={`${title} Icon`} 
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '28px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap' }}>
            {title}
          </span>
        </div>
        {headerRight && (
          <div style={{ paddingRight: '12px' }}>
            {headerRight}
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};

export default SectionPanel;
