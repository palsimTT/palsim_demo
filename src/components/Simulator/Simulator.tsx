import { SectionPanel, DistributionGrid } from '../shared';
import simulatorIcon from '../../assets/simulator.png';
import refreshIcon from '../../assets/refreash.png';
import sizeIcon from '../../assets/size_icon.png';
import transparentIcon from '../../assets/transparent_icon.png';

interface SimulatorProps {
  data: {
    overallWinRate: number;
    techniqueDistribution: number[];
    placementDistribution: number[][];
    winRateDistribution: number[][];
  } | null;
  onRefresh?: () => void;
  onCellUp?: (type: string, row: number, col: number) => void;
  onCellDown?: (type: string, row: number, col: number) => void;
}

// 图例组件
const GridLegend = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px',
    fontSize: '14px',
    color: '#000000',
  }}>
    {/* Use Rate */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={sizeIcon} alt="Size" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
      <span>Use Rate</span>
    </div>
    
    {/* Win Rate */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={transparentIcon} alt="Transparency" style={{ width: '36px', height: '24px', objectFit: 'contain' }} />
      <span>Win Rate</span>
    </div>
  </div>
);

const Simulator = ({ data, onRefresh, onCellUp, onCellDown }: SimulatorProps) => {
  const defaultData = {
    overallWinRate: 32,
    techniqueDistribution: [0.6, 0.4, 0.15, 0.3, 0.2, 0.5, 0.3, 0.15, 0.35, 0.1, 0.15, 0.08, 0.12],
    placementDistribution: Array(9).fill(null).map(() => Array(13).fill(0.2)),
    winRateDistribution: Array(9).fill(null).map(() => Array(13).fill(0.5))
  };

  const displayData = data || defaultData;

  // 组合图例和refresh按钮
  const headerRightContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <GridLegend />
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{ 
            padding: '6px', 
            cursor: 'pointer',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Refresh Simulation"
        >
          <img 
            src={refreshIcon} 
            alt="Refresh" 
            style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
          />
        </button>
      )}
    </div>
  );

  return (
    <SectionPanel icon={simulatorIcon} title="Simulator" headerRight={headerRightContent}>
      <div style={{ flex: 1, padding: '16px' }}>
        <DistributionGrid
          overallWinRate={displayData.overallWinRate}
          techniqueDistribution={displayData.techniqueDistribution}
          placementDistribution={displayData.placementDistribution}
          winRateDistribution={displayData.winRateDistribution}
          interactive={true}
          onCellUp={onCellUp}
          onCellDown={onCellDown}
        />
      </div>
    </SectionPanel>
  );
};

export default Simulator;
