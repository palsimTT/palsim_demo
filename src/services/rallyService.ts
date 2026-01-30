// Rally 和 Stroke 分析数据服务

// 类型定义
export interface PlayerInfo {
  name: string;
  video_position: 'up' | 'down';
}

export interface StrokeInfo {
  player: 'player0' | 'player1';
  strokeTech: string;
  ballPlacement: string;
  context: string;
}

export interface RallyMetaInfo {
  matchName: string;
  gameNo: number;
  rallyNo: number;
  player0: PlayerInfo;
  player1: PlayerInfo;
  startPlayer: string;
  winSide: string;
  startTime: number;
  endTime: number;
}

export interface RallyData {
  meta_info: RallyMetaInfo;
  rally_info: Record<string, StrokeInfo>;
}

export interface ActionRecommendation {
  st: string;
  bp: string;
  prob: number;
  winrate: number;
  winrate_change: number;
  winrate_change_pct: number;
  rank: number;
}

export interface StrokeAnalysis {
  context: Record<string, string>;
  actual_action: {
    st: string;
    bp: string;
    rank: number;
    info: ActionRecommendation;
  };
  baseline_winrate: number;
  st_probs: Record<string, number>;
  bp_probs: Record<string, number>;
  joint_distribution: {
    st_labels: string[];
    bp_labels: string[];
    matrix: number[][];
  };
  winrate_matrix: number[][];
  top5_recommendations: ActionRecommendation[];
  frequent_but_losing: ActionRecommendation[];
  rare_but_winning: ActionRecommendation[];
  avg_winrate: number;
  stroke_key: string;
  player: string;
  player_name: string;
  model_used: string;
}

// 动态导入 example 文件夹中的数据
const rallyModules = import.meta.glob('/src/example/*.json', { eager: true });
const strokeModules = import.meta.glob('/src/example/*/*.json', { eager: true });

// 加载 Rally 数据
export function loadRallyData(rallyId: string): RallyData | null {
  const path = `/src/example/${rallyId}.json`;
  const module = rallyModules[path] as { default: RallyData } | undefined;
  return module?.default ?? null;
}

// 加载 Stroke 分析数据
export function loadStrokeAnalysis(rallyId: string, strokeKey: string): StrokeAnalysis | null {
  const path = `/src/example/${rallyId}/${strokeKey}_analysis.json`;
  const module = strokeModules[path] as { default: StrokeAnalysis } | undefined;
  return module?.default ?? null;
}

// 获取所有可用的 Rally ID
export function getAvailableRallies(): string[] {
  const rallies: string[] = [];
  for (const path of Object.keys(rallyModules)) {
    const match = path.match(/\/src\/example\/([^/]+)\.json$/);
    if (match) {
      rallies.push(match[1]);
    }
  }
  return rallies;
}

// 从 Rally 数据中获取 stroke 列表
export function getStrokesFromRally(rallyData: RallyData): Array<{
  key: string;
  index: number;
  player: 'player0' | 'player1';
  playerName: string;
  videoPosition: 'up' | 'down';
  strokeTech: string;
  ballPlacement: string;
}> {
  const strokes: Array<{
    key: string;
    index: number;
    player: 'player0' | 'player1';
    playerName: string;
    videoPosition: 'up' | 'down';
    strokeTech: string;
    ballPlacement: string;
  }> = [];

  const rallyInfo = rallyData.rally_info;
  const keys = Object.keys(rallyInfo).sort((a, b) => {
    const numA = parseInt(a.replace('stroke', ''));
    const numB = parseInt(b.replace('stroke', ''));
    return numA - numB;
  });

  for (const key of keys) {
    const stroke = rallyInfo[key];
    const playerKey = stroke.player as 'player0' | 'player1';
    const playerInfo = rallyData.meta_info[playerKey];
    
    strokes.push({
      key,
      index: parseInt(key.replace('stroke', '')),
      player: playerKey,
      playerName: playerInfo.name,
      videoPosition: playerInfo.video_position,
      strokeTech: stroke.strokeTech,
      ballPlacement: stroke.ballPlacement,
    });
  }

  return strokes;
}
