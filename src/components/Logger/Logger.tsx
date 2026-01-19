import { SectionPanel, Divider } from '../shared';
import LogItem from './LogItem';
import FeatureImpact from './FeatureImpact';
import loggerIcon from '../../assets/logger.png';
import type { SimulationLogItem, FeatureImpactItem } from '../../types';

interface LoggerProps {
  logs: SimulationLogItem[];
  selectedLogId: string | null;
  onSelectLog: (id: string) => void;
  onAddNew: () => void;
  featureImpacts: FeatureImpactItem[];
}

const Logger = ({ logs, selectedLogId, onSelectLog, onAddNew, featureImpacts }: LoggerProps) => {
  return (
    <SectionPanel icon={loggerIcon} title="Logger">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px 16px 16px' }}>
        {/* Simulation Log Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Divider label="Simulation Log" />
          
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #CAC4D0', borderRadius: '4px', marginTop: '8px' }}>
            {/* Log Items */}
            {logs.map((log) => (
              <LogItem
                key={log.id}
                item={log}
                isSelected={selectedLogId === log.id}
                onClick={() => onSelectLog(log.id)}
              />
            ))}
            
            {/* Add New Button - inside the list at bottom */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '16px',
                borderTop: logs.length > 0 ? '1px solid #CAC4D0' : 'none',
              }}
            >
              <button
                onClick={onAddNew}
                style={{ 
                  padding: '8px 24px', 
                  border: '1px solid #696969', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* Feature Impact Section */}
        <div style={{ marginTop: '16px' }}>
          <Divider label="Feature Impact" />
          <div style={{ marginTop: '12px' }}>
            <FeatureImpact items={featureImpacts} />
          </div>
        </div>
      </div>
    </SectionPanel>
  );
};

export default Logger;
