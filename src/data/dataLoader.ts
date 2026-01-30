// 动态数据加载器

// Rally数据类型
export interface RallyData {
  meta_info: {
    matchName: string;
    gameNo: number;
    rallyNo: number;
    player0: { name: string; video_position: 'up' | 'down' };
    player1: { name: string; video_position: 'up' | 'down' };
    startPlayer: string;
    winSide: string;
    startTime: number;
    endTime: number;
  };
  rally_info: Record<string, {
    player: string;
    strokeTech: string;
    ballPlacement: string;
    context: string;
    analysis_file: string;
  }>;
}

// Stroke分析数据类型
export interface StrokeAnalysisData {
  stroke_key: string;
  stroke_index: number;
  player: string;
  context: {
    't-2': string | null;
    't-1': string | null;
  };
  actual_action: {
    st: string;
    bp: string;
    rank: number | null;
    info: {
      st: string;
      bp: string;
      prob: number;
      winrate: number;
      winrate_change: number;
    } | null;
  };
  baseline_winrate: number;
  avg_winrate: number;
  current_stroke_analysis: {
    top_k_distribution: { st: string; bp: string; prob: number }[];
    st_probs: Record<string, number>;
    bp_probs: Record<string, number>;
    joint_distribution: number[][];
    winrate_matrix: number[][];
  };
  top5_recommendations: {
    st: string;
    bp: string;
    prob: number;
    winrate: number;
    winrate_change: number;
  }[];
  frequent_but_losing: {
    st: string;
    bp: string;
    prob: number;
    winrate: number;
    winrate_change: number;
  }[];
  rare_but_winning: {
    st: string;
    bp: string;
    prob: number;
    winrate: number;
    winrate_change: number;
  }[];
  forward_propagation: {
    stroke_idx: number;
    stroke_key: string;
    player: string;
    model: string;
    top_k_distribution: { st: string; bp: string; prob: number }[];
    st_probs: Record<string, number>;
    bp_probs: Record<string, number>;
    top5_to_top5_flow: Record<string, number>;
  }[];
}

// 使用Vite的glob导入预加载所有JSON文件
const rallyDataModules = import.meta.glob('../example/rally_analysis_output_v2/*_updated.json');
const strokeAnalysisModules = import.meta.glob('../example/rally_analysis_output_v2/*/stroke*_analysis.json');

// 动态导入Rally数据
export async function loadRallyData(matchId: string, gameNo: number, rallyNo: number): Promise<RallyData> {
  const path = `../example/rally_analysis_output_v2/${matchId}_G${gameNo}_R${rallyNo}_updated.json`;
  const loader = rallyDataModules[path];
  if (!loader) {
    throw new Error(`Rally data not found: ${path}`);
  }
  const module = await loader() as { default: RallyData };
  return module.default;
}

// 动态导入Stroke分析数据
export async function loadStrokeAnalysis(matchId: string, gameNo: number, rallyNo: number, strokeNo: number): Promise<StrokeAnalysisData> {
  const path = `../example/rally_analysis_output_v2/${matchId}_G${gameNo}_R${rallyNo}/stroke${strokeNo}_analysis.json`;
  const loader = strokeAnalysisModules[path];
  if (!loader) {
    throw new Error(`Stroke analysis not found: ${path}`);
  }
  const module = await loader() as { default: StrokeAnalysisData };
  return module.default;
}

// 获取Rally视频URL（使用切分后的视频片段）
export function getVideoUrl(matchId: string, gameNo: number, rallyNo: number): string {
  // 返回切分后的rally视频片段，使用public目录
  // import.meta.env.BASE_URL 会自动处理base路径
  return `${import.meta.env.BASE_URL}rally_clips/${matchId}_G${gameNo}_R${rallyNo}.mp4`;
}
