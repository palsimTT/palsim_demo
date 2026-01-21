import { useState, useMemo } from 'react';
import CellPopover from './CellPopover';
import { TECHNIQUES } from '../../types';

interface PopoverState {
  visible: boolean;
  row: number;
  col: number;
  type: 'technique' | 'placement' | 'joint';
  x: number;
  y: number;
}

interface DistributionGridProps {
  overallWinRate: number;
  techniqueDistribution: number[];
  placementDistribution: number[][];
  winRateDistribution: number[][];
  baseWinRate?: number; // 用于计算透明度的基准胜率
  interactive?: boolean;
  onCellUp?: (type: string, row: number, col: number) => void;
  onCellDown?: (type: string, row: number, col: number) => void;
  highlightedCell?: { row: number; col: number } | null; // 高亮的单元格（来自右边表格的悬浮）
}

// 落点区域标签
const ZONE_LABELS = ['Short', 'Half-long', 'Long'];
const POSITION_LABELS = ['B', 'M', 'F'];

// 数据行顺序 (BP_LABELS): BH(0), BL(1), BS(2), FH(3), FL(4), FS(5), MH(6), ML(7), MS(8)
// 渲染行顺序 (Zone+Position): BS(2), MS(8), FS(5), BH(0), MH(6), FH(3), BL(1), ML(7), FL(4)
// 映射：渲染行索引 -> 数据行索引
const RENDER_TO_DATA_ROW = [2, 8, 5, 0, 6, 3, 1, 7, 4];
// 反向映射：数据行索引 -> 渲染行索引（保留以备将来使用）
// const DATA_TO_RENDER_ROW = [3, 6, 0, 5, 8, 2, 4, 7, 1];

const DistributionGrid = ({
  overallWinRate,
  techniqueDistribution,
  placementDistribution,
  winRateDistribution,
  baseWinRate,
  interactive = false,
  onCellUp,
  onCellDown,
  highlightedCell,
}: DistributionGridProps) => {
  const [popover, setPopover] = useState<PopoverState>({
    visible: false,
    row: -1,
    col: -1,
    type: 'joint',
    x: 0,
    y: 0,
  });

  // 表格放大
  const cellSize = 48;
  // 格子内部无间距，grid之间有间距
  const gridGap = 14;
  const labelHeight = 65; // 击球技术label区域高度

  const maxUsage = Math.max(
    ...techniqueDistribution,
    ...placementDistribution.flat()
  );

  const getBlockSize = (usage: number, maxSize: number = 32) => {
    const normalized = maxUsage > 0 ? usage / maxUsage : 0;
    const minSize = 6;
    return minSize + normalized * (maxSize - minSize);
  };

  // 计算透明度：以baseWinRate为中心，上下30%为0-100的区间
  const centerWinRate = useMemo(() => baseWinRate ?? overallWinRate, [baseWinRate, overallWinRate]);
  
  const getBlockOpacity = (winRate: number) => {
    // winRate是百分比形式(0-100)
    const center = centerWinRate;
    const range = 5; // 上下5%
    const minWR = center - range;
    const maxWR = center + range;
    
    // 将胜率映射到透明度 0.4-1，让颜色更浓
    const normalized = (winRate - minWR) / (maxWR - minWR);
    return Math.max(0.2, Math.min(1, 0.2 + normalized * 0.8)); // 最小0.4保证颜色浓
  };

  const handleCellClick = (
    e: React.MouseEvent,
    type: 'technique' | 'placement' | 'joint',
    row: number,
    col: number
  ) => {
    if (!interactive) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      visible: true,
      row,
      col,
      type,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleUp = () => {
    if (onCellUp) {
      onCellUp(popover.type, popover.row, popover.col);
    }
    setPopover({ ...popover, visible: false });
  };

  const handleDown = () => {
    if (onCellDown) {
      onCellDown(popover.type, popover.row, popover.col);
    }
    setPopover({ ...popover, visible: false });
  };

  const closePopover = () => {
    setPopover({ ...popover, visible: false });
  };

  // 计算落点分布的总计
  const placementTotals = Array(9).fill(0).map((_, rowIdx) => {
    const row = placementDistribution[rowIdx];
    return row ? row.reduce((a, b) => a + b, 0) / row.length : 0;
  });

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
      {popover.visible && (
        <CellPopover
          x={popover.x}
          y={popover.y}
          onUp={handleUp}
          onDown={handleDown}
          onClose={closePopover}
        />
      )}

      {/* Overall Win Rate - 悬浮在左上角 */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '0',
        zIndex: 10,
      }}>
        <div style={{
          backgroundColor: '#ffffffff',
          color: '#000000ff',
          fontSize: '22px',
          fontWeight: 400,
          padding: '6px 16px',
          display: 'inline-block',
          minWidth: '80px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          borderRadius: '4px',
        }}>
          {overallWinRate.toFixed(1)}%
        </div>
      </div>

      {/* Main Grid Layout - 整体居中 */}
      <div style={{ display: 'flex', gap: `${gridGap}px` }}>
        
        {/* Left: Placement Labels + Placement Grid */}
        <div style={{ display: 'flex', gap: '4px', marginTop: labelHeight + cellSize + gridGap }}>
          {/* Zone Labels (竖排) - 检查该zone内是否有高亮行 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ZONE_LABELS.map((zone, zoneIdx) => {
              // 每个zone包含3行，检查是否有高亮行在该zone内
              // Zone 0 (Short): 渲染行 0,1,2 -> 数据行 2,8,5
              // Zone 1 (Half-long): 渲染行 3,4,5 -> 数据行 0,6,3
              // Zone 2 (Long): 渲染行 6,7,8 -> 数据行 1,7,4
              const zoneDataRows = [
                RENDER_TO_DATA_ROW[zoneIdx * 3],
                RENDER_TO_DATA_ROW[zoneIdx * 3 + 1],
                RENDER_TO_DATA_ROW[zoneIdx * 3 + 2],
              ];
              const isHighlightedZone = highlightedCell && zoneDataRows.includes(highlightedCell.row);
              return (
              <div
                key={zone}
                style={{
                  height: cellSize * 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '10px',
                }}
              >
                <span style={{
                  fontSize: '12px',
                  color: isHighlightedZone ? '#FFA500' : '#696969',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap',
                }}>
                  {zone}
                </span>
              </div>
              );
            })}
          </div>

          {/* Position Labels (B, M, F) - 使用渲染行索引映射到数据行索引 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array(9).fill(null).map((_, renderRowIdx) => {
              const dataRowIdx = RENDER_TO_DATA_ROW[renderRowIdx];
              const isHighlightedRow = highlightedCell?.row === dataRowIdx;
              const posIdx = renderRowIdx % 3;
              const pos = POSITION_LABELS[posIdx];
              return (
                <div
                  key={`pos-${renderRowIdx}`}
                  style={{
                    height: cellSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px',
                  }}
                >
                  <span style={{ 
                    fontSize: '12px', 
                    color: isHighlightedRow ? '#FFA500' : '#696969',
                  }}>{pos}</span>
                </div>
              );
            })}
          </div>

          {/* Placement Distribution Grid (1列 x 9行) - 使用渲染行索引映射到数据行索引 */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {Array(9).fill(null).map((_, renderRowIdx) => {
              const dataRowIdx = RENDER_TO_DATA_ROW[renderRowIdx];
              const usage = placementTotals[dataRowIdx];
              const isSelected = popover.visible && popover.type === 'placement' && popover.row === dataRowIdx;
              const isHighlightedRow = highlightedCell?.row === dataRowIdx;
              return (
                <div
                  key={`placement-${renderRowIdx}`}
                  onClick={(e) => handleCellClick(e, 'placement', dataRowIdx, 0)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: isHighlightedRow ? '#FFF8DC' : '#ffffff',
                    borderBottom: renderRowIdx < 8 ? '2px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: interactive ? 'pointer' : 'default',
                    // outline: isSelected ? '2px solid #3B82F6' : (isHighlightedRow ? '2px solid #95928dff' : 'none'),
                    outlineOffset: '-2px',
                    zIndex: isSelected || isHighlightedRow ? 1 : 0,
                  }}
                  onMouseEnter={(e) => interactive && !isHighlightedRow && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => interactive && !isHighlightedRow && (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  {usage > 0.03 && (
                    <div
                      style={{
                        width: getBlockSize(usage),
                        height: getBlockSize(usage),
                        backgroundColor: '#3B82F6',
                        opacity: getBlockOpacity(usage),
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Technique Labels + Technique Grid + Joint Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Technique Labels - 不需要marginLeft偏移，与下方grid对齐 */}
          <div style={{ display: 'flex', height: labelHeight }}>
            {TECHNIQUES.map((tech, colIdx) => {
              const isHighlightedCol = highlightedCell?.col === colIdx;
              return (
              <div
                key={tech}
                style={{
                  width: cellSize,
                  height: labelHeight,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  paddingBottom: '14px',
                  paddingLeft: '24px',
                }}
              >
                <span style={{
                  fontSize: '11px',
                  color: isHighlightedCol ? '#FFA500' : '#696969',
                  whiteSpace: 'nowrap',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'left bottom',
                }}>
                  {tech}
                </span>
              </div>
              );
            })}
          </div>

          {/* Technique Distribution Grid (13列 x 1行) */}
          <div style={{ display: 'flex', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {techniqueDistribution.map((usage, colIdx) => {
              const isSelected = popover.visible && popover.type === 'technique' && popover.row === colIdx;
              const isHighlightedCol = highlightedCell?.col === colIdx;
              return (
                <div
                  key={`technique-${colIdx}`}
                  onClick={(e) => handleCellClick(e, 'technique', colIdx, 0)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: isHighlightedCol ? '#FFF8DC' : '#ffffff',
                    borderRight: colIdx < 12 ? '2px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: interactive ? 'pointer' : 'default',
                    // outline: isSelected ? '2px solid #3B82F6' : (isHighlightedCol ? '2px solid #FFA500' : 'none'),
                    outlineOffset: '-2px',
                    zIndex: isSelected || isHighlightedCol ? 1 : 0,
                  }}
                  onMouseEnter={(e) => interactive && !isHighlightedCol && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => interactive && !isHighlightedCol && (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  {usage > 0.03 && (
                    <div
                      style={{
                        width: getBlockSize(usage),
                        height: getBlockSize(usage),
                        backgroundColor: '#FFB700',
                        opacity: getBlockOpacity(usage),
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Gap between technique and joint */}
          <div style={{ height: `${gridGap}px` }} />

          {/* Joint Distribution Grid (13列 x 9行) - 使用渲染行索引映射到数据行索引 */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {Array(9).fill(null).map((_, renderRowIdx) => {
              const dataRowIdx = RENDER_TO_DATA_ROW[renderRowIdx];
              return (
              <div key={renderRowIdx} style={{ display: 'flex' }}>
                {(placementDistribution[dataRowIdx] || Array(13).fill(0)).map((usage, colIdx) => {
                  const winRate = winRateDistribution[dataRowIdx]?.[colIdx] || 0.5;
                  const isSelected = popover.visible && 
                    popover.type === 'joint' && 
                    popover.row === dataRowIdx && 
                    popover.col === colIdx;
                  // 高亮：当右边表格悬浮时，高亮对应的行或列（使用数据行索引比较）
                  const isHighlightedRow = highlightedCell?.row === dataRowIdx;
                  const isHighlightedCol = highlightedCell?.col === colIdx;
                  const isHighlighted = isHighlightedRow || isHighlightedCol;
                  const isExactCell = isHighlightedRow && isHighlightedCol;
                  return (
                    <div
                      key={`joint-${renderRowIdx}-${colIdx}`}
                      onClick={(e) => handleCellClick(e, 'joint', dataRowIdx, colIdx)}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isExactCell ? '#FFE4B5' : (isHighlighted ? '#FFF8DC' : '#ffffff'),
                        borderRight: colIdx < 12 ? '2px solid #e5e7eb' : 'none',
                        borderBottom: renderRowIdx < 8 ? '2px solid #e5e7eb' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: interactive ? 'pointer' : 'default',
                        outline: isSelected ? '2px solid #3B82F6' : (isExactCell ? '2px solid #FFA500' : 'none'),
                        outlineOffset: '-2px',
                        zIndex: isSelected || isExactCell ? 1 : 0,
                      }}
                      onMouseEnter={(e) => interactive && !isHighlighted && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => interactive && !isHighlighted && (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {usage > 0.03 && (
                        <div
                          style={{
                            width: getBlockSize(usage),
                            height: getBlockSize(usage),
                            backgroundColor: '#C011FF',
                            opacity: getBlockOpacity(winRate),
                          }}
                          title={`Win Rate: ${winRate.toFixed(1)}%`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionGrid;
