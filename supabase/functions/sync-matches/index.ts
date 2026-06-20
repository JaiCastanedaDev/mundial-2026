import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const THESPORTSDB_LEAGUE_ID = Deno.env.get('THESPORTSDB_LEAGUE_ID') ?? ''
const THESPORTSDB_API_KEY = '123'
const WORLD_CUP_SEASON = Deno.env.get('THESPORTSDB_SEASON') ?? '2026-2027'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function mapStatus(event: any): string {
  const homeScore = event.intHomeScore
  const awayScore = event.intAwayScore

  if (homeScore !== null && awayScore !== null) return 'finished'
  if (event.strStatus?.toLowerCase?.() === 'live') return 'live'
  if (event.strStatus?.toLowerCase?.() === 'scheduled') return 'scheduled'

  return event.dateEvent && new Date(`${event.dateEvent}T${event.strTime ?? '00:00:00'}`) <= new Date()
    ? 'live'
    : 'scheduled'
}

function mapStage(roundValue: string): string {
  if (!roundValue) return 'Group Stage'

  if (/group/i.test(roundValue)) return 'Group Stage'
  if (/round\s*of\s*32|32/i.test(roundValue)) return 'Round of 32'
  if (/round\s*of\s*16|16/i.test(roundValue)) return 'Round of 16'
  if (/quarter/i.test(roundValue)) return 'Quarter-finals'
  if (/semi/i.test(roundValue)) return 'Semi-finals'
  if (/(3rd|third)/i.test(roundValue)) return 'Third Place'
  if (/final/i.test(roundValue)) return 'Final'

  return roundValue
}

function extractGroup(roundValue: string): string | null {
  const match = roundValue.match(/Group\s+([A-Z])/i)
  return match ? match[1].toUpperCase() : null
}

Deno.serve(async () => {
  try {
    if (!THESPORTSDB_LEAGUE_ID) throw new Error('Missing THESPORTSDB_LEAGUE_ID secret')

    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventsseason.php?id=${THESPORTSDB_LEAGUE_ID}`,
      {
        headers: { accept: 'application/json' },
      },
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`TheSportsDB error ${response.status}: ${body}`)
    }

    const payload = await response.json()
    if (!Array.isArray(payload.events)) {
      throw new Error('Unexpected TheSportsDB response format')
    }

    const matches = payload.events.map((event: any) => ({
      api_match_id: Number(event.idEvent),
      home_team: event.strHomeTeam,
      away_team: event.strAwayTeam,
      home_team_logo: event.strHomeTeamBadge ?? null,
      away_team_logo: event.strAwayTeamBadge ?? null,
      match_date: `${event.dateEvent}T${event.strTime ?? '00:00:00'}Z`,
      stage: mapStage(event.strRound ?? event.intRound?.toString?.() ?? ''),
      group_name: extractGroup(event.strRound ?? ''),
      status: mapStatus(event),
      home_score: event.intHomeScore !== null ? Number(event.intHomeScore) : null,
      away_score: event.intAwayScore !== null ? Number(event.intAwayScore) : null,
      home_score_ft: event.intHomeScore !== null ? Number(event.intHomeScore) : null,
      away_score_ft: event.intAwayScore !== null ? Number(event.intAwayScore) : null,
      venue: event.strVenue ?? null,
    }))

    if (matches.length === 0) {
      return Response.json({
        synced: 0,
        finishedTriggered: 0,
        message: 'No matches returned by TheSportsDB for the selected league',
      })
    }

    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'api_match_id' })

    if (upsertError) throw upsertError

    const finishedIds = matches
      .filter((match: any) => match.status === 'finished')
      .map((match: any) => match.api_match_id)

    if (finishedIds.length > 0) {
      const scoresResponse = await fetch(`${SUPABASE_URL}/functions/v1/calculate-scores`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ apiMatchIds: finishedIds }),
      })

      if (!scoresResponse.ok) {
        const body = await scoresResponse.text()
        throw new Error(`calculate-scores error ${scoresResponse.status}: ${body}`)
      }
    }

    return Response.json({ synced: matches.length, finishedTriggered: finishedIds.length })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
})
