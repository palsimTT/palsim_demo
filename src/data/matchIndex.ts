// Match/Game/Rally 数据索引

export interface MatchInfo {
  id: string;           // 日期格式：20180526
  name: string;         // 比赛名称
  videoFile: string;    // 视频文件名
  games: GameInfo[];
}

export interface GameInfo {
  id: number;           // Game编号：1, 2, 3...
  rallies: number[];    // Rally编号列表：[1, 2, 3...]
}

// 视频文件映射
export const VIDEO_FILES: Record<string, string> = {
  '20180526': '20180526 中国香港公开赛 女单半决赛 王曼昱vs伊藤美诚-video.mp4',
  '20180602': '20180602 中国公开赛 女单半决赛 王曼昱vs伊藤美诚-video.mp4',
  '20180610': '20180610 日本公开赛 女单决赛 王曼昱vs伊藤美诚-video.mp4',
  '20190602': '20190602 中国公开赛 女单半决赛 王曼昱vs伊藤美诚-video.mp4',
  '20190706': '20190706 韩国公开赛 女单四分之一决赛 王曼昱vs伊藤美诚-video.mp4',
  '20191005': '20191005 瑞典公开赛 女单四分之一决赛 王曼昱vs伊藤美诚-video.mp4',
};

// Match列表 - 只包含有分析数据的案例
// 当前有数据的案例：
// 20180602_G2_R12, 20180602_G3_R6
// 20180610_G3_R1, 20180610_G3_R12, 20180610_G4_R5, 20180610_G5_R12
// 20190602_G1_R18, 20190602_G5_R10
// 20191005_G1_R1, 20191005_G3_R14
export const MATCHES: MatchInfo[] = [
  {
    id: '20180602',
    name: '2018中国公开赛',
    videoFile: VIDEO_FILES['20180602'],
    games: [
      { id: 2, rallies: [12] },
      { id: 3, rallies: [6] },
    ],
  },
  {
    id: '20180610',
    name: '2018日本公开赛',
    videoFile: VIDEO_FILES['20180610'],
    games: [
      { id: 3, rallies: [12] },
      { id: 4, rallies: [5] },
    ],
  },
  {
    id: '20190602',
    name: '2019中国公开赛',
    videoFile: VIDEO_FILES['20190602'],
    games: [
      { id: 5, rallies: [10] },
    ],
  },
  {
    id: '20191005',
    name: '2019瑞典公开赛',
    videoFile: VIDEO_FILES['20191005'],
    games: [
      { id: 1, rallies: [1] },
      { id: 3, rallies: [14] },
    ],
  },
];

// 获取Rally数据文件路径
export function getRallyDataPath(matchId: string, gameNo: number, rallyNo: number): string {
  return `rally_analysis_output_v2/${matchId}_G${gameNo}_R${rallyNo}_updated.json`;
}

// 获取Stroke分析文件路径
export function getStrokeAnalysisPath(matchId: string, gameNo: number, rallyNo: number, strokeNo: number): string {
  return `rally_analysis_output_v2/${matchId}_G${gameNo}_R${rallyNo}/stroke${strokeNo}_analysis.json`;
}
