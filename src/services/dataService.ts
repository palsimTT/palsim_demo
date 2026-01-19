/**
 * Data Service - Load all data from local assets
 * No backend needed - all data is pre-computed and stored in assets
 */

// Result file structure
export interface ContextResult {
  context: {
    description: string;
    ST_t2: string;
    BP_t2: string;
    ST_t1: string;
    BP_t1: string;
  };
  st_distribution: {
    labels: string[];
    probabilities: Record<string, number>;
  };
  bp_distribution: {
    labels: string[];
    probabilities: Record<string, number>;
  };
  joint_distribution: {
    st_labels: string[];
    bp_labels: string[];
    matrix: number[][];
    probabilities: Record<string, number>;
  };
  winrate_matrix: {
    st_labels: string[];
    bp_labels: string[];
    matrix: number[][];
    winrates: Record<string, number>;
  };
  expected_winrate: {
    value: number;
  };
}

// Context info from videoclips folder
export interface ContextInfo {
  context: string;
  win_rate: number;
  sample_count: number;
  win_count: number;
  loss_count: number;
  rank: number;
  clips: Array<{
    clip_file: string;
    source_video: string;
    ST_t2: string;
    BP_t2: string;
    ST_t1: string;
    BP_t1: string;
    ST_t: string;
    BP_t: string;
  }>;
}

// Combined context data for UI
export interface ContextData {
  id: string;
  context: string;
  description: string;
  winRate: number;
  sampleCount: number;
  st_t2: string;
  bp_t2: string;
  st_t1: string;
  bp_t1: string;
  videoFiles: string[];
  folderName: string;
}

// Import all context_info.json files
const contextInfoModules = import.meta.glob<{ default: ContextInfo }>(
  '../assets/context_videoclips/*/context_info.json',
  { eager: true }
);

// Import all result json files
const resultModules = import.meta.glob<{ default: ContextResult }>(
  '../assets/context_results/*_result.json',
  { eager: true }
);

// Parse folder name to extract context info
function parseFolderName(folderName: string): { id: string; st_t2: string; bp_t2: string; st_t1: string; bp_t1: string } {
  // Format: 01_Reverse_BH_Topspin_BL or 145_X_X_Reverse_ML
  const parts = folderName.split('_');
  const id = folderName;
  
  if (parts.length >= 5) {
    // Handle special case where X is used for wildcards
    const st_t2 = parts[1] === 'X' ? '*' : parts[1];
    const bp_t2 = parts[2] === 'X' ? '*' : parts[2];
    const st_t1 = parts[3];
    const bp_t1 = parts[4];
    return { id, st_t2, bp_t2, st_t1, bp_t1 };
  }
  
  return { id, st_t2: '*', bp_t2: '*', st_t1: '', bp_t1: '' };
}

// Generate result filename from context info
function getResultFileName(st_t2: string, bp_t2: string, st_t1: string, bp_t1: string): string {
  const s2 = st_t2 === '*' ? '*' : st_t2;
  const b2 = bp_t2 === '*' ? '*' : bp_t2;
  return `${s2}_${b2}_${st_t1}_${bp_t1}_result.json`;
}

// Load all contexts
export function loadAllContexts(): ContextData[] {
  const contexts: ContextData[] = [];
  
  for (const [path, module] of Object.entries(contextInfoModules)) {
    const info = module.default;
    // Extract folder name from path
    const match = path.match(/context_videoclips\/([^/]+)\/context_info\.json$/);
    if (!match) continue;
    
    const folderName = match[1];
    const parsed = parseFolderName(folderName);
    
    // Create description
    const st2Disp = parsed.st_t2 === '*' ? '∅' : parsed.st_t2;
    const bp2Disp = parsed.bp_t2 === '*' ? '∅' : parsed.bp_t2;
    const description = `${st2Disp} ${bp2Disp} → ${parsed.st_t1} ${parsed.bp_t1}`;
    
    contexts.push({
      id: parsed.id,
      context: info.context,
      description,
      winRate: info.win_rate,
      sampleCount: info.sample_count,
      st_t2: parsed.st_t2,
      bp_t2: parsed.bp_t2,
      st_t1: parsed.st_t1,
      bp_t1: parsed.bp_t1,
      videoFiles: info.clips.map(c => c.clip_file),
      folderName,
    });
  }
  
  // Sort by folder name (which starts with number)
  contexts.sort((a, b) => {
    const numA = parseInt(a.folderName.split('_')[0]);
    const numB = parseInt(b.folderName.split('_')[0]);
    return numA - numB;
  });
  
  return contexts;
}

// Load result for a specific context
export function loadContextResult(st_t2: string, bp_t2: string, st_t1: string, bp_t1: string): ContextResult | null {
  const fileName = getResultFileName(st_t2, bp_t2, st_t1, bp_t1);
  
  for (const [path, module] of Object.entries(resultModules)) {
    if (path.endsWith(fileName)) {
      return module.default;
    }
  }
  
  console.warn(`Result not found for: ${fileName}`);
  return null;
}

// Get video URL for a context
export function getVideoUrl(folderName: string, clipFile: string): string {
  return new URL(`../assets/context_videoclips/${folderName}/${clipFile}`, import.meta.url).href;
}

// Get all video URLs for a context
export function getVideoUrls(folderName: string, videoFiles: string[]): string[] {
  return videoFiles.map(file => getVideoUrl(folderName, file));
}

// Calculate simulation adjustments
export interface SimulationAdjustment {
  st: string;
  bp: string;
  currentProb: number;
  currentWinRate: number;
  suggestedChange: number;
  winRateChange: number;
  description: string;
}

export function calculateTopAdjustments(result: ContextResult, topN: number = 5): SimulationAdjustment[] {
  const adjustments: SimulationAdjustment[] = [];
  const joint = result.joint_distribution;
  const winrates = result.winrate_matrix;
  const expectedWR = result.expected_winrate.value;
  
  // For each (ST, BP) combination, calculate potential impact
  for (let i = 0; i < joint.st_labels.length; i++) {
    for (let j = 0; j < joint.bp_labels.length; j++) {
      const st = joint.st_labels[i];
      const bp = joint.bp_labels[j];
      const prob = joint.matrix[i][j];
      const wr = winrates.matrix[i][j];
      
      // Skip very low probability combinations
      if (prob < 0.001) continue;
      
      // Calculate impact: if we increase this combination's probability
      // Impact = (wr - expectedWR) * some_factor
      const impact = (wr - expectedWR) * 100;
      
      adjustments.push({
        st,
        bp,
        currentProb: prob * 100,
        currentWinRate: wr * 100,
        suggestedChange: impact > 0 ? 5 : -5,
        winRateChange: impact * 0.1, // Estimated change
        description: `${st} to ${bp}`,
      });
    }
  }
  
  // Sort by absolute impact and return top N
  adjustments.sort((a, b) => Math.abs(b.winRateChange) - Math.abs(a.winRateChange));
  return adjustments.slice(0, topN);
}
