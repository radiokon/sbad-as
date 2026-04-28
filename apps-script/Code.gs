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
    if (action === 'peek') {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        const cs = ss.getSheets().filter(s => /AS/i.test(s.getName()));
        if (cs.length === 1) sheet = cs[0];
      }
      if (!sheet) return _json({ ok: false, error: 'sheet not found' });
      const from = parseInt(e.parameter.from, 10) || 370;
      const to = parseInt(e.parameter.to, 10) || (from + 10);
      const count = Math.max(1, Math.min(50, to - from + 1));
      const values = sheet.getRange(from, 1, count, 13).getValues();
      const rows = values.map((r, i) => ({
        row: from + i,
        A: r[0], B: r[1], C: r[2], D: r[3], J: r[9], K: r[10],
      }));
      return _json({ ok: true, sheet: sheet.getName(), rows: rows });
    }
    if (action === 'version') {
      return _json({ ok: true, version: 'v4-append-2026-04-29' });
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

    // 시트의 시간순 가장 마지막 데이터 행을 찾고 그 다음 행에 추가.
    // 어느 컬럼이라도 데이터 있는 행을 '데이터 행'으로 본다 (그룹 라벨 행 포함).
    // 이렇게 하면 시트 위쪽의 빈 영역이나 라벨 행에 잘못 들어가지 않음.
    const SEARCH_LIMIT = 2000;
    const limit = Math.min(SEARCH_LIMIT, sheet.getMaxRows());
    const isEmpty = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || v === '';

    const block = sheet.getRange(1, 1, limit, 13).getValues(); // A~M
    const findLast = (col) => {
      for (let i = block.length - 1; i >= 0; i--) {
        if (!isEmpty(block[i][col])) return i + 1;
      }
      return 0;
    };
    const lastA = findLast(0);
    const lastB = findLast(1);
    const lastC = findLast(2);
    const lastD = findLast(3);
    const lastJ = findLast(9);
    const lastK = findLast(10);
    const lastL = findLast(11);
    const lastM = findLast(12);

    const lastDataRow = Math.max(lastA, lastB, lastC, lastD, lastJ, lastK, lastL, lastM);
    let newRow = Math.max(lastDataRow + 1, 4); // 헤더 영역(1~3) 보호

    sheet.getRange(newRow, 2).setValue(sheetDate); // B 접수일자
    sheet.getRange(newRow, 3).setValue('APP');      // C 접수채널
    sheet.getRange(newRow, 4).setValue(branch);     // D 매장명 (E~H 자동)
    sheet.getRange(newRow, 10).setValue(issueSummary); // J 접수내용
    SpreadsheetApp.flush();

    return _json({
      ok: true,
      row: newRow,
      sheetName: sheet.getName(),
      branch: branch,
      version: 'v4-append',
      lastDataRow: lastDataRow,
      lastA: lastA, lastB: lastB, lastC: lastC, lastD: lastD, lastJ: lastJ,
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
