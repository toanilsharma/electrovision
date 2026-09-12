/**
 * HomeGuard Assessment Storage & Score Feeder (HG6)
 * 
 * Persists completed mission scores and feeds into the existing
 * certification and assessment system.
 */

export interface MissionAssessmentState {
  completedPresetIds: string[];
  totalScore: number;
  maxScore: number;
  rankTitle: string;
  lastCompletedAt: number | null;
  missionVerdicts: Record<string, {
    passed: boolean;
    observedStamp: string;
    points: number;
    timestamp: number;
  }>;
}

const STORAGE_KEY = 'electrolive_homeguard_assessment';
const MAX_SCORE = 500; // 5 missions * 100 points each

let inMemoryFallback: MissionAssessmentState = {
  completedPresetIds: [],
  totalScore: 0,
  maxScore: MAX_SCORE,
  rankTitle: getHomeGuardRank(0),
  lastCompletedAt: null,
  missionVerdicts: {}
};

export function getHomeGuardRank(score: number): string {
  if (score >= 500) return 'Master Residential Inspector (Level 5)';
  if (score >= 400) return 'Senior HomeGuard Specialist (Level 4)';
  if (score >= 300) return 'Certified Protection Technician (Level 3)';
  if (score >= 200) return 'Electrical Safety Apprentice (Level 2)';
  if (score >= 100) return 'Junior Safety Observer (Level 1)';
  return 'Uncertified Trainee';
}

export function loadAssessmentState(): MissionAssessmentState {
  if (typeof window === 'undefined') {
    return inMemoryFallback;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        completedPresetIds: [],
        totalScore: 0,
        maxScore: MAX_SCORE,
        rankTitle: getHomeGuardRank(0),
        lastCompletedAt: null,
        missionVerdicts: {}
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      maxScore: MAX_SCORE,
      rankTitle: getHomeGuardRank(parsed.totalScore || 0)
    };
  } catch {
    return {
      completedPresetIds: [],
      totalScore: 0,
      maxScore: MAX_SCORE,
      rankTitle: getHomeGuardRank(0),
      lastCompletedAt: null,
      missionVerdicts: {}
    };
  }
}

export function recordMissionPassed(
  presetId: string,
  points: number,
  observedStamp: string
): MissionAssessmentState {
  const current = loadAssessmentState();

  const isAlreadyCompleted = current.completedPresetIds.includes(presetId);
  const updatedCompleted = isAlreadyCompleted
    ? current.completedPresetIds
    : [...current.completedPresetIds, presetId];

  const updatedScore = updatedCompleted.length * 100;

  const updatedState: MissionAssessmentState = {
    completedPresetIds: updatedCompleted,
    totalScore: Math.min(MAX_SCORE, updatedScore),
    maxScore: MAX_SCORE,
    rankTitle: getHomeGuardRank(updatedScore),
    lastCompletedAt: Date.now(),
    missionVerdicts: {
      ...current.missionVerdicts,
      [presetId]: {
        passed: true,
        observedStamp,
        points,
        timestamp: Date.now()
      }
    }
  };

  inMemoryFallback = updatedState;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  return updatedState;
}

export function resetAssessmentState(): MissionAssessmentState {
  const reset: MissionAssessmentState = {
    completedPresetIds: [],
    totalScore: 0,
    maxScore: MAX_SCORE,
    rankTitle: getHomeGuardRank(0),
    lastCompletedAt: null,
    missionVerdicts: {}
  };

  inMemoryFallback = reset;

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return reset;
}
