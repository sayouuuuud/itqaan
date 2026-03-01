export interface TimelineItem {
  id: string
  title: string
  subtitle?: string
  date?: string
  description?: string
  type: 'education' | 'career' | 'achievement'
  icon?: 'book' | 'briefcase' | 'graduation' | 'medal' | 'building' | 'scroll'
}

export function parseTimelineData(
  education: string = '',
  positions: string = '',
  achievements: string = ''
): TimelineItem[] {
  const items: TimelineItem[] = []

  // Parse education items
  const educationLines = education.split('\n').filter(line => line.trim())
  educationLines.forEach((line, index) => {
    const parts = line.trim().split('|').map(p => p.trim())
    items.push({
      id: `edu-${index}`,
      title: parts[0] || line,
      subtitle: parts[1],
      date: parts[2],
      description: parts[3],
      type: 'education',
      icon: 'graduation',
    })
  })

  // Parse career/positions
  const positionLines = positions.split('\n').filter(line => line.trim())
  positionLines.forEach((line, index) => {
    const parts = line.trim().split('|').map(p => p.trim())
    items.push({
      id: `pos-${index}`,
      title: parts[0] || line,
      subtitle: parts[1],
      date: parts[2],
      description: parts[3],
      type: 'career',
      icon: 'briefcase',
    })
  })

  // Parse achievements (if provided)
  if (achievements) {
    const achievementLines = achievements.split('\n').filter(line => line.trim()).slice(0, 3)
    achievementLines.forEach((line, index) => {
      const parts = line.trim().split('|').map(p => p.trim())
      items.push({
        id: `ach-${index}`,
        title: parts[0] || line,
        subtitle: parts[1],
        date: parts[2],
        description: parts[3],
        type: 'achievement',
        icon: 'medal',
      })
    })
  }

  // Sort by date if available (newest first)
  return items.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return b.date.localeCompare(a.date)
  })
}