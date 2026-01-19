import { useMemo, useState } from 'react';

// 每个stroke的top5推荐action
export interface StrokeTopActions {
  strokeIndex: number;
  strokeKey: string;
  playerName: string;
  actualAction?: { st: string; bp: string }; // 实际的action
  topActions: Array<{
    st: string;
    bp: string;
    prob: number; // 使用概率
  }>;
  flowToNext?: Record<string, number>; // 到下一拍的转移概率 "(ST->BP) -> (ST->BP)": prob
  isPast: boolean; // 是否是选中stroke之前的stroke
}

interface RallyViewProps {
  strokesData: StrokeTopActions[]; // 每个stroke的top5 actions
  selectedStrokeIndex: number | null; // 当前选中的stroke (1-based), null means no selection
  onStrokeSelect?: (strokeIndex: number) => void;
}

// ACTION_COLORS已不再使用，改为白色背景+灰色进度条样式

const RallyView = ({ strokesData, selectedStrokeIndex }: RallyViewProps) => {
  // 布局参数 - 放大1.8倍
  const scale = 1.5;
  const nodeWidth = Math.round(110 * scale);
  const nodeGap = Math.round(40 * scale);
  const nodeHeight = Math.round(36 * scale);
  const nodeVerticalGap = Math.round(6 * scale);
  const paddingTop = Math.round(50 * scale);
  const paddingLeft = Math.round(15 * scale);
  
  // 高亮状态：存储被高亮的节点key
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  
  // 处理显示数据：所有stroke显示top5（forward propagation数据）
  const displayData = useMemo(() => {
    return strokesData.map((stroke) => {
      return {
        ...stroke,
        displayActions: stroke.topActions.slice(0, 5),
      };
    });
  }, [strokesData]);

  // 计算每个stroke的节点位置（用于桑基图）
  const nodePositions = useMemo(() => {
    const positions: Map<string, { x: number; y: number; height: number }> = new Map();
    
    displayData.forEach((stroke, strokeIdx) => {
      const x = paddingLeft + strokeIdx * (nodeWidth + nodeGap);
      let currentY = paddingTop;
      
      stroke.displayActions.forEach((_, actIdx) => {
        // 节点高度固定，不根据概率变化
        const height = nodeHeight;
        const key = `${strokeIdx}-${actIdx}`;
        positions.set(key, { x, y: currentY, height });
        currentY += height + nodeVerticalGap;
      });
    });
    
    return positions;
  }, [displayData]);

  // 计算桑基图连接 - past strokes使用全连接，其他使用flowToNext数据
  const sankeyLinks = useMemo(() => {
    if (displayData.length < 2) return [];
    
    const links: Array<{
      sourceKey: string;
      targetKey: string;
      value: number;
      sourceX: number;
      sourceY: number;
      sourceHeight: number;
      targetX: number;
      targetY: number;
      targetHeight: number;
      isPastLink: boolean;
    }> = [];
    
    for (let i = 0; i < displayData.length - 1; i++) {
      const source = displayData[i];
      const target = displayData[i + 1];
      const isPastLink = source.isPast && target.isPast;
      
      source.displayActions.forEach((srcAction, srcIdx) => {
        target.displayActions.forEach((tgtAction, tgtIdx) => {
          let value: number;
          
          if (isPastLink) {
            // past strokes之间：全连接，使用固定值
            value = 1;
          } else if (source.flowToNext) {
            // 使用flowToNext数据
            const flowKey = `(${srcAction.st}->${srcAction.bp}) -> (${tgtAction.st}->${tgtAction.bp})`;
            value = source.flowToNext[flowKey] || 0;
          } else {
            value = 0;
          }
          
          if (value > 0.001) {
            const srcPos = nodePositions.get(`${i}-${srcIdx}`);
            const tgtPos = nodePositions.get(`${i + 1}-${tgtIdx}`);
            
            if (srcPos && tgtPos) {
              links.push({
                sourceKey: `${i}-${srcIdx}`,
                targetKey: `${i + 1}-${tgtIdx}`,
                value,
                sourceX: srcPos.x + nodeWidth,
                sourceY: srcPos.y,
                sourceHeight: srcPos.height,
                targetX: tgtPos.x,
                targetY: tgtPos.y,
                targetHeight: tgtPos.height,
                isPastLink,
              });
            }
          }
        });
      });
    }
    
    return links;
  }, [displayData, nodePositions]);

  const svgWidth = displayData.length * nodeWidth + (displayData.length - 1) * nodeGap + paddingLeft * 2;
  // 增加底部padding避免方块被遮挡
  const svgHeight = paddingTop + Math.round(250 * scale);

  // 获取action的显示标签
  const getActionLabel = (action: { st: string; bp: string }) => {
    return `${action.st.slice(0, 5)} ${action.bp}`;
  };

  // 生成桑基图路径（梯形连接）
  const generateSankeyPath = (
    x1: number, y1: number, h1: number,
    x2: number, y2: number, h2: number,
    value: number,
    isPastLink: boolean
  ) => {
    // past link使用固定宽度，其他使用value计算
    let bandHeight1: number;
    let bandHeight2: number;
    
    if (isPastLink) {
      bandHeight1 = h1 * 0.8;
      bandHeight2 = h2 * 0.8;
    } else {
      bandHeight1 = Math.max(3, Math.min(h1 * 0.8, value * 150));
      bandHeight2 = Math.max(3, Math.min(h2 * 0.8, value * 150));
    }
    
    const cy1 = y1 + h1 / 2;
    const cy2 = y2 + h2 / 2;
    const controlX = (x1 + x2) / 2;
    
    // 生成填充的路径（上下两条曲线闭合）
    return `
      M ${x1} ${cy1 - bandHeight1 / 2}
      C ${controlX} ${cy1 - bandHeight1 / 2}, ${controlX} ${cy2 - bandHeight2 / 2}, ${x2} ${cy2 - bandHeight2 / 2}
      L ${x2} ${cy2 + bandHeight2 / 2}
      C ${controlX} ${cy2 + bandHeight2 / 2}, ${controlX} ${cy1 + bandHeight1 / 2}, ${x1} ${cy1 + bandHeight1 / 2}
      Z
    `;
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '3px solid #696969',
      backgroundColor: '#fff',
    }}>
      {/* 标题栏 */}
      <div style={{
        backgroundColor: '#696969',
        color: '#fff',
        padding: '6px 16px',
        fontSize: '20px',
        fontWeight: 600,
        fontFamily: 'Gill Sans, sans-serif',
        width: 'fit-content',
      }}>
        Rally View
      </div>

      {/* 桑基图区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
        {displayData.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No stroke data available
          </div>
        ) : (
          <svg key={`sankey-${displayData.length}-${displayData.map(d => d.strokeKey).join('-')}`} width={svgWidth} height={svgHeight} style={{ minWidth: '100%' }}>
            {/* 绘制桑基图连接带 */}
            {sankeyLinks.map((link, idx) => {
              // 检查是否需要高亮这个连接
              const isHighlighted = highlightedNode && 
                (link.sourceKey === highlightedNode || link.targetKey === highlightedNode);
              
              return (
                <path
                  key={idx}
                  d={generateSankeyPath(
                    link.sourceX, link.sourceY, link.sourceHeight,
                    link.targetX, link.targetY, link.targetHeight,
                    link.value,
                    link.isPastLink
                  )}
                  fill={isHighlighted ? '#333' : '#999'}
                  opacity={isHighlighted ? 0.8 : 0.3}
                />
              );
            })}
            
            {/* 绘制每个stroke的节点 */}
            {displayData.map((stroke, strokeIdx) => {
              const isSelected = selectedStrokeIndex !== null && stroke.strokeIndex === selectedStrokeIndex;
              const isPast = selectedStrokeIndex !== null && stroke.strokeIndex < selectedStrokeIndex;
              
              return (
                <g key={strokeIdx}>
                  {/* Stroke标签 */}
                  <text
                    x={paddingLeft + strokeIdx * (nodeWidth + nodeGap) + nodeWidth / 2}
                    y={Math.round(18 * scale)}
                    textAnchor="middle"
                    fontSize={Math.round(11 * scale)}
                    fontWeight="bold"
                    fill={isSelected ? '#C011FF' : '#333'}
                  >
                    S{stroke.strokeIndex}
                  </text>
                  <text
                    x={paddingLeft + strokeIdx * (nodeWidth + nodeGap) + nodeWidth / 2}
                    y={Math.round(38 * scale)}
                    textAnchor="middle"
                    fontSize={Math.round(10 * scale)}
                    fill="#666"
                  >
                    {stroke.playerName.slice(0, 8)}
                  </text>
                  
                  {/* Action节点 - 白色背景+黑色边框+圆角+灰色进度条 */}
                  {stroke.displayActions.map((action, actIdx) => {
                    const pos = nodePositions.get(`${strokeIdx}-${actIdx}`);
                    if (!pos) return null;
                    
                    const isActual = stroke.actualAction && 
                      action.st === stroke.actualAction.st && 
                      action.bp === stroke.actualAction.bp;
                    
                    // 计算进度条宽度（使用绝对概率，不是相对概率）
                    // 概率直接映射到宽度，100%概率 = 满宽度
                    const progressWidth = action.prob * nodeWidth;
                    
                    return (
                      <g
                        key={actIdx}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const nodeKey = `${strokeIdx}-${actIdx}`;
                          setHighlightedNode(highlightedNode === nodeKey ? null : nodeKey);
                        }}
                      >
                        {/* 白色背景 */}
                        <rect
                          x={pos.x}
                          y={pos.y}
                          width={nodeWidth}
                          height={pos.height}
                          fill="#fff"
                          stroke={isSelected ? '#C011FF' : '#333'}
                          strokeWidth={isSelected ? 2 : 1}
                          rx={10}
                        />
                        {/* 灰色进度条（从左到右） */}
                        {progressWidth > 0 && (
                          <rect
                            x={pos.x + 1}
                            y={pos.y + 1}
                            width={Math.max(0, progressWidth - 2)}
                            height={pos.height - 2}
                            fill={isPast ? '#999' : '#d0d0d0'}
                            rx={9}
                          />
                        )}
                        {/* 重绘边框确保在进度条上方 */}
                        <rect
                          x={pos.x}
                          y={pos.y}
                          width={nodeWidth}
                          height={pos.height}
                          fill="none"
                          stroke={isSelected ? '#C011FF' : '#333'}
                          strokeWidth={isSelected ? 2 : 1}
                          rx={10}
                        />
                        <text
                          x={pos.x + nodeWidth / 2}
                          y={pos.y + pos.height / 2 + Math.round(4 * scale)}
                          textAnchor="middle"
                          fontSize={Math.round(10 * scale)}
                          fill="#333"
                          fontWeight={isActual ? 'bold' : 'normal'}
                        >
                          {getActionLabel(action)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default RallyView;
