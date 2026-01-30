// 上下文列表项类型
export interface ContextItem {
  id: string;
  winRate: number;
  description: string;
}

// 网格单元格数据类型
export interface CellData {
  usage: number;  // 0-1, 使用率，决定方块大小
  winRate: number; // 0-1, 胜率，决定透明度
}

// Predictor/Simulator 数据类型
export interface PredictionData {
  id: string;
  overallWinRate: number;
  techniqueDistribution: number[]; // 13个技术的分布
  placementDistribution: number[][]; // 9行(落点) x 13列(技术) 的联合分布
}

// 模拟日志项类型
export interface SimulationLogItem {
  id: string;
  winRate: number;
  description: string;
  // 存储完整的simulator状态，用于恢复
  simulatorState?: {
    overallWinRate: number;
    techniqueDistribution: number[];
    placementDistribution: number[][];
    winRateDistribution: number[][];
    joint: number[][];
  };
}

// Feature Impact 数据类型
export interface FeatureImpactItem {
  id: string;
  name: string;
  impact: number; // 影响值
}

// 击球技术列表（按字母顺序，与JSON数据一致）
export const TECHNIQUES = [
  'Attack', 'Block', 'Chopping', 'Flick', 'Lob',
  'Others', 'PimpleTech', 'Push', 'Short', 'Slide',
  'Smash', 'Topspin', 'Twist'
] as const;

// 击球落点列表
export const PLACEMENTS = [
  { zone: 'Long', position: 'B' },
  { zone: 'Long', position: 'M' },
  { zone: 'Long', position: 'F' },
  { zone: 'Half-Long', position: 'B' },
  { zone: 'Half-Long', position: 'M' },
  { zone: 'Half-Long', position: 'F' },
  { zone: 'Short', position: 'B' },
  { zone: 'Short', position: 'M' },
  { zone: 'Short', position: 'F' },
] as const;
