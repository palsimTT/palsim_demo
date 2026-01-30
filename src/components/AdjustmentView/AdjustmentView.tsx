import { useState } from 'react';
import DistributionGrid from '../shared/DistributionGrid';
import AdjustmentGrid from '../shared/AdjustmentGrid';

interface PlayerData {
  overallWinRate: number;
  techniqueDistribution: number[];
  placementDistribution: number[][];
  winRateDistribution: number[][];
}

interface AdjustmentViewProps {
  predictionData: PlayerData | null; // 左边：模型预测的分布
  adjustmentMatrix?: number[][] | null; // adjustment幅度矩阵（差值）
  adjustedWinRate?: number; // 调整后的胜率
  baseWinRate?: number;
  onAdjustmentCellUp?: (type: string, row: number, col: number) => void;
  onAdjustmentCellDown?: (type: string, row: number, col: number) => void;
  onRefreshAdjustment?: () => void; // 刷新右边表格
}

const AdjustmentView = ({
  predictionData,
  adjustmentMatrix,
  adjustedWinRate,
  baseWinRate,
  onAdjustmentCellUp,
  onAdjustmentCellDown,
  onRefreshAdjustment,
}: AdjustmentViewProps) => {
  // 悬浮状态：右边表格悬浮时，左边表格显示延伸线
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '3px solid #696969',
      backgroundColor: '#fff',
    }}>
      {/* 标题栏 + 图例 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{
          backgroundColor: '#696969',
          color: '#fff',
          padding: '6px 16px',
          fontSize: '20px',
          fontWeight: 600,
          fontFamily: 'Gill Sans, sans-serif',
        }}>
          Adjustment View
        </div>
        
        {/* 图例 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: '10px' }}>
          {/* Use Rate/Deflection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              {[4, 6, 10, 14, 18, 22].map((size, i) => (
                <div
                  key={i}
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: '#696969',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '16px', color: '#000' }}>Use Rate/Deflection</span>
          </div>

          {/* Win Rate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '1px' }}>
              {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 27,
                    backgroundColor: '#848484',
                    opacity,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '16px', color: '#000' }}>Win Rate</span>
          </div>

          {/* Simulative Impact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 111,
              height: 25,
              background: 'linear-gradient(90deg, #C10707 0%, #fff 50%, #01A70C 100%)',
            }} />
            <span style={{ fontSize: '16px', color: '#000' }}>Simulative Impact for Adjustment</span>
          </div>
        </div>

      </div>

      {/* 双表格区域：左=预测分布，右=adjustment矩阵 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        gap: '0px',
        padding: '8px 16px',
        minHeight: 0,
      }}>
        {/* 左边：模型预测的分布 */}
        <div style={{ minWidth: 0 }}>
          {predictionData ? (
            <DistributionGrid
              overallWinRate={predictionData.overallWinRate}
              techniqueDistribution={predictionData.techniqueDistribution}
              placementDistribution={predictionData.placementDistribution}
              winRateDistribution={predictionData.winRateDistribution}
              baseWinRate={baseWinRate}
              interactive={false}
              highlightedCell={hoveredCell}
            />
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
              No prediction data
            </div>
          )}
        </div>

        {/* 中间：刷新按钮 - 增加左右间距 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: '0 80px' }}>
          {onRefreshAdjustment && (
            <button
              onClick={onRefreshAdjustment}
              title="Reset adjustment"
              style={{
                background: 'none',
                border: '1px solid #696969',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#696969" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}
        </div>

        {/* 右边：adjustment幅度矩阵（绿色增加/红色减少） */}
        <div style={{ minWidth: 0 }}>
          <AdjustmentGrid
            adjustmentMatrix={adjustmentMatrix || null}
            adjustedWinRate={adjustedWinRate}
            interactive={true}
            onCellUp={onAdjustmentCellUp}
            onCellDown={onAdjustmentCellDown}
            onCellHover={(row, col) => setHoveredCell({ row, col })}
            onCellLeave={() => setHoveredCell(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdjustmentView;
