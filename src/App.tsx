import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header, NavigatorView, RallyView, LogView, AdjustmentView } from './components';
import { LoadingOverlay, ScaledContainer } from './components/shared';
import type { StrokeDisplayInfo } from './components/NavigatorView/NavigatorView';
import type { ExpertAdjustment, ActionRecommendation } from './components/LogView/LogView';
import { MATCHES } from './data/matchIndex';
import { loadRallyData, loadStrokeAnalysis, getVideoUrl } from './data/dataLoader';
import type { RallyData } from './data/dataLoader';

// Top K分布项
interface TopKDistributionItem {
  st: string;
  bp: string;
  prob: number;
}

// Forward Propagation项（后续拍的预测）
interface ForwardPropagationItem {
  stroke_idx: number;
  stroke_key: string;
  player: string;
  model: string;
  top_k_distribution: TopKDistributionItem[];
  st_probs: Record<string, number>;
  bp_probs: Record<string, number>;
  top5_to_top5_flow: Record<string, number>; // 桑基图连接数据
}

// 当前拍的分析数据
interface CurrentStrokeAnalysis {
  top_k_distribution: TopKDistributionItem[];
  st_probs: Record<string, number>;
  bp_probs: Record<string, number>;
  joint_distribution: number[][]; // 9(BP) x 13(ST) 矩阵
  winrate_matrix: number[][]; // 13(ST) x 9(BP) 矩阵
}

// Stroke分析数据类型（新格式）
interface StrokeAnalysisData {
  stroke_key: string;
  stroke_index: number;
  player: string;
  player_name: string;
  model_used: string;
  context: {
    't-2': string | null;
    't-1': string | null;
  };
  actual_action: {
    st: string;
    bp: string;
    rank: number | null;
    info: ActionRecommendation | null;
  };
  baseline_winrate: number;
  avg_winrate: number;
  current_stroke_analysis: CurrentStrokeAnalysis;
  top5_recommendations: ActionRecommendation[];
  frequent_but_losing: ActionRecommendation[];
  rare_but_winning: ActionRecommendation[];
  forward_propagation: ForwardPropagationItem[];
}

// 默认Match/Game/Rally - 使用第一个有数据的案例
const DEFAULT_MATCH_ID = '20180602';
const DEFAULT_GAME_NO = 2;
const DEFAULT_RALLY_NO = 12;

type PredictionDataType = {
  overallWinRate: number;
  techniqueDistribution: number[];
  placementDistribution: number[][];
  winRateDistribution: number[][];
};

function App() {
  // Match/Game/Rally选择状态
  const [selectedMatchId, setSelectedMatchId] = useState<string>(DEFAULT_MATCH_ID);
  const [selectedGameNo, setSelectedGameNo] = useState<number>(DEFAULT_GAME_NO);
  const [selectedRallyNo, setSelectedRallyNo] = useState<number>(DEFAULT_RALLY_NO);
  
  // Rally数据
  const [rallyData, setRallyData] = useState<RallyData | null>(null);
  const [strokeAnalysisMap, setStrokeAnalysisMap] = useState<Record<string, StrokeAnalysisData>>({});
  const [strokes, setStrokes] = useState<StrokeDisplayInfo[]>([]);
  const [selectedStrokeIndex, setSelectedStrokeIndex] = useState<number | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<StrokeAnalysisData | null>(null);
  
  // 视频URL（使用切分后的rally视频片段）
  const videoUrl = useMemo(() => getVideoUrl(selectedMatchId, selectedGameNo, selectedRallyNo), [selectedMatchId, selectedGameNo, selectedRallyNo]);
  
  // Expert调整（用户手动添加）- 按stroke分开存储
  const [expertAdjustmentsByStroke, setExpertAdjustmentsByStroke] = useState<Record<number, ExpertAdjustment[]>>({});
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  
  // 当前stroke的expertAdjustments
  const expertAdjustments = selectedStrokeIndex !== null ? (expertAdjustmentsByStroke[selectedStrokeIndex] || []) : [];
  const setExpertAdjustments = useCallback((updater: ExpertAdjustment[] | ((prev: ExpertAdjustment[]) => ExpertAdjustment[])) => {
    if (selectedStrokeIndex === null) return;
    setExpertAdjustmentsByStroke(prev => {
      const current = prev[selectedStrokeIndex] || [];
      const newValue = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [selectedStrokeIndex]: newValue };
    });
  }, [selectedStrokeIndex]);
  
  // 选中的推荐项索引
  const [selectedRecommendationIdx, setSelectedRecommendationIdx] = useState<number | null>(null);
  
  // 打勾状态 - 按stroke分开存储
  const [checkedByStroke, setCheckedByStroke] = useState<Record<number, {
    integrated: Set<number>;
    pitfalls: Set<number>;
    opportunities: Set<number>;
  }>>({});
  
  // 当前stroke的打勾状态
  const currentChecked = selectedStrokeIndex !== null ? checkedByStroke[selectedStrokeIndex] : undefined;
  const checkedIntegrated = currentChecked?.integrated || new Set<number>();
  const checkedPitfalls = currentChecked?.pitfalls || new Set<number>();
  const checkedOpportunities = currentChecked?.opportunities || new Set<number>();
  
  // Adjustment View数据
  const [predictionData, setPredictionData] = useState<PredictionDataType | null>(null);
  const [baseJoint, setBaseJoint] = useState<number[][] | null>(null); // 原始joint矩阵
  const [currentJoint, setCurrentJoint] = useState<number[][] | null>(null); // 当前调整后的joint
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // 加载Rally数据和Stroke分析数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingMessage('Loading rally data...');
      
      try {
        // 加载Rally数据
        const rally = await loadRallyData(selectedMatchId, selectedGameNo, selectedRallyNo);
        setRallyData(rally);
        
        const meta = rally.meta_info;
        const rallyInfo = rally.rally_info;
        
        // 提取strokes
        const strokeList: StrokeDisplayInfo[] = [];
        const keys = Object.keys(rallyInfo).sort((a, b) => {
          const numA = parseInt(a.replace('stroke', ''));
          const numB = parseInt(b.replace('stroke', ''));
          return numA - numB;
        });
        
        // 名字映射：中文转英文
        const nameMap: Record<string, string> = {
          '王曼昱': 'Wang Manyu',
          '伊藤美诚': 'Mima ITO',
        };
        
        for (const key of keys) {
          const stroke = rallyInfo[key];
          const playerKey = stroke.player as 'player0' | 'player1';
          const playerInfo = meta[playerKey];
          const englishName = nameMap[playerInfo.name] || playerInfo.name;
          
          strokeList.push({
            key,
            index: parseInt(key.replace('stroke', '')),
            player: playerKey,
            playerName: englishName,
            videoPosition: playerInfo.video_position,
            strokeTech: stroke.strokeTech,
            ballPlacement: stroke.ballPlacement,
          });
        }
        
        setStrokes(strokeList);
        
        // 加载所有stroke的分析数据
        setLoadingMessage('Loading stroke analysis...');
        const analysisMap: Record<string, StrokeAnalysisData> = {};
        
        for (const key of keys) {
          const strokeNo = parseInt(key.replace('stroke', ''));
          try {
            const analysis = await loadStrokeAnalysis(selectedMatchId, selectedGameNo, selectedRallyNo, strokeNo);
            analysisMap[key] = analysis as unknown as StrokeAnalysisData;
          } catch (e) {
            console.warn(`Failed to load ${key} analysis:`, e);
          }
        }
        
        setStrokeAnalysisMap(analysisMap);
        
        // 默认选中stroke2
        if (strokeList.length >= 2) {
          setSelectedStrokeIndex(2);
        } else if (strokeList.length > 0) {
          setSelectedStrokeIndex(1);
        }
        
        // 清除选中状态
        setSelectedExpertId(null);
        setSelectedRecommendationIdx(null);
        setExpertAdjustmentsByStroke({});
        
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedMatchId, selectedGameNo, selectedRallyNo]);

  // ST和BP标签（固定顺序）
  const ST_LABELS = [
    'Attack', 'Block', 'Chopping', 'Flick', 'Lob',
    'Others', 'PimpleTech', 'Push', 'Short', 'Slide',
    'Smash', 'Topspin', 'Twist'
  ];
  const BP_LABELS = ['BH', 'BL', 'BS', 'FH', 'FL', 'FS', 'MH', 'ML', 'MS'];

  // 当选中的stroke变化时，加载对应的分析数据
  useEffect(() => {
    const strokeKey = `stroke${selectedStrokeIndex}`;
    const analysis = strokeAnalysisMap[strokeKey];
    
    if (analysis) {
      setCurrentAnalysis(analysis);
      
      const csa = analysis.current_stroke_analysis;
      // joint_distribution 是 13(ST) x 9(BP) 矩阵，需要转置为 9x13
      const jointMatrixRaw = csa.joint_distribution; // 13x9
      // winrate_matrix 是 13(ST) x 9(BP) 矩阵
      const winMatrix = csa.winrate_matrix; // 13x9
      
      // 转置joint_distribution: 从13x9转为9x13
      const jointMatrix: number[][] = [];
      for (let bp = 0; bp < BP_LABELS.length; bp++) {
        const row: number[] = [];
        for (let st = 0; st < ST_LABELS.length; st++) {
          row.push(jointMatrixRaw[st]?.[bp] || 0);
        }
        jointMatrix.push(row);
      }
      
      // 计算technique分布
      const techniqueDistribution = ST_LABELS.map((st) => 
        (csa.st_probs[st] || 0) * 100
      );
      
      // placementDistribution 现在是 9x13 格式
      const placementDistribution = jointMatrix.map(row => row.map(v => v * 100));
      
      // winRateDistribution 需要从 13x9 转为 9x13
      const winRateDistribution: number[][] = [];
      for (let bp = 0; bp < BP_LABELS.length; bp++) {
        const winRow: number[] = [];
        for (let st = 0; st < ST_LABELS.length; st++) {
          winRow.push((winMatrix[st]?.[bp] || 0) * 100);
        }
        winRateDistribution.push(winRow);
      }
      
      const predData: PredictionDataType = {
        overallWinRate: analysis.baseline_winrate * 100,
        techniqueDistribution,
        placementDistribution,
        winRateDistribution,
      };
      
      setPredictionData(predData);
      
      // joint矩阵现在是 9x13 格式
      setBaseJoint(jointMatrix.map(r => [...r]));
      setCurrentJoint(jointMatrix.map(r => [...r]));
    } else {
      setCurrentAnalysis(null);
      setPredictionData(null);
      setBaseJoint(null);
      setCurrentJoint(null);
    }
  }, [selectedStrokeIndex, strokeAnalysisMap]);

  // 处理stroke选择 - 切换时清除选中状态
  const handleStrokeSelect = useCallback((strokeIndex: number) => {
    setSelectedStrokeIndex(strokeIndex);
    setSelectedExpertId(null);
    setSelectedRecommendationIdx(null);
  }, []);

  // 处理Match/Game/Rally变更
  const handleMatchChange = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    // 重置Game和Rally为第一个
    const match = MATCHES.find(m => m.id === matchId);
    if (match && match.games.length > 0) {
      setSelectedGameNo(match.games[0].id);
      if (match.games[0].rallies.length > 0) {
        setSelectedRallyNo(match.games[0].rallies[0]);
      }
    }
    // 清空打勾状态
    setCheckedByStroke({});
  }, []);

  const handleGameChange = useCallback((gameNo: number) => {
    setSelectedGameNo(gameNo);
    // 重置Rally为第一个
    const match = MATCHES.find(m => m.id === selectedMatchId);
    const game = match?.games.find(g => g.id === gameNo);
    if (game && game.rallies.length > 0) {
      setSelectedRallyNo(game.rallies[0]);
    }
    // 清空打勾状态
    setCheckedByStroke({});
  }, [selectedMatchId]);

  const handleRallyChange = useCallback((rallyNo: number) => {
    setSelectedRallyNo(rallyNo);
    // 清空打勾状态
    setCheckedByStroke({});
  }, []);

  // 刷新adjustment数据（重置为原始值，并更新当前选中的Expert记录）
  const handleRefreshAdjustment = useCallback(() => {
    if (!baseJoint || !currentAnalysis) return;
    
    const jointCopy = baseJoint.map(r => [...r]);
    setCurrentJoint(jointCopy);
    
    // 如果当前选中了Expert记录，也要更新其内部数据
    if (selectedExpertId) {
      const baseWinRate = currentAnalysis.baseline_winrate * 100;
      setExpertAdjustments(prev => prev.map(e => 
        e.id === selectedExpertId 
          ? { ...e, winRate: baseWinRate, jointMatrix: jointCopy }
          : e
      ));
    }
    
    // 清除recommendation选择
    setSelectedRecommendationIdx(null);
  }, [baseJoint, currentAnalysis, selectedExpertId, setExpertAdjustments]);

  // 添加专家调整 - 初始化为基线状态
  const handleAddExpertAdjustment = useCallback(() => {
    if (!baseJoint || !currentAnalysis) return;
    
    // 使用baseline_winrate作为初始胜率
    const baseWinRate = currentAnalysis.baseline_winrate;
    const jointCopy = baseJoint.map(r => [...r]);
    
    const newAdjustment: ExpertAdjustment = {
      id: `expert-${Date.now()}`,
      description: 'Manual adjustment',
      winRate: baseWinRate * 100,
      jointMatrix: jointCopy, // 保存初始状态
    };
    setExpertAdjustments(prev => [...prev, newAdjustment]);
    setSelectedExpertId(newAdjustment.id);
    setSelectedRecommendationIdx(null);
    setCurrentJoint(jointCopy);
  }, [baseJoint, currentAnalysis]);

  // 从Integrated Adjustment添加Model Adjustment到Expert Adjustment
  const handleAddModelAdjustment = useCallback((item: ActionRecommendation) => {
    if (!currentAnalysis) return;
    
    const newAdjustment: ExpertAdjustment = {
      id: `model-${Date.now()}`,
      description: `Model: ${item.st} ${item.bp}`,
      winRate: item.winrate * 100,
    };
    setExpertAdjustments(prev => [...prev, newAdjustment]);
  }, [currentAnalysis, setExpertAdjustments]);

  // 切换打勾状态的处理函数
  const handleToggleIntegrated = useCallback((idx: number) => {
    if (selectedStrokeIndex === null) return;
    setCheckedByStroke(prev => {
      const current = prev[selectedStrokeIndex] || {
        integrated: new Set<number>(),
        pitfalls: new Set<number>(),
        opportunities: new Set<number>(),
      };
      const newIntegrated = new Set(current.integrated);
      if (newIntegrated.has(idx)) {
        newIntegrated.delete(idx);
      } else {
        newIntegrated.add(idx);
      }
      return {
        ...prev,
        [selectedStrokeIndex]: { ...current, integrated: newIntegrated },
      };
    });
  }, [selectedStrokeIndex]);

  const handleTogglePitfall = useCallback((idx: number) => {
    if (selectedStrokeIndex === null) return;
    setCheckedByStroke(prev => {
      const current = prev[selectedStrokeIndex] || {
        integrated: new Set<number>(),
        pitfalls: new Set<number>(),
        opportunities: new Set<number>(),
      };
      const newPitfalls = new Set(current.pitfalls);
      if (newPitfalls.has(idx)) {
        newPitfalls.delete(idx);
      } else {
        newPitfalls.add(idx);
      }
      return {
        ...prev,
        [selectedStrokeIndex]: { ...current, pitfalls: newPitfalls },
      };
    });
  }, [selectedStrokeIndex]);

  const handleToggleOpportunity = useCallback((idx: number) => {
    if (selectedStrokeIndex === null) return;
    setCheckedByStroke(prev => {
      const current = prev[selectedStrokeIndex] || {
        integrated: new Set<number>(),
        pitfalls: new Set<number>(),
        opportunities: new Set<number>(),
      };
      const newOpportunities = new Set(current.opportunities);
      if (newOpportunities.has(idx)) {
        newOpportunities.delete(idx);
      } else {
        newOpportunities.add(idx);
      }
      return {
        ...prev,
        [selectedStrokeIndex]: { ...current, opportunities: newOpportunities },
      };
    });
  }, [selectedStrokeIndex]);

  // 删除专家调整
  const handleDeleteExpertAdjustment = useCallback((id: string) => {
    setExpertAdjustments(prev => prev.filter(e => e.id !== id));
    // 如果删除的是当前选中的，清除选中状态
    if (selectedExpertId === id) {
      setSelectedExpertId(null);
      // 恢复到基线状态
      if (baseJoint) {
        setCurrentJoint(baseJoint.map(r => [...r]));
      }
    }
  }, [selectedExpertId, baseJoint, setExpertAdjustments]);

  // 选择专家调整 - 恢复该记录保存的joint状态
  const handleSelectExpert = useCallback((id: string) => {
    setSelectedExpertId(id);
    setSelectedRecommendationIdx(null);
    // 查找对应的Expert记录，恢复其jointMatrix
    const expert = expertAdjustments.find(e => e.id === id);
    if (expert?.jointMatrix) {
      setCurrentJoint(expert.jointMatrix.map(r => [...r]));
    } else if (baseJoint) {
      setCurrentJoint(baseJoint.map(r => [...r]));
    }
  }, [baseJoint, expertAdjustments]);

  // 选择推荐项 - 只显示该recommendation的调整，不修改currentJoint
  const handleSelectRecommendation = useCallback((idx: number) => {
    setSelectedRecommendationIdx(idx);
    setSelectedExpertId(null);
  }, []);

  // 处理cell调整
  const handleCellUp = useCallback((type: string, row: number, col: number) => {
    if (!baseJoint || !currentAnalysis) return;
    
    // 如果当前选中的是Integrated Adjustment，先基于recommendation初始化newJoint
    let newJoint: number[][];
    const recommendations = currentAnalysis.top5_recommendations || [];
    
    if (selectedRecommendationIdx !== null) {
      const rec = recommendations[selectedRecommendationIdx];
      newJoint = baseJoint.map(r => [...r]);
      
      if (rec) {
        const stIdx = ST_LABELS.indexOf(rec.st);
        const bpIdx = BP_LABELS.indexOf(rec.bp);
        
        if (stIdx !== -1 && bpIdx !== -1) {
          // rec.prob是归一化后的概率，真正的delta需要用公式计算
          // delta = (C + 4 * B * tp * (1 - tp)) / 100, C=1, B=5
          const C_rec = 1, B_rec = 5;
          const tp = baseJoint[bpIdx][stIdx];
          const recDelta = (C_rec + 4 * B_rec * tp * (1 - tp)) / 100;
          
          // 增加该位置的概率
          newJoint[bpIdx][stIdx] += recDelta;
          
          // 其他位置按比例减少
          const totalOther = baseJoint.flat().reduce((a, b) => a + b, 0) - baseJoint[bpIdx][stIdx];
          if (totalOther > 0) {
            for (let bp = 0; bp < 9; bp++) {
              for (let st = 0; st < 13; st++) {
                if (bp !== bpIdx || st !== stIdx) {
                  const scale = baseJoint[bp][st] / totalOther;
                  newJoint[bp][st] -= recDelta * scale;
                }
              }
            }
          }
        }
      }
    } else {
      newJoint = currentJoint ? currentJoint.map(r => [...r]) : baseJoint.map(r => [...r]);
    }
    
    // 使用与机器推荐一致的调整公式：delta = (C + 4 * B * tp * (1 - tp)) / 100, C=1, B=5
    const C = 1, B = 5;
    
    if (type === 'joint') {
      const oldVal = newJoint[row][col];
      const delta = (C + 4 * B * oldVal * (1 - oldVal)) / 100;
      const newVal = Math.min(oldVal + delta, 1);
      
      if (newVal > oldVal) {
        // 其他元素的总和
        const otherSum = newJoint.flat().reduce((a, b) => a + b, 0) - oldVal;
        // 其他元素需要缩放到 (1 - newVal)
        const scale = otherSum > 0 ? (1 - newVal) / otherSum : 1;
        for (let i = 0; i < newJoint.length; i++) {
          for (let j = 0; j < newJoint[i].length; j++) {
            if (i === row && j === col) {
              newJoint[i][j] = newVal;
            } else {
              newJoint[i][j] *= scale;
            }
          }
        }
      }
    } else if (type === 'technique') {
      // 调整某个ST的边缘分布，按比例作用到该ST对应的所有BP
      const stIdx = row; // row是ST的索引
      // 计算该ST的当前边缘概率
      let stMarginal = 0;
      for (let bp = 0; bp < 9; bp++) {
        stMarginal += newJoint[bp][stIdx];
      }
      
      const delta = (C + 4 * B * stMarginal * (1 - stMarginal)) / 100;
      const newMarginal = Math.min(stMarginal + delta, 1);
      
      if (newMarginal > stMarginal && stMarginal > 0) {
        // 该ST的所有BP按比例增加
        const stScale = newMarginal / stMarginal;
        for (let bp = 0; bp < 9; bp++) {
          newJoint[bp][stIdx] *= stScale;
        }
        // 其他ST需要缩放到 (1 - newMarginal)
        let otherSum = 0;
        for (let bp = 0; bp < 9; bp++) {
          for (let st = 0; st < 13; st++) {
            if (st !== stIdx) {
              otherSum += newJoint[bp][st];
            }
          }
        }
        const otherScale = otherSum > 0 ? (1 - newMarginal) / otherSum : 1;
        for (let bp = 0; bp < 9; bp++) {
          for (let st = 0; st < 13; st++) {
            if (st !== stIdx) {
              newJoint[bp][st] *= otherScale;
            }
          }
        }
      }
    } else if (type === 'placement') {
      // 调整某个BP的边缘分布，按比例作用到该BP对应的所有ST
      const bpIdx = row; // row是BP的索引
      // 计算该BP的当前边缘概率
      let bpMarginal = 0;
      for (let st = 0; st < 13; st++) {
        bpMarginal += newJoint[bpIdx][st];
      }
      
      const delta = (C + 4 * B * bpMarginal * (1 - bpMarginal)) / 100;
      const newMarginal = Math.min(bpMarginal + delta, 1);
      
      if (newMarginal > bpMarginal && bpMarginal > 0) {
        // 该BP的所有ST按比例增加
        const bpScale = newMarginal / bpMarginal;
        for (let st = 0; st < 13; st++) {
          newJoint[bpIdx][st] *= bpScale;
        }
        // 其他BP需要缩放到 (1 - newMarginal)
        let otherSum = 0;
        for (let bp = 0; bp < 9; bp++) {
          if (bp !== bpIdx) {
            for (let st = 0; st < 13; st++) {
              otherSum += newJoint[bp][st];
            }
          }
        }
        const otherScale = otherSum > 0 ? (1 - newMarginal) / otherSum : 1;
        for (let bp = 0; bp < 9; bp++) {
          if (bp !== bpIdx) {
            for (let st = 0; st < 13; st++) {
              newJoint[bp][st] *= otherScale;
            }
          }
        }
      }
    }
    
    // 直接计算加权平均胜率
    const winMatrix = currentAnalysis.current_stroke_analysis.winrate_matrix;
    let finalWinRate = 0;
    for (let bp = 0; bp < newJoint.length; bp++) {
      for (let st = 0; st < newJoint[bp].length; st++) {
        finalWinRate += newJoint[bp][st] * (winMatrix[st]?.[bp] || 0);
      }
    }
    finalWinRate *= 100;
    
    // 如果当前选中的是Integrated Adjustment，自动创建Expert Adjustment
    if (selectedRecommendationIdx !== null) {
      const rec = recommendations[selectedRecommendationIdx];
      const newExpert: ExpertAdjustment = {
        id: `expert-${Date.now()}`,
        description: `Based on ${rec?.st}-${rec?.bp}`,
        winRate: finalWinRate,
        jointMatrix: newJoint.map(r => [...r]),
      };
      setExpertAdjustments(prev => [...prev, newExpert]);
      setSelectedExpertId(newExpert.id);
      setSelectedRecommendationIdx(null);
    } else if (selectedExpertId) {
      // 更新当前选中的Expert记录
      setExpertAdjustments(prev => prev.map(e => 
        e.id === selectedExpertId 
          ? { ...e, winRate: finalWinRate, jointMatrix: newJoint.map(r => [...r]) }
          : e
      ));
    } else {
      // 没有选中任何记录时，自动创建新的Expert记录
      const newExpert: ExpertAdjustment = {
        id: `expert-${Date.now()}`,
        description: 'Manual adjustment',
        winRate: finalWinRate,
        jointMatrix: newJoint.map(r => [...r]),
      };
      setExpertAdjustments(prev => [...prev, newExpert]);
      setSelectedExpertId(newExpert.id);
    }
    
    setCurrentJoint(newJoint);
  }, [baseJoint, currentJoint, currentAnalysis, selectedRecommendationIdx, selectedExpertId, setExpertAdjustments]);

  const handleCellDown = useCallback((type: string, row: number, col: number) => {
    if (!baseJoint || !currentAnalysis) return;
    
    // 如果当前选中的是Integrated Adjustment，先基于recommendation初始化newJoint
    let newJoint: number[][];
    const recommendations = currentAnalysis.top5_recommendations || [];
    
    if (selectedRecommendationIdx !== null) {
      const rec = recommendations[selectedRecommendationIdx];
      newJoint = baseJoint.map(r => [...r]);
      
      if (rec) {
        const stIdx = ST_LABELS.indexOf(rec.st);
        const bpIdx = BP_LABELS.indexOf(rec.bp);
        
        if (stIdx !== -1 && bpIdx !== -1) {
          // rec.prob是归一化后的概率，真正的delta需要用公式计算
          // delta = (C + 4 * B * tp * (1 - tp)) / 100, C=1, B=5
          const C_rec = 1, B_rec = 5;
          const tp = baseJoint[bpIdx][stIdx];
          const recDelta = (C_rec + 4 * B_rec * tp * (1 - tp)) / 100;
          
          // 增加该位置的概率
          newJoint[bpIdx][stIdx] += recDelta;
          
          // 其他位置按比例减少
          const totalOther = baseJoint.flat().reduce((a, b) => a + b, 0) - baseJoint[bpIdx][stIdx];
          if (totalOther > 0) {
            for (let bp = 0; bp < 9; bp++) {
              for (let st = 0; st < 13; st++) {
                if (bp !== bpIdx || st !== stIdx) {
                  const scale = baseJoint[bp][st] / totalOther;
                  newJoint[bp][st] -= recDelta * scale;
                }
              }
            }
          }
        }
      }
    } else {
      newJoint = currentJoint ? currentJoint.map(r => [...r]) : baseJoint.map(r => [...r]);
    }
    
    // 使用与机器推荐一致的调整公式：delta = (C + 4 * B * tp * (1 - tp)) / 100, C=1, B=5
    const C = 1, B = 5;
    
    if (type === 'joint') {
      const oldVal = newJoint[row][col];
      const delta = (C + 4 * B * oldVal * (1 - oldVal)) / 100;
      const newVal = Math.max(oldVal - delta, 0);
      
      if (newVal < oldVal) {
        // 其他元素的总和
        const otherSum = newJoint.flat().reduce((a, b) => a + b, 0) - oldVal;
        // 其他元素需要缩放到 (1 - newVal)
        const scale = otherSum > 0 ? (1 - newVal) / otherSum : 1;
        for (let i = 0; i < newJoint.length; i++) {
          for (let j = 0; j < newJoint[i].length; j++) {
            if (i === row && j === col) {
              newJoint[i][j] = newVal;
            } else {
              newJoint[i][j] *= scale;
            }
          }
        }
      }
    } else if (type === 'technique') {
      // 调整某个ST的边缘分布（减少），按比例作用到该ST对应的所有BP
      const stIdx = row;
      let stMarginal = 0;
      for (let bp = 0; bp < 9; bp++) {
        stMarginal += newJoint[bp][stIdx];
      }
      
      const delta = (C + 4 * B * stMarginal * (1 - stMarginal)) / 100;
      const newMarginal = Math.max(stMarginal - delta, 0);
      
      if (newMarginal < stMarginal && stMarginal > 0) {
        const stScale = newMarginal / stMarginal;
        for (let bp = 0; bp < 9; bp++) {
          newJoint[bp][stIdx] *= stScale;
        }
        // 其他ST需要缩放到 (1 - newMarginal)
        let otherSum = 0;
        for (let bp = 0; bp < 9; bp++) {
          for (let st = 0; st < 13; st++) {
            if (st !== stIdx) {
              otherSum += newJoint[bp][st];
            }
          }
        }
        const otherScale = otherSum > 0 ? (1 - newMarginal) / otherSum : 1;
        for (let bp = 0; bp < 9; bp++) {
          for (let st = 0; st < 13; st++) {
            if (st !== stIdx) {
              newJoint[bp][st] *= otherScale;
            }
          }
        }
      }
    } else if (type === 'placement') {
      // 调整某个BP的边缘分布（减少），按比例作用到该BP对应的所有ST
      const bpIdx = row;
      let bpMarginal = 0;
      for (let st = 0; st < 13; st++) {
        bpMarginal += newJoint[bpIdx][st];
      }
      
      const delta = (C + 4 * B * bpMarginal * (1 - bpMarginal)) / 100;
      const newMarginal = Math.max(bpMarginal - delta, 0);
      
      if (newMarginal < bpMarginal && bpMarginal > 0) {
        const bpScale = newMarginal / bpMarginal;
        for (let st = 0; st < 13; st++) {
          newJoint[bpIdx][st] *= bpScale;
        }
        // 其他BP需要缩放到 (1 - newMarginal)
        let otherSum = 0;
        for (let bp = 0; bp < 9; bp++) {
          if (bp !== bpIdx) {
            for (let st = 0; st < 13; st++) {
              otherSum += newJoint[bp][st];
            }
          }
        }
        const otherScale = otherSum > 0 ? (1 - newMarginal) / otherSum : 1;
        for (let bp = 0; bp < 9; bp++) {
          if (bp !== bpIdx) {
            for (let st = 0; st < 13; st++) {
              newJoint[bp][st] *= otherScale;
            }
          }
        }
      }
    }
    
    const winMatrix = currentAnalysis.current_stroke_analysis.winrate_matrix;
    
    // 直接计算加权平均胜率
    let finalWinRate = 0;
    for (let bp = 0; bp < newJoint.length; bp++) {
      for (let st = 0; st < newJoint[bp].length; st++) {
        finalWinRate += newJoint[bp][st] * (winMatrix[st]?.[bp] || 0);
      }
    }
    finalWinRate *= 100;
    
    // 如果当前选中的是Integrated Adjustment，自动创建Expert Adjustment
    if (selectedRecommendationIdx !== null) {
      const rec = recommendations[selectedRecommendationIdx];
      const newExpert: ExpertAdjustment = {
        id: `expert-${Date.now()}`,
        description: `Based on ${rec?.st}-${rec?.bp}`,
        winRate: finalWinRate,
        jointMatrix: newJoint.map(r => [...r]),
      };
      setExpertAdjustments(prev => [...prev, newExpert]);
      setSelectedExpertId(newExpert.id);
      setSelectedRecommendationIdx(null);
    } else if (selectedExpertId) {
      // 更新当前选中的Expert记录
      setExpertAdjustments(prev => prev.map(e => 
        e.id === selectedExpertId 
          ? { ...e, winRate: finalWinRate, jointMatrix: newJoint.map(r => [...r]) }
          : e
      ));
    } else {
      // 没有选中任何记录时，自动创建新的Expert记录
      const newExpert: ExpertAdjustment = {
        id: `expert-${Date.now()}`,
        description: 'Manual adjustment',
        winRate: finalWinRate,
        jointMatrix: newJoint.map(r => [...r]),
      };
      setExpertAdjustments(prev => [...prev, newExpert]);
      setSelectedExpertId(newExpert.id);
    }
    
    setCurrentJoint(newJoint);
  }, [baseJoint, currentJoint, currentAnalysis, selectedRecommendationIdx, selectedExpertId, setExpertAdjustments]);

  // 从当前分析中获取LogView需要的数据（需要在adjustmentData之前声明）
  const top5Recommendations: ActionRecommendation[] = currentAnalysis?.top5_recommendations || [];
  const frequentButLosing: ActionRecommendation[] = currentAnalysis?.frequent_but_losing || [];
  const rareButWinning: ActionRecommendation[] = currentAnalysis?.rare_but_winning || [];

  // 计算adjustmentData - 基于选中的Recommendation计算调整后的数据
  const adjustmentData = useMemo(() => {
    if (!baseJoint || !currentAnalysis) return null;
    
    const winMatrix = currentAnalysis.current_stroke_analysis.winrate_matrix;
    
    // 如果选中了一个recommendation，胜率 = baseline_winrate + winrate_change
    if (selectedRecommendationIdx !== null) {
      const rec = top5Recommendations[selectedRecommendationIdx];
      if (rec) {
        const baselineWinRate = currentAnalysis.baseline_winrate;
        const adjustedWinRate = baselineWinRate + rec.winrate_change;
        return {
          overallWinRate: adjustedWinRate * 100,
          adjustedWinRate: adjustedWinRate,
        };
      }
    }
    
    // 否则基于currentJoint计算调整后的胜率
    // 直接计算加权平均胜率 = sum(currentJoint[bp][st] * winrate_matrix[st][bp])
    if (!currentJoint) return null;
    
    let adjustedWinRate = 0;
    for (let bp = 0; bp < currentJoint.length; bp++) {
      for (let st = 0; st < currentJoint[bp].length; st++) {
        adjustedWinRate += currentJoint[bp][st] * (winMatrix[st]?.[bp] || 0);
      }
    }
    return {
      overallWinRate: adjustedWinRate * 100,
      adjustedWinRate: adjustedWinRate,
    };
  }, [currentJoint, currentAnalysis, selectedRecommendationIdx, top5Recommendations, baseJoint]);

  // 计算adjustment幅度矩阵 - 基于选中的Recommendation
  const adjustmentMatrix = useMemo(() => {
    if (!baseJoint || !currentAnalysis) return null;
    
    // 如果选中了一个recommendation，计算该recommendation的调整矩阵
    if (selectedRecommendationIdx !== null) {
      const rec = top5Recommendations[selectedRecommendationIdx];
      if (rec) {
        // 找到该action对应的ST和BP索引
        const stIdx = ST_LABELS.indexOf(rec.st);
        const bpIdx = BP_LABELS.indexOf(rec.bp);
        
        if (stIdx !== -1 && bpIdx !== -1) {
          // 创建调整矩阵：该action的概率增加delta（用公式计算），其他按比例减少
          const adjustMatrix: number[][] = Array(9).fill(null).map(() => Array(13).fill(0));
          
          // rec.prob是归一化后的概率，真正的delta需要用公式计算
          // delta = (C + 4 * B * tp * (1 - tp)) / 100, C=1, B=5
          const C = 1, B = 5;
          const tp = baseJoint[bpIdx][stIdx];
          const delta = (C + 4 * B * tp * (1 - tp)) / 100;
          
          // 设置该位置的调整值
          adjustMatrix[bpIdx][stIdx] = delta;
          
          // 其他位置按比例减少，保持总和为0
          const totalOther = baseJoint.flat().reduce((a, b) => a + b, 0) - baseJoint[bpIdx][stIdx];
          if (totalOther > 0) {
            for (let bp = 0; bp < 9; bp++) {
              for (let st = 0; st < 13; st++) {
                if (bp !== bpIdx || st !== stIdx) {
                  const scale = baseJoint[bp][st] / totalOther;
                  adjustMatrix[bp][st] = -delta * scale;
                }
              }
            }
          }
          
          return adjustMatrix;
        }
      }
    }
    
    // 否则使用currentJoint与baseJoint的差值
    if (!currentJoint) return null;
    return currentJoint.map((row, rowIndex) => 
      row.map((val, colIndex) => val - (baseJoint[rowIndex]?.[colIndex] || 0))
    );
  }, [baseJoint, currentJoint, currentAnalysis, selectedRecommendationIdx, top5Recommendations]);

  // Rally View的数据：显示整个rally
  // 从stroke1开始，每个stroke显示实际action（past）或top5预测（current及future）
  const strokesDataForRally = useMemo(() => {
    if (selectedStrokeIndex === null) return [];
    
    const selectedStrokeKey = `stroke${selectedStrokeIndex}`;
    const analysis = strokeAnalysisMap[selectedStrokeKey];
    if (!analysis) return [];
    
    const result: Array<{
      strokeIndex: number;
      strokeKey: string;
      playerName: string;
      actualAction?: { st: string; bp: string };
      topActions: Array<{ st: string; bp: string; prob: number }>;
      flowToNext?: Record<string, number>;
      isPast: boolean;
    }> = [];
    
    // 获取实际action（从rally_info）
    const rallyInfo = (rallyData?.rally_info || {}) as Record<string, { strokeTech: string; ballPlacement: string; player: string }>;
    
    // 1. 添加所有past strokes（从stroke1到selectedStrokeIndex-1）
    for (let i = 1; i < selectedStrokeIndex; i++) {
      const strokeKey = `stroke${i}`;
      const stroke = strokes.find(s => s.key === strokeKey);
      const actual = rallyInfo[strokeKey];
      
      if (stroke && actual) {
        // 获取下一个stroke的top_k_distribution来计算flowToNext
        const nextStrokeKey = `stroke${i + 1}`;
        const nextAnalysis = strokeAnalysisMap[nextStrokeKey];
        let flowToNext: Record<string, number> | undefined;
        
        if (nextAnalysis && i + 1 <= selectedStrokeIndex) {
          // 从当前实际action到下一个stroke的top5的流
          // 使用下一个stroke的top_k_distribution概率作为flow
          const nextTop5 = nextAnalysis.current_stroke_analysis.top_k_distribution.slice(0, 5);
          const totalProb = nextTop5.reduce((sum, item) => sum + item.prob, 0);
          flowToNext = {};
          nextTop5.forEach(item => {
            const key = `(${actual.strokeTech}->${actual.ballPlacement}) -> (${item.st}->${item.bp})`;
            flowToNext![key] = item.prob / totalProb;
          });
        }
        
        result.push({
          strokeIndex: i,
          strokeKey: strokeKey,
          playerName: stroke.playerName,
          actualAction: { st: actual.strokeTech, bp: actual.ballPlacement },
          topActions: [{ st: actual.strokeTech, bp: actual.ballPlacement, prob: 1 }],
          flowToNext,
          isPast: true,
        });
      }
    }
    
    // 2. 添加选中的stroke（使用current_stroke_analysis.top_k_distribution）
    const currentStroke = strokes.find(s => s.key === selectedStrokeKey);
    const currentActual = rallyInfo[selectedStrokeKey];
    const currentTop5Raw = analysis.current_stroke_analysis.top_k_distribution.slice(0, 5);
    const totalProb = currentTop5Raw.reduce((sum, item) => sum + item.prob, 0);
    const currentTop5 = currentTop5Raw.map(item => ({
      st: item.st,
      bp: item.bp,
      prob: item.prob / totalProb,
    }));
    
    // 获取第一个forward_propagation的flow作为当前拍到下一拍的连接
    const firstFlow = analysis.forward_propagation[0]?.top5_to_top5_flow;
    
    result.push({
      strokeIndex: selectedStrokeIndex!, // 已在上面检查过null
      strokeKey: selectedStrokeKey,
      playerName: currentStroke?.playerName || '',
      actualAction: currentActual ? { st: currentActual.strokeTech, bp: currentActual.ballPlacement } : undefined,
      topActions: currentTop5,
      flowToNext: firstFlow,
      isPast: false,
    });
    
    // 3. 添加forward_propagation中的后续拍
    analysis.forward_propagation.forEach((fp, idx) => {
      const fpStroke = strokes.find(s => s.key === fp.stroke_key);
      const fpActual = rallyInfo[fp.stroke_key];
      const fpTop5Raw = fp.top_k_distribution.slice(0, 5);
      const fpTotalProb = fpTop5Raw.reduce((sum, item) => sum + item.prob, 0);
      const fpTop5 = fpTop5Raw.map(item => ({
        st: item.st,
        bp: item.bp,
        prob: item.prob / fpTotalProb,
      }));
      
      const nextFlow = analysis.forward_propagation[idx + 1]?.top5_to_top5_flow;
      
      result.push({
        strokeIndex: fp.stroke_idx + 1,
        strokeKey: fp.stroke_key,
        playerName: fpStroke?.playerName || fp.player,
        actualAction: fpActual ? { st: fpActual.strokeTech, bp: fpActual.ballPlacement } : undefined,
        topActions: fpTop5,
        flowToNext: nextFlow,
        isPast: false,
      });
    });
    
    return result;
  }, [selectedStrokeIndex, strokes, strokeAnalysisMap, rallyData]);

  return (
    <ScaledContainer designWidth={2560} designHeight={1330}>
      <div className="h-full flex flex-col bg-white overflow-hidden">
        <Header />
        
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
        
        <main className="flex-1 overflow-hidden" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', height: '100%', gap: '15px' }}>
            {/* Left Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
              {/* Top Row: Navigator + Rally */}
              <div style={{ display: 'flex', gap: '15px', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 2, minWidth: 0, height: '100%' }}>
                  <NavigatorView
                  videoUrl={videoUrl}
                  strokes={strokes}
                  selectedStrokeIndex={selectedStrokeIndex}
                  onStrokeSelect={handleStrokeSelect}
                  selectedMatchId={selectedMatchId}
                  selectedGameNo={selectedGameNo}
                  selectedRallyNo={selectedRallyNo}
                  onMatchChange={handleMatchChange}
                  onGameChange={handleGameChange}
                  onRallyChange={handleRallyChange}
                  winnerVideoPosition={
                    rallyData?.meta_info.winSide 
                      ? rallyData.meta_info[rallyData.meta_info.winSide as 'player0' | 'player1']?.video_position
                      : undefined
                  }
                />
              </div>

              <div style={{ flex: 3, minWidth: 0, height: '100%' }}>
                <RallyView
                  strokesData={strokesDataForRally}
                  selectedStrokeIndex={selectedStrokeIndex}
                  onStrokeSelect={handleStrokeSelect}
                />
              </div>
            </div>

            {/* Bottom: Adjustment View - 增加高度 */}
            <div style={{ flex: 1.2, minHeight: 0 }}>
              <AdjustmentView
                predictionData={predictionData}
                adjustmentMatrix={adjustmentMatrix}
                adjustedWinRate={adjustmentData ? adjustmentData.overallWinRate / 100 : undefined}
                baseWinRate={predictionData?.overallWinRate}
                onAdjustmentCellUp={handleCellUp}
                onAdjustmentCellDown={handleCellDown}
                onRefreshAdjustment={handleRefreshAdjustment}
              />
            </div>
          </div>

          {/* Right Column: Log View - 宽度再增加 */}
          <div style={{ width: '600px', flexShrink: 0, height: '100%' }}>
            <LogView
              top5Recommendations={top5Recommendations}
              frequentButLosing={frequentButLosing}
              rareButWinning={rareButWinning}
              expertAdjustments={expertAdjustments}
              selectedExpertId={selectedExpertId}
              selectedRecommendationIdx={selectedRecommendationIdx}
              onSelectExpert={handleSelectExpert}
              onSelectRecommendation={handleSelectRecommendation}
              onAddExpertAdjustment={handleAddExpertAdjustment}
              onDeleteExpertAdjustment={handleDeleteExpertAdjustment}
              onAddModelAdjustment={handleAddModelAdjustment}
              baselineWinrate={currentAnalysis?.baseline_winrate}
              checkedIntegrated={checkedIntegrated}
              checkedPitfalls={checkedPitfalls}
              checkedOpportunities={checkedOpportunities}
              onToggleIntegrated={handleToggleIntegrated}
              onTogglePitfall={handleTogglePitfall}
              onToggleOpportunity={handleToggleOpportunity}
            />
            </div>
          </div>
        </main>
      </div>
    </ScaledContainer>
  );
}

export default App;
