import { z } from 'zod'

const inputSchema = z.object({
  city: z.string().min(1),
})

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { city } = parsed.data

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city,
      )}&count=1&language=en&format=json`,
    )
    const geo = await geoRes.json()
    const place = geo?.results?.[0]

    if (!place) {
      return Response.json({
        city,
        error: `Could not find a place called "${city}".`,
      })
    }

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`,
    )
    const wx = await wxRes.json()
    const current = wx?.current

    return Response.json({
      city: place.name,
      region: place.admin1 ?? null,
      country: place.country ?? null,
      temperatureF: current?.temperature_2m ?? null,
      humidityPercent: current?.relative_humidity_2m ?? null,
      windSpeedMph: current?.wind_speed_10m ?? null,
      condition: weatherCodeToText(current?.weather_code),
    })
  } catch {
    return Response.json(
      { city, error: 'Weather lookup failed.' },
      { status: 502 },
    )
  }
}

function weatherCodeToText(code: number | undefined): string {
  if (code == null) return 'unknown'
  const map: Record<number, string> = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'foggy',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow',
    73: 'moderate snow',
    75: 'heavy snow',
    80: 'rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    95: 'thunderstorm',
    96: 'thunderstorm with hail',
    99: 'thunderstorm with heavy hail',
  }
  return map[code] ?? 'unknown'
}
