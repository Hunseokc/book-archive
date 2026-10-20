import { useRef } from "react"
import { buildSegments } from "../utils/highlights"

// selecting=true일 때는 마우스로 드래그한 구간의 문자 offset을 계산해 onAddHighlight로 전달한다.
// 텍스트가 단일 text 노드로 렌더링되므로 selection의 offset이 곧 content 문자열 인덱스와 같다.
function HighlightableText({
  content,
  highlights,
  selecting,
  onAddHighlight,
  onRemoveHighlight,
  className,
}) {
  const textRef = useRef(null)

  function handleMouseUp() {
    if (!selecting) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    if (!textRef.current?.contains(selection.anchorNode)) return
    if (selection.anchorNode !== selection.focusNode) {
      selection.removeAllRanges()
      return
    }

    const start = Math.min(selection.anchorOffset, selection.focusOffset)
    const end = Math.max(selection.anchorOffset, selection.focusOffset)
    selection.removeAllRanges()
    if (start === end) return
    onAddHighlight(start, end)
  }

  if (selecting) {
    return (
      <p
        ref={textRef}
        onMouseUp={handleMouseUp}
        className={`${className ?? ""} whitespace-pre-wrap select-text cursor-text bg-yellow-50 rounded p-1`}
      >
        {content}
      </p>
    )
  }

  const segments = buildSegments(content, highlights)

  return (
    <p className={`${className ?? ""} whitespace-pre-wrap`}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            onClick={() => onRemoveHighlight(seg.range)}
            className="bg-yellow-200 cursor-pointer"
            title="클릭하면 하이라이트가 지워져요"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  )
}

export default HighlightableText
