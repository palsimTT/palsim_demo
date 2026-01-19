import { SectionPanel, DistributionGrid } from '../shared';
import predictorIcon from '../../assets/predictor.png';
import sizeIcon from '../../assets/size_icon.png';
import transparentIcon from '../../assets/transparent_icon.png';

interface PredictorProps {
  data: {
    overallWinRate: number;
    techniqueDistribution: number[];
    placementDistribution: number[][];
    winRateDistribution: number[][];
  } | null;
}

// 图例组件 - 右侧留空间与Simulator对齐（refresh按钮宽度约36px）
const GridLegend = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px',
    fontSize: '14px',
    color: '#000000',
    marginRight: '52px',
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

const Predictor = ({ data }: PredictorProps) => {
  const defaultData = {
    overallWinRate: 32,
    techniqueDistribution: [0.6, 0.4, 0.15, 0.3, 0.2, 0.5, 0.3, 0.15, 0.35, 0.1, 0.15, 0.08, 0.12],
    placementDistribution: Array(9).fill(null).map(() => Array(13).fill(0.2)),
    winRateDistribution: Array(9).fill(null).map(() => Array(13).fill(0.5))
  };

  const displayData = data || defaultData;

  return (
    <SectionPanel icon={predictorIcon} title="Predictor" headerRight={<GridLegend />}>
      <div style={{ flex: 1, padding: '16px' }}>
        <DistributionGrid
          overallWinRate={displayData.overallWinRate}
          techniqueDistribution={displayData.techniqueDistribution}
          placementDistribution={displayData.placementDistribution}
          winRateDistribution={displayData.winRateDistribution}
          interactive={false}
        />
      </div>
    </SectionPanel>
  );
};

export default Predictor;
