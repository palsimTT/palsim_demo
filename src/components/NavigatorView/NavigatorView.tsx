import { useRef, useMemo } from 'react';
import { MATCHES } from '../../data/matchIndex';

export interface StrokeDisplayInfo {
  key: string;
  index: number;
  player: 'player0' | 'player1';
  playerName: string;
  videoPosition: 'up' | 'down';
  strokeTech: string;
  ballPlacement: string;
}

interface NavigatorViewProps {
  videoUrl?: string;
  strokes: StrokeDisplayInfo[];
  selectedStrokeIndex: number | null; // 1-based stroke index, null means no selection
  onStrokeSelect: (strokeIndex: number) => void;
  // 新增：Match/Game/Rally选择
  selectedMatchId: string;
  selectedGameNo: number;
  selectedRallyNo: number;
  onMatchChange: (matchId: string) => void;
  onGameChange: (gameNo: number) => void;
  onRallyChange: (rallyNo: number) => void;
  // 新增：胜者信息
  winSide?: 'player0' | 'player1';
  winnerVideoPosition?: 'up' | 'down';
}

const NavigatorView = ({
  videoUrl,
  strokes,
  selectedStrokeIndex,
  onStrokeSelect,
  selectedMatchId,
  selectedGameNo,
  selectedRallyNo,
  onMatchChange,
  onGameChange,
  onRallyChange,
  winnerVideoPosition,
}: NavigatorViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 获取当前Match的Game列表
  const currentMatch = useMemo(() => 
    MATCHES.find(m => m.id === selectedMatchId), 
    [selectedMatchId]
  );
  
  // 获取当前Game的Rally列表
  const currentGame = useMemo(() => 
    currentMatch?.games.find(g => g.id === selectedGameNo),
    [currentMatch, selectedGameNo]
  );

  // 视频已切分为独立片段，不再需要时间限制
  const handleLoadedMetadata = () => {
    // 视频从头开始播放
  };

  const handleTimeUpdate = () => {
    // 不再限制播放范围
  };
  
  const handleSeeking = () => {
    // 不再限制拖动范围
  };
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '3px solid #696969',
      backgroundColor: '#fff',
    }}>
      {/* 标题栏 + 选择器 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          backgroundColor: '#696969',
          color: '#fff',
          padding: '6px 16px',
          fontSize: '20px',
          fontWeight: 600,
          fontFamily: 'Gill Sans, sans-serif',
        }}>
          Navigator View
        </div>
        
        {/* Match选择器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Match:</span>
          <select
            value={selectedMatchId}
            onChange={(e) => onMatchChange(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {MATCHES.map(match => (
              <option key={match.id} value={match.id}>
                {match.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Game选择器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Game:</span>
          <select
            value={selectedGameNo}
            onChange={(e) => onGameChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {currentMatch?.games.map(game => (
              <option key={game.id} value={game.id}>
                {game.id}
              </option>
            ))}
          </select>
        </div>
        
        {/* Rally选择器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>Rally:</span>
          <select
            value={selectedRallyNo}
            onChange={(e) => onRallyChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {currentGame?.rallies.map(rallyNo => (
              <option key={rallyNo} value={rallyNo}>
                {rallyNo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 视频区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        backgroundColor: '#000',
        minHeight: 0,
      }}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '8px',
            }}
            controls={true}
          />
        ) : (
          <div style={{ color: '#fff', fontSize: '14px' }}>No video available</div>
        )}
      </div>

      {/* Stroke选择区域 - 中间横线代表球桌，上下交错三角形，尖角朝中 */}
      <div style={{
        padding: '6px 12px',
        borderTop: '3px solid #696969',
        overflow: 'visible',
      }}>
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center',
          height: '36px',
          overflow: 'visible',
        }}>
          {/* 左侧Up标签 */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: '2px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#666',
          }}>
            Up
          </div>
          
          {/* 左侧Down标签 */}
          <div style={{
            position: 'absolute',
            left: 0,
            bottom: '2px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#666',
          }}>
            Down
          </div>
          
          {/* 中间区域：横线 + 三角形 */}
          <div style={{
            flex: 1,
            marginLeft: '80px',
            marginRight: '60px',
            position: 'relative',
            height: '100%',
            overflow: 'visible',
          }}>
            {/* 中间横线 - 代表球桌 */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#696969',
              top: '50%',
              transform: 'translateY(-50%)',
            }} />
            
            {/* Stroke三角形 + 真实动作标签 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}>
              {strokes.map((stroke) => {
                const isSelected = stroke.index === selectedStrokeIndex;
                const isUp = stroke.videoPosition === 'up';
                const isDisabled = stroke.index === 1; // 禁止分析stroke1
                const positionRatio =
                  strokes.length > 1
                    ? (stroke.index - 1) / (strokes.length - 1)
                    : 0;

                const isLast = stroke.index === strokes.length;
                // 真实动作标签：ST_BP格式，如果ballPlacement为空则只显示ST
                const actionLabel = stroke.ballPlacement 
                  ? `${stroke.strokeTech.slice(0, 4)}_${stroke.ballPlacement}`
                  : stroke.strokeTech.slice(0, 4);
                
                // 第一个元素左对齐，最后一个元素右对齐，其他居中
                const isFirst = stroke.index === 1;
                
                return (
                  <div
                    key={stroke.key}
                    onClick={() => !isDisabled && onStrokeSelect(stroke.index)}
                    title={isDisabled ? 'Cannot analyze first stroke' : `${stroke.playerName}: ${stroke.strokeTech} -> ${stroke.ballPlacement}`}
                    style={{
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      position: 'absolute',
                      ...(isLast 
                        ? { right: 0 } 
                        : { left: `${positionRatio * 100}%`, transform: isFirst ? 'translateX(0)' : 'translateX(-50%)' }
                      ),
                      top: '0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center',
                      height: '100%',
                    }}
                  >
                    {isUp ? (
                      // 上方球员：三角形在上半部分，标签在下半部分
                      <>
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'flex-end',
                          paddingBottom: '2px',
                        }}>
                          <svg width="14" height="12" viewBox="0 0 14 12">
                            <polygon
                              points="7,12 14,0 0,0"
                              fill={isSelected ? '#000' : '#aeaeaeff'}
                            />
                          </svg>
                        </div>
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          paddingTop: '4px',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: isSelected ? '#000' : '#888',
                            fontWeight: isSelected ? 600 : 400,
                            whiteSpace: 'nowrap',
                          }}>
                            {actionLabel}
                          </span>
                        </div>
                      </>
                    ) : (
                      // 下方球员：标签在上半部分，三角形在下半部分
                      <>
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'flex-end',
                          paddingBottom: '4px',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: isSelected ? '#000' : '#888',
                            fontWeight: isSelected ? 600 : 400,
                            whiteSpace: 'nowrap',
                          }}>
                            {actionLabel}
                          </span>
                        </div>
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          paddingTop: '2px',
                        }}>
                          <svg width="14" height="12" viewBox="0 0 14 12">
                            <polygon
                              points="7,0 14,12 0,12"
                              fill={isSelected ? '#000' : '#aeaeaeff'}
                            />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* 胜者标记：绿色圆点 */}
              {winnerVideoPosition && strokes.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    marginLeft: '35px',
                    top: winnerVideoPosition === 'up' ? '25%' : '75%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 4px rgba(34, 197, 94, 0.5)',
                  }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigatorView;
