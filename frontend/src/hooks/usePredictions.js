export function getUserPrediction(match, userId) {
  if (!match?.predictions?.length || !userId) return null
  return match.predictions.find((prediction) => prediction.user_id === userId) ?? null
}

export function countMissingGroupStagePredictions(matches, userId) {
  return matches.filter((match) => {
    const isGroupStage = match.stage === 'Group Stage' || String(match.stage) === '1'
    return isGroupStage && !getUserPrediction(match, userId)
  }).length
}

export function buildPerformanceSummary(matches, userId) {
  const finishedMatches = matches.filter((match) => match.status === 'finished')

  const summary = {
    exact: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
    totalFinished: finishedMatches.length,
  }

  finishedMatches.forEach((match) => {
    const prediction = getUserPrediction(match, userId)
    if (!prediction) {
      summary.missed += 1
      return
    }

    if (prediction.points_earned > 0 && prediction.is_calculated) {
      const isExact =
        prediction.predicted_home_score === (match.home_score_ft ?? match.home_score) &&
        prediction.predicted_away_score === (match.away_score_ft ?? match.away_score)

      if (isExact) {
        summary.exact += 1
      } else {
        summary.correct += 1
      }
    } else {
      summary.wrong += 1
    }
  })

  return summary
}
