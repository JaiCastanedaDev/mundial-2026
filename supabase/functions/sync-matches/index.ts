import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WORLDCUP26_BASE_URL = Deno.env.get('WORLDCUP26_BASE_URL') ?? 'https://worldcup26.ir'
const WORLDCUP26_TOKEN = Deno.env.get('WORLDCUP26_TOKEN') ?? ''
const WORLD_CUP_2026_START = new Date('2026-06-11T00:00:00Z')
const WORLD_CUP_2026_END = new Date('2026-07-20T00:00:00Z')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function buildApiHeaders(): HeadersInit {
  return WORLDCUP26_TOKEN
    ? {
        accept: 'application/json',
        authorization: `Bearer ${WORLDCUP26_TOKEN}`,
      }
    : { accept: 'application/json' }
}

async function fetchJson(path: string) {
  const response = await fetch(`${WORLDCUP26_BASE_URL}${path}`, {
    headers: buildApiHeaders(),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`WorldCup26 API error ${response.status} on ${path}: ${body}`)
  }

  return response.json()
}

function parseCollection(payload: any, key: string): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.[key])) return payload[key]
  if (payload?.[key] && typeof payload[key] === 'object') return [payload[key]]
  return []
}

function inferTimezone(stadium: any): string {
  const city = normalizeText(stadium?.city_en)
  const country = normalizeText(stadium?.country_en)
  const name = normalizeText(stadium?.name_en ?? stadium?.fifa_name)

  if (country.includes('mexico') || city.includes('mexico city') || city.includes('guadalajara')) {
    return 'America/Mexico_City'
  }

  if (city.includes('monterrey')) return 'America/Monterrey'
  if (city.includes('toronto')) return 'America/Toronto'
  if (city.includes('vancouver')) return 'America/Vancouver'
  if (
    city.includes('los angeles') ||
    city.includes('inglewood') ||
    city.includes('san francisco') ||
    city.includes('santa clara') ||
    city.includes('seattle') ||
    name.includes('sofi') ||
    name.includes("levi's") ||
    name.includes('lumen')
  ) {
    return 'America/Los_Angeles'
  }

  if (
    city.includes('dallas') ||
    city.includes('arlington') ||
    city.includes('houston') ||
    city.includes('kansas city') ||
    name.includes('at&t') ||
    name.includes('nrg') ||
    name.includes('arrowhead')
  ) {
    return 'America/Chicago'
  }

  return 'America/New_York'
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )

  return asUtc - date.getTime()
}

function parseLocalDate(localDate: string, timeZone: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(localDate ?? '')
  if (!match) return null

  const [, month, day, year, hour, minute] = match
  const utcGuess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
  )

  const offset = getTimeZoneOffset(new Date(utcGuess), timeZone)
  const resolved = new Date(utcGuess - offset)

  return Number.isNaN(resolved.getTime()) ? null : resolved
}

function mapStage(game: any): string {
  switch (normalizeText(game.type)) {
    case 'group':
      return 'Group Stage'
    case 'r32':
      return 'Round of 32'
    case 'r16':
      return 'Round of 16'
    case 'qf':
      return 'Quarter-finals'
    case 'sf':
      return 'Semi-finals'
    case 'third':
      return 'Third Place'
    case 'final':
      return 'Final'
    default:
      return 'Group Stage'
  }
}

function mapGroup(game: any): string | null {
  const group = String(game.group ?? '').trim()
  return /^[A-L]$/i.test(group) ? group.toUpperCase() : null
}

function toNullableScore(value: unknown, isStarted: boolean): number | null {
  if (!isStarted) return null

  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function mapStatus(game: any): 'scheduled' | 'live' | 'finished' {
  const finished = normalizeText(game.finished)
  const elapsed = normalizeText(game.time_elapsed)

  if (finished === 'true') return 'finished'
  if (!elapsed || elapsed === 'notstarted' || elapsed === 'ns') return 'scheduled'
  return 'live'
}

function resolveTeamName(game: any, side: 'home' | 'away'): string {
  return (
    game[`${side}_team_name_en`] ??
    game[`${side}_team_label`] ??
    (side === 'home' ? 'Por definir' : 'Por definir')
  )
}

function isWorldCupDate(date: Date | null): boolean {
  return date !== null && date >= WORLD_CUP_2026_START && date < WORLD_CUP_2026_END
}

Deno.serve(async () => {
  try {
    const [gamesPayload, teamsPayload, stadiumsPayload] = await Promise.all([
      fetchJson('/get/games'),
      fetchJson('/get/teams'),
      fetchJson('/get/stadiums'),
    ])

    const games = parseCollection(gamesPayload, 'games')
    const teams = parseCollection(teamsPayload, 'teams')
    const stadiums = parseCollection(stadiumsPayload, 'stadiums')

    if (games.length === 0) {
      throw new Error('WorldCup26 API returned no games')
    }

    const teamsById = new Map(teams.map((team) => [String(team.id), team]))
    const stadiumsById = new Map(stadiums.map((stadium) => [String(stadium.id), stadium]))

    const matches = games
      .map((game) => {
        const stadium = stadiumsById.get(String(game.stadium_id)) ?? null
        const timeZone = inferTimezone(stadium)
        const matchDate = parseLocalDate(String(game.local_date ?? ''), timeZone)

        if (!isWorldCupDate(matchDate)) return null

        const status = mapStatus(game)
        const isStarted = status !== 'scheduled'
        const homeTeam = teamsById.get(String(game.home_team_id)) ?? null
        const awayTeam = teamsById.get(String(game.away_team_id)) ?? null

        return {
          api_match_id: Number(game.id),
          home_team: resolveTeamName(game, 'home'),
          away_team: resolveTeamName(game, 'away'),
          home_team_logo: homeTeam?.flag ?? null,
          away_team_logo: awayTeam?.flag ?? null,
          match_date: matchDate?.toISOString() ?? null,
          stage: mapStage(game),
          group_name: mapGroup(game),
          status,
          home_score: toNullableScore(game.home_score, isStarted),
          away_score: toNullableScore(game.away_score, isStarted),
          home_score_ft: status === 'finished' ? toNullableScore(game.home_score, true) : null,
          away_score_ft: status === 'finished' ? toNullableScore(game.away_score, true) : null,
          venue: stadium?.name_en ?? stadium?.fifa_name ?? null,
        }
      })
      .filter((match): match is NonNullable<typeof match> => {
        return (
          match !== null &&
          Number.isFinite(match.api_match_id) &&
          Boolean(match.home_team) &&
          Boolean(match.away_team) &&
          Boolean(match.match_date)
        )
      })

    if (matches.length === 0) {
      return Response.json({
        synced: 0,
        finishedTriggered: 0,
        message: 'No World Cup matches returned by WorldCup26 API',
      })
    }

    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'api_match_id' })

    if (upsertError) throw upsertError

    const syncedApiMatchIds = matches.map((match) => match.api_match_id)
    const { error: cleanupError } = await supabase
      .from('matches')
      .delete()
      .not('api_match_id', 'in', `(${syncedApiMatchIds.join(',')})`)

    if (cleanupError) throw cleanupError

    const finishedIds = matches
      .filter((match) => match.status === 'finished')
      .map((match) => match.api_match_id)

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
