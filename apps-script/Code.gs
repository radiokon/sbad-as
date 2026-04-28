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
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === 'tabs') {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const tabs = ss.getSheets().map(s => ({ name: s.getName(), id: s.getSheetId() }));
      return _json({ ok: true, target: SHEET_NAME, tabs: tabs });
    }
    return _json({ ok: true, message: 'AS request endpoint. POST to submit.' });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
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
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      // fallback: 'AS' 키워드 포함하는 탭 찾기 (이모지 매칭 실패 대비)
      const candidates = ss.getSheets().filter(s => /AS/i.test(s.getName()));
      if (candidates.length === 1) {
        sheet = candidates[0];
      } else {
        const all = ss.getSheets().map(s => s.getName());
        return _json({
          ok: false,
          error: `'${SHEET_NAME}' 탭을 찾을 수 없습니다. 시트의 탭 목록: [${all.map(n => `"${n}"`).join(', ')}]`,
        });
      }
    }

    // A컬럼(접수넘버) 기준 마지막 데이터 행의 다음 = 첫 빈 행
    // B/C/D 등 다른 컬럼의 기존 데이터에 영향받지 않음
    const sheetLastRow = Math.max(sheet.getLastRow(), 1);
    const aValues = sheet.getRange(1, 1, sheetLastRow, 1).getValues();
    let lastARow = 0;
    for (let i = aValues.length - 1; i >= 0; i--) {
      const v = aValues[i][0];
      if (v !== '' && v !== null && v !== undefined) {
        lastARow = i + 1;
        break;
      }
    }
    // A가 비어있으면 헤더 다음(4행)부터 시작 (시트 1~3행이 헤더 영역)
    const newRow = Math.max(lastARow + 1, 4);

    sheet.getRange(newRow, 2).setValue(sheetDate); // B 접수일자
    sheet.getRange(newRow, 3).setValue('APP');      // C 접수채널
    sheet.getRange(newRow, 4).setValue(branch);     // D 매장명 (E~H 자동)
    sheet.getRange(newRow, 10).setValue(issueSummary); // J 접수내용
    SpreadsheetApp.flush();

    return _json({
      ok: true,
      row: newRow,
      sheetName: sheet.getName(),
      sheetLastRowBefore: sheetLastRow,
      lastARowBefore: lastARow,
      branch: branch,
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
