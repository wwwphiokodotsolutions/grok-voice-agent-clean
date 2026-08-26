import { NextRequest } from 'next/server'

// Lightweight mock + optional free Open-Meteo lookup (no API key required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const city = (body.city as string)?.trim() || 'San Francisco'

    // Try free geocoding + weather (Open-Meteo)
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
        { next: { revalidate: 3600 } },
      )
      const geo = await geoRes.json()
      if (geo.results?.[0]) {
        const { latitude, longitude, name, country } = geo.results[0]
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit`,
        )
        const weather = await weatherRes.json()
        const current = weather.current
        return Response.json({
          city: name,
          country,
          temperatureF: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windMph: current.wind_speed_10m,
          code: current.weather_code,
          summary: `Currently ${Math.round(current.temperature_2m)}°F in ${name}`,
        })
      }
    } catch {
      // fall through to mock
    }

    // Graceful mock fallback
    return Response.json({
      city,
      temperatureF: 72,
      humidity: 55,
      windMph: 8,
      summary: `Mock weather for ${city}: pleasant and mild (≈72°F)`,
      note: 'Live weather lookup unavailable — using demo data',
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Weather request failed' },
      { status: 500 },
    )
  }
}
