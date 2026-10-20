// 이 기기에만 해당하는 설정. 사파리 개인정보 보호 모드 등에서 저장소가 막혀도 앱은 동작해야 한다.
const PREFIX = "book-archive:"

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 실패는 무시 (편의 기능)
  }
}

export const prefs = {
  // 앱을 열면 책장 대신 빠른 캡처 화면으로 시작
  getStartOnCapture: () => read("startOnCapture", false),
  setStartOnCapture: (v) => write("startOnCapture", v),

  // 클립보드에서 가져오면 확인 없이 바로 카드로 저장
  getAutoSaveOnPaste: () => read("autoSaveOnPaste", false),
  setAutoSaveOnPaste: (v) => write("autoSaveOnPaste", v),

  // 붙여넣거나 가져온 텍스트의 줄바꿈을 자동으로 합치기
  getAutoJoinLines: () => read("autoJoinLines", true),
  setAutoJoinLines: (v) => write("autoJoinLines", v),

  getCaptureHelpDismissed: () => read("captureHelpDismissed", false),
  setCaptureHelpDismissed: (v) => write("captureHelpDismissed", v),

  // 책마다 마지막으로 입력한 페이지 번호
  getLastPage: (bookId) => read(`lastPage:${bookId}`, ""),
  setLastPage: (bookId, page) => write(`lastPage:${bookId}`, page),
}
