export function mergeHighlights(highlights) {
  if (!highlights || highlights.length === 0) return []
  const sorted = [...highlights]
    .filter((h) => h.end > h.start)
    .sort((a, b) => a.start - b.start)

  const merged = []
  for (const h of sorted) {
    const last = merged[merged.length - 1]
    if (last && h.start <= last.end) {
      last.end = Math.max(last.end, h.end)
    } else {
      merged.push({ ...h })
    }
  }
  return merged
}

// content를 하이라이트 구간 기준으로 잘라 { text, highlighted, range } 배열로 반환한다.
export function buildSegments(content, highlights) {
  const merged = mergeHighlights(highlights)
  if (merged.length === 0) {
    return [{ text: content, highlighted: false }]
  }

  const segments = []
  let cursor = 0
  merged.forEach((range) => {
    if (range.start > cursor) {
      segments.push({ text: content.slice(cursor, range.start), highlighted: false })
    }
    segments.push({
      text: content.slice(range.start, range.end),
      highlighted: true,
      range,
    })
    cursor = range.end
  })
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), highlighted: false })
  }
  return segments
}
