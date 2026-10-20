// 라이브 텍스트(OCR)는 인쇄된 줄마다 줄바꿈을 넣는다.
// 빈 줄(문단 구분)은 유지하고, 문단 안의 줄바꿈은 공백으로 합친다.
// 서버 QuickCardController.joinOcrLines 와 같은 규칙.
export function joinLines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split("\n")
        .map((line) => line.trim())
        .join(" ")
        .replace(/ {2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n")
}
