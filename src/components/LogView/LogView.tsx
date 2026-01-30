import removeIcon from '../../assets/remove.png';

// 来自stroke分析文件的推荐数据结构
export interface ActionRecommendation {
  st: string;
  bp: string;
  prob: number;
  winrate: number;
  winrate_change: number;
  rank: number;
}

// 用户手动添加的调整
export interface ExpertAdjustment {
  id: string;
  description: string;
  winRate: number;
  jointMatrix?: number[][]; // 保存该记录对应的joint状态
}

interface LogViewProps {
  top5Recommendations: ActionRecommendation[]; // Integrated Adjustment
  frequentButLosing: ActionRecommendation[];   // High-Usage Pitfalls
  rareButWinning: ActionRecommendation[];      // Heuristic Opportunities
  expertAdjustments: ExpertAdjustment[];       // Expert Adjustment (用户手动)
  selectedExpertId: string | null;
  selectedRecommendationIdx: number | null; // 选中的推荐项索引
  onSelectExpert: (id: string) => void;
  onSelectRecommendation: (idx: number) => void; // 选中推荐项
  onAddExpertAdjustment: () => void;
  onDeleteExpertAdjustment: (id: string) => void; // 删除Expert记录
  onAddModelAdjustment?: (item: ActionRecommendation) => void; // 从Integrated复制到Expert
  baselineWinrate?: number;
  // 打勾状态
  checkedIntegrated?: Set<number>;
  checkedPitfalls?: Set<number>;
  checkedOpportunities?: Set<number>;
  onToggleIntegrated?: (idx: number) => void;
  onTogglePitfall?: (idx: number) => void;
  onToggleOpportunity?: (idx: number) => void;
}

// 推荐项组件 - 用于Integrated Adjustment，显示winrate_change
const RecommendationItem = ({ 
  item,
  isSelected,
  onClick,
  isChecked,
  onToggleCheck,
}: { 
  item: ActionRecommendation;
  isSelected?: boolean;
  onClick?: () => void;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}) => {
  // winrate_change 是小数形式，转换为百分比
  const changePct = (item.winrate_change || 0) * 100;
  const isPositive = changePct >= 0;
  
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid #eee',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isSelected ? '#C011FF' : '#fff',
      }}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: 500,
        minWidth: '60px',
        color: isSelected ? '#fff' : '#000',
      }}>
        {(item.winrate * 100).toFixed(1)}%
      </div>
      <div style={{ flex: 1, fontSize: '14px', color: isSelected ? '#fff' : '#333' }}>
        {item.st} {item.bp}
      </div>
      <div style={{
        fontSize: '14px',
        color: isSelected ? '#fff' : (isPositive ? '#01A70C' : '#C10707'),
        minWidth: '60px',
        textAlign: 'right',
      }}>
        {isPositive ? '+' : ''}{changePct.toFixed(2)}%
      </div>
      {onToggleCheck && (
        <input
          type="checkbox"
          checked={isChecked || false}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#30C72E',
          }}
        />
      )}
    </div>
  );
};

// 简化推荐项组件 - 用于中间两个区域（High-Usage Pitfalls和Heuristic Opportunities）
// 不显示winrate_change，用颜色区分正负
const SimpleRecommendationItem = ({ 
  item,
  colorType, // 'red' for pitfalls, 'green' for opportunities
  isChecked,
  onToggleCheck,
}: { 
  item: ActionRecommendation;
  colorType: 'red' | 'green';
  isChecked?: boolean;
  onToggleCheck?: () => void;
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid #eee',
        cursor: 'default',
        backgroundColor: '#fff',
      }}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: 500,
        minWidth: '60px',
        color: colorType === 'red' ? '#C10707' : '#01A70C',
      }}>
        {(item.winrate * 100).toFixed(1)}%
      </div>
      <div style={{ flex: 1, fontSize: '14px', color: '#333' }}>
        {item.st} {item.bp}
      </div>
      {onToggleCheck && (
        <input
          type="checkbox"
          checked={isChecked || false}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: colorType === 'red' ? '#C10707' : '#01A70C',
          }}
        />
      )}
    </div>
  );
};

// Expert调整项组件
const ExpertItem = ({ 
  item, 
  isSelected, 
  onClick,
  onDelete,
}: { 
  item: ExpertAdjustment; 
  isSelected: boolean; 
  onClick: () => void;
  onDelete: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #eee',
      backgroundColor: isSelected ? '#30C72E' : 'transparent',
    }}
  >
    <div style={{
      fontSize: '18px',
      fontWeight: 500,
      minWidth: '60px',
      color: isSelected ? '#fff' : '#000',
    }}>
      {item.winRate.toFixed(1)}%
    </div>
    <div style={{
      fontSize: '14px',
      flex: 1,
      color: isSelected ? '#fff' : '#666',
    }}>
      {item.description}
    </div>
    <img
      src={removeIcon}
      alt="Delete"
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      style={{
        width: '20px',
        height: '20px',
        cursor: 'pointer',
        opacity: 0.6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
    />
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div style={{
    padding: '10px 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    borderBottom: '1px solid #CAC4D0',
    backgroundColor: '#f5f5f5',
  }}>
    {title}
  </div>
);

const LogView = ({
  top5Recommendations,
  frequentButLosing,
  rareButWinning,
  expertAdjustments,
  selectedExpertId,
  selectedRecommendationIdx,
  onSelectExpert,
  onSelectRecommendation,
  onAddExpertAdjustment,
  onDeleteExpertAdjustment,
  onAddModelAdjustment,
  checkedIntegrated,
  checkedPitfalls,
  checkedOpportunities,
  onToggleIntegrated,
  onTogglePitfall,
  onToggleOpportunity,
}: LogViewProps) => {
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
        width: 'fit-content',
        fontFamily: 'Gill Sans, sans-serif',
      }}>
        Log View
      </div>

      {/* 滚动区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Integrated Adjustment (top5_recommendations) */}
        <SectionHeader title="Integrated Adjustment" />
        <div>
          {top5Recommendations.length > 0 ? (
            top5Recommendations.map((item, idx) => (
              <RecommendationItem 
                key={`top5-${idx}`} 
                item={item}
                isSelected={selectedRecommendationIdx === idx}
                onClick={() => onSelectRecommendation(idx)}
                isChecked={checkedIntegrated?.has(idx)}
                onToggleCheck={onToggleIntegrated ? () => {
                  onToggleIntegrated(idx);
                  // 打勾时复制到Expert Adjustment
                  if (!checkedIntegrated?.has(idx) && onAddModelAdjustment) {
                    onAddModelAdjustment(item);
                  }
                } : undefined}
              />
            ))
          ) : (
            <div style={{ padding: '12px 16px', color: '#999' }}>No recommendations</div>
          )}
        </div>

        {/* High-Usage Pitfalls (frequent_but_losing) - 红色数字，不显示变化 */}
        <SectionHeader title="High-Usage Pitfalls" />
        <div>
          {frequentButLosing.length > 0 ? (
            frequentButLosing.map((item, idx) => (
              <SimpleRecommendationItem 
                key={`pitfall-${idx}`} 
                item={item}
                colorType="red"
                isChecked={checkedPitfalls?.has(idx)}
                onToggleCheck={onTogglePitfall ? () => onTogglePitfall(idx) : undefined}
              />
            ))
          ) : (
            <div style={{ padding: '12px 16px', color: '#999' }}>No pitfalls detected</div>
          )}
        </div>

        {/* Heuristic Opportunities (rare_but_winning) - 绿色数字，不显示变化 */}
        <SectionHeader title="Heuristic Opportunities" />
        <div>
          {rareButWinning.length > 0 ? (
            rareButWinning.map((item, idx) => (
              <SimpleRecommendationItem 
                key={`opportunity-${idx}`} 
                item={item}
                colorType="green"
                isChecked={checkedOpportunities?.has(idx)}
                onToggleCheck={onToggleOpportunity ? () => onToggleOpportunity(idx) : undefined}
              />
            ))
          ) : (
            <div style={{ padding: '12px 16px', color: '#999' }}>No opportunities found</div>
          )}
        </div>

        {/* Expert Adjustment (用户手动添加) */}
        <SectionHeader title="Expert Adjustment" />
        <div>
          {expertAdjustments.map(item => (
            <ExpertItem
              key={item.id}
              item={item}
              isSelected={selectedExpertId === item.id}
              onClick={() => onSelectExpert(item.id)}
              onDelete={() => onDeleteExpertAdjustment(item.id)}
            />
          ))}
          
          {/* Add New Button - 在Expert Adjustment section内 */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={onAddExpertAdjustment}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px dashed #696969',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: '#696969',
              }}
            >
              + Add New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogView;
