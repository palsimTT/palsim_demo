// AdjustmentGrid - 显示adjustment幅度的网格，与DistributionGrid布局一致
// 颜色代表增减：绿色=增加，红色=减少，颜色浓度代表幅度

import { useMemo, useState } from 'react';
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

interface AdjustmentGridProps {
  adjustmentMatrix: number[][] | null;
  adjustedWinRate?: number; // 调整后的胜率
  interactive?: boolean;
  onCellUp?: (type: string, row: number, col: number) => void;
  onCellDown?: (type: string, row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void; // 悬浮回调
  onCellLeave?: () => void; // 离开回调
}

const ZONE_LABELS = ['Short', 'Half-long', 'Long'];
const POSITION_LABELS = ['B', 'M', 'F'];

// 数据行顺序 (BP_LABELS): BH(0), BL(1), BS(2), FH(3), FL(4), FS(5), MH(6), ML(7), MS(8)
// 渲染行顺序 (Zone+Position): BS(0), MS(1), FS(2), BH(3), MH(4), FH(5), BL(6), ML(7), FL(8)
// 映射：渲染行索引 -> 数据行索引
const RENDER_TO_DATA_ROW = [2, 8, 5, 0, 6, 3, 1, 7, 4];

const AdjustmentGrid = ({
  adjustmentMatrix,
  adjustedWinRate,
  interactive = false,
  onCellUp,
  onCellDown,
  onCellHover,
  onCellLeave,
}: AdjustmentGridProps) => {
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
  const gridGap = 14;
  const labelHeight = 65;

  // 计算边缘分布的adjustment
  const { stAdjustments, bpAdjustments } = useMemo(() => {
    if (!adjustmentMatrix) return { stAdjustments: Array(13).fill(0), bpAdjustments: Array(9).fill(0) };
    
    const stAdj = Array(13).fill(0);
    for (let st = 0; st < 13; st++) {
      for (let bp = 0; bp < 9; bp++) {
        stAdj[st] += adjustmentMatrix[bp]?.[st] || 0;
      }
    }
    
    const bpAdj = adjustmentMatrix.map(row => row.reduce((a, b) => a + b, 0));
    
    return { stAdjustments: stAdj, bpAdjustments: bpAdj };
  }, [adjustmentMatrix]);

  if (!adjustmentMatrix) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No adjustment data
      </div>
    );
  }

  const maxAbs = Math.max(
    ...adjustmentMatrix.flat().map(v => Math.abs(v)),
    ...stAdjustments.map(v => Math.abs(v)),
    ...bpAdjustments.map(v => Math.abs(v)),
    0.001
  );

  const getColor = (value: number) => {
    const normalizedAbs = Math.min(Math.abs(value) / maxAbs, 1);
    const alpha = 0.3 + normalizedAbs * 0.7;
    
    if (value > 0.0001) {
      return `rgba(1, 167, 12, ${alpha})`;
    } else if (value < -0.0001) {
      return `rgba(193, 7, 7, ${alpha})`;
    }
    // 未调整的方块显示白色
    return '#fff';
  };

  const handleCellClick = (
    e: React.MouseEvent,
    type: 'technique' | 'placement' | 'joint',
    row: number,
    col: number
  ) => {
    if (!interactive) return;
    // 直接使用鼠标点击的视口位置
    setPopover({
      visible: true,
      row,
      col,
      type,
      x: e.clientX,
      y: e.clientY,
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

  return (
    <div data-adjustment-grid style={{ position: 'relative', display: 'inline-flex', paddingBottom: '16px' }}>
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
        {adjustedWinRate !== undefined && (
          <div style={{
            backgroundColor: '#ffffffff',
            color: '#000000ff',
            fontSize: '22px',
            fontWeight: 400,
            padding: '6px 16px',
            display: 'inline-block',
            minWidth: '80px',
            textAlign: 'center',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          }}>
            {(adjustedWinRate * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'flex', gap: `${gridGap}px` }}>
        
        {/* Left: Placement Labels + BP Marginal */}
        <div style={{ display: 'flex', gap: '4px', marginTop: labelHeight + cellSize + gridGap }}>
          {/* Zone Labels (竖排) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ZONE_LABELS.map((zone) => (
              <div
                key={zone}
                style={{
                  height: cellSize * 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                }}
              >
                <span style={{
                  fontSize: '12px',
                  color: '#696969',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap',
                }}>
                  {zone}
                </span>
              </div>
            ))}
          </div>

          {/* Position Labels (B, M, F) */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '10px' }}>
            {Array(3).fill(null).map((_, zoneIdx) => (
              POSITION_LABELS.map((pos) => (
                <div
                  key={`${zoneIdx}-${pos}`}
                  style={{
                    height: cellSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#696969' }}>{pos}</span>
                </div>
              ))
            ))}
          </div>

          {/* BP Marginal (1列 x 9行) - 使用渲染行索引映射到数据行索引 */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {Array(9).fill(null).map((_, renderRowIdx) => {
              const dataRowIdx = RENDER_TO_DATA_ROW[renderRowIdx];
              const adj = bpAdjustments[dataRowIdx];
              return (
                <div
                  key={`bp-${renderRowIdx}`}
                  onClick={(e) => handleCellClick(e, 'placement', dataRowIdx, 0)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: getColor(adj),
                    borderBottom: renderRowIdx < 8 ? '2px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: interactive ? 'pointer' : 'default',
                    fontSize: '12px',
                    color: Math.abs(adj) > maxAbs * 0.3 ? '#fff' : '#333',
                  }}
                  title={`BP ${dataRowIdx}: ${adj >= 0 ? '+' : ''}${(adj * 100).toFixed(2)}%`}
                >
                  {Math.abs(adj) > 0.001 && <span>{adj > 0 ? '+' : ''}{(adj * 100).toFixed(0)}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: ST Labels + ST Marginal + Joint Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* ST Labels - 不需要marginLeft偏移，与下方grid对齐 */}
          <div style={{ display: 'flex', height: labelHeight }}>
            {TECHNIQUES.map((tech) => (
              <div key={tech} style={{
                width: cellSize,
                height: labelHeight,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
                paddingBottom: '14px',
                paddingLeft: '24px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#696969',
                  whiteSpace: 'nowrap',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'left bottom',
                }}>
                  {tech}
                </span>
              </div>
            ))}
          </div>

          {/* ST Marginal (13列 x 1行) */}
          <div style={{ display: 'flex', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {stAdjustments.map((adj, colIdx) => (
              <div
                key={`st-${colIdx}`}
                onClick={(e) => handleCellClick(e, 'technique', colIdx, 0)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: getColor(adj),
                  borderRight: colIdx < 12 ? '2px solid #e5e7eb' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: interactive ? 'pointer' : 'default',
                  fontSize: '11px',
                  color: Math.abs(adj) > maxAbs * 0.3 ? '#fff' : '#333',
                }}
                title={`${TECHNIQUES[colIdx]}: ${adj >= 0 ? '+' : ''}${(adj * 100).toFixed(2)}%`}
              >
                {Math.abs(adj) > 0.001 && <span>{adj > 0 ? '+' : ''}{(adj * 100).toFixed(0)}</span>}
              </div>
            ))}
          </div>

          <div style={{ height: `${gridGap}px` }} />

          {/* Joint Grid (13列 x 9行) - 使用渲染行索引映射到数据行索引 */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            {Array(9).fill(null).map((_, renderRowIdx) => {
              const dataRowIdx = RENDER_TO_DATA_ROW[renderRowIdx];
              const row = adjustmentMatrix[dataRowIdx];
              return (
                <div key={renderRowIdx} style={{ display: 'flex' }}>
                  {row.map((value, colIdx) => (
                    <div
                      key={`joint-${renderRowIdx}-${colIdx}`}
                      onClick={(e) => handleCellClick(e, 'joint', dataRowIdx, colIdx)}
                      onMouseEnter={() => onCellHover?.(dataRowIdx, colIdx)}
                      onMouseLeave={() => onCellLeave?.()}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(value),
                        borderRight: colIdx < 12 ? '2px solid #e5e7eb' : 'none',
                        borderBottom: renderRowIdx < 8 ? '2px solid #e5e7eb' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: interactive ? 'pointer' : 'default',
                        fontSize: '11px',
                        color: Math.abs(value) > maxAbs * 0.3 ? '#fff' : '#333',
                        fontWeight: Math.abs(value) > maxAbs * 0.5 ? 600 : 400,
                      }}
                      title={`${TECHNIQUES[colIdx]} x Row${dataRowIdx}: ${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`}
                    >
                      {Math.abs(value) > 0.001 && <span>{value > 0 ? '+' : ''}{(value * 100).toFixed(1)}</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentGrid;
