/**
 * Shabuallday AS Request Receiver (v2 — sheet only, no drive, utf-8 safe)
 * 시트 1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE 의 Apps Script
 *
 * 변경:
 *   - 시트 탭 '🚑AS리스트' 명시 (getSheetByName)
 *   - 드라이브 폴더/사진/TXT 저장 모두 제거
 *   - 시트 B(접수일자) / C("APP") / D(매장명) / J(접수내용)만 입력
 *   - 한글 깨짐 방지: 클라이언트 base64(UTF-8) → 서버 디코딩
 *
 * 배포:
 *   Deploy → Manage deployments → 기존 배포 [Edit] → Version: New version → Deploy
 *   (URL 그대로, 코드 갱신만)
 */

const SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';
const SHEET_NAME = '🚑AS리스트';
const TZ = 'Asia/Seoul';

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _summary(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.substring(0, max);
}

/** UTF-8 안전 디코딩: 클라이언트가 base64(UTF-8) 또는 평문 JSON 둘 다 처리 */
function _decodeBody(raw) {
  if (!raw) return null;
  // base64로 보낸 경우 우선 시도
  try {
    const bytes = Utilities.base64Decode(raw, Utilities.Charset.UTF_8);
    const json = Utilities.newBlob(bytes).getDataAsString('UTF-8');
    const obj = JSON.parse(json);
    if (obj && typeof obj === 'object') return obj;
  } catch (e) { /* fall through */ }
  // 평문 JSON 폴백
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function doGet(e) {
  return _json({ ok: true, message: 'AS request endpoint. POST to submit.' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ ok: false, error: 'No body' });
    }
    const data = _decodeBody(e.postData.contents);
    if (!data) return _json({ ok: false, error: 'Invalid body' });

    const branch = String(data.branch || '').trim();
    const issue = String(data.issue || '').trim();

    if (!branch) return _json({ ok: false, error: '매장명 누락' });
    if (!issue) return _json({ ok: false, error: '하자내용 누락' });

    const now = new Date();
    const sheetDate = Utilities.formatDate(now, TZ, 'yyyy. MM. dd');
    const issueSummary = _summary(issue, 30);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return _json({ ok: false, error: `시트 탭 '${SHEET_NAME}'을(를) 찾을 수 없습니다.` });
    }

    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 2).setValue(sheetDate); // B 접수일자
    sheet.getRange(newRow, 3).setValue('APP');      // C 접수채널
    sheet.getRange(newRow, 4).setValue(branch);     // D 매장명 (E~H 자동)
    sheet.getRange(newRow, 10).setValue(issueSummary); // J 접수내용

    return _json({
      ok: true,
      row: newRow,
      branch: branch,
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
