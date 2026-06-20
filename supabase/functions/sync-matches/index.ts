import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_KEY = Deno.env.get('API_FOOTBALL_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WORLD_CUP_LEAGUE_ID = Number(Deno.env.get('API_FOOTBALL_WORLD_CUP_LEAGUE_ID') ?? '1')
const WORLD_CUP_SEASON = Number(Deno.env.get('API_FOOTBALL_WORLD_CUP_SEASON') ?? '2026')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function mapStatus(apiStatus: string): string {
  const statusMap: Record<string, string> = {
    NS: 'scheduled',
    TBD: 'scheduled',
    PST: 'scheduled',
    '1H': 'live',
    HT: 'live',
    '2H': 'live',
    ET: 'live',
    BT: 'live',
    P: 'live',
    FT: 'finished',
    AET: 'finished',
    PEN: 'finished',
    CANC: 'cancelled',
  }

  return statusMap[apiStatus] ?? 'scheduled'
}

function mapStage(round: string): string {
  if (/group/i.test(round)) return 'Group Stage'
  if (/32/i.test(round)) return 'Round of 32'
  if (/16/i.test(round)) return 'Round of 16'
  if (/quarter/i.test(round)) return 'Quarter-finals'
  if (/semi/i.test(round)) return 'Semi-finals'
  if (/(3rd|third)/i.test(round)) return 'Third Place'
  if (/final/i.test(round)) return 'Final'
  return round
}

function extractGroup(round: string): string | null {
  const match = round.match(/Group\s+([A-Z])/i)
  return match ? match[1].toUpperCase() : null
}

Deno.serve(async () => {
  try {
    if (!API_KEY) throw new Error('Missing API_FOOTBALL_KEY secret')

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`,
      {
        headers: { 'x-apisports-key': API_KEY },
      },
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`API-Football error ${response.status}: ${body}`)
    }

    const payload = await response.json()
    const matches = payload.response.map((fixture: any) => ({
      api_match_id: fixture.fixture.id,
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      home_team_logo: fixture.teams.home.logo,
      away_team_logo: fixture.teams.away.logo,
      match_date: fixture.fixture.date,
      stage: mapStage(fixture.league.round),
      group_name: extractGroup(fixture.league.round),
      status: mapStatus(fixture.fixture.status.short),
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      home_score_ft: fixture.score?.fulltime?.home,
      away_score_ft: fixture.score?.fulltime?.away,
      venue: fixture.fixture.venue?.name,
    }))

    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'api_match_id' })

    if (upsertError) throw upsertError

    const finishedIds = matches
      .filter((match: any) => match.status === 'finished')
      .map((match: any) => match.api_match_id)

    if (finishedIds.length > 0) {
      await supabase.functions.invoke('calculate-scores', {
        body: { apiMatchIds: finishedIds },
      })
    }

    return Response.json({ synced: matches.length, finishedTriggered: finishedIds.length })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
})
