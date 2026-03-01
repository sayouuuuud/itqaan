import { type NextRequest, NextResponse } from "next/server"

interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnail: string
  embedUrl: string
  duration?: string
  description?: string
  channelTitle?: string
  publishedAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "رابط اليوتيوب مطلوب" }, { status: 400 })
    }

    // Extract video ID from various YouTube URL formats
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json({ error: "رابط يوتيوب غير صحيح" }, { status: 400 })
    }

    // Get video info from YouTube oEmbed API
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    // Get the best available thumbnail
    const thumbnail = await getBestYouTubeThumbnail(videoId)

    let videoInfo: YouTubeVideoInfo = {
      videoId,
      title: "",
      thumbnail,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    }

    try {
      const response = await fetch(oEmbedUrl)
      if (response.ok) {
      const data = await response.json()
        videoInfo.title = data.title
        videoInfo.channelTitle = data.author_name
      }
    } catch (oEmbedError) {
      console.warn("oEmbed API failed:", oEmbedError)
    }

    // Try to get additional info from YouTube page (for duration and description)
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
      const response = await fetch(watchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (response.ok) {
        const html = await response.text()

        // Extract duration from HTML (basic regex approach)
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/)
        if (durationMatch && durationMatch[1]) {
          const seconds = parseInt(durationMatch[1])
          videoInfo.duration = formatDuration(seconds)
        }

        // Extract description (limited approach)
        const descriptionMatch = html.match(/"description":{"simpleText":"([^"]+)"/)
        if (descriptionMatch && descriptionMatch[1]) {
          videoInfo.description = descriptionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }

        // Extract publish date
        const dateMatch = html.match(/"publishDate":"([^"]+)"/)
        if (dateMatch && dateMatch[1]) {
          videoInfo.publishedAt = dateMatch[1]
        }
      }
    } catch (scrapingError) {
      console.warn("YouTube scraping failed:", scrapingError)
      }

      return NextResponse.json({ success: true, videoInfo })
  } catch (error) {
    console.error("YouTube API Error:", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

async function getBestYouTubeThumbnail(videoId: string): Promise<string> {
  const thumbnailTypes = [
    'maxresdefault.jpg', // 720p
    'hqdefault.jpg',     // 480p
    'mqdefault.jpg',     // 320p
    'default.jpg'        // 120p
  ]

  for (const type of thumbnailTypes) {
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${type}`

    try {
      // Check if thumbnail exists by making a HEAD request
      const response = await fetch(thumbnailUrl, { method: 'HEAD' })
      if (response.ok) {
        return thumbnailUrl
      }
    } catch {
      // Continue to next thumbnail type
      continue
    }
  }

  // Fallback to default if none work
  return `https://img.youtube.com/vi/${videoId}/default.jpg`
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

