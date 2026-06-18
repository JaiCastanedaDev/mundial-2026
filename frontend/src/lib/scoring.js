export const STAGE_POINTS = {
  'Group Stage': { exact: 3, correct: 1 },
  'Round of 16': { exact: 4, correct: 2 },
  'Quarter-finals': { exact: 5, correct: 3 },
  'Semi-finals': { exact: 5, correct: 4 },
  'Third Place': { exact: 4, correct: 2 },
  Final: { exact: 5, correct: 5 },
}

export function getPredictionResult(home, away) {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

export function calculatePoints(stage, predictedHome, predictedAway, realHome, realAway) {
  const stageConfig = STAGE_POINTS[stage] ?? STAGE_POINTS['Group Stage']
  const isExact = predictedHome === realHome && predictedAway === realAway

  if (isExact) {
    return { points: stageConfig.exact, type: 'exact' }
  }

  const isCorrectResult =
    getPredictionResult(predictedHome, predictedAway) === getPredictionResult(realHome, realAway)

  if (isCorrectResult) {
    return { points: stageConfig.correct, type: 'correct' }
  }

  return { points: 0, type: 'wrong' }
}

export function isPredictionClosed(match) {
  return match.status !== 'scheduled' || new Date(match.match_date) <= new Date()
}
