/**
 * Shabuallday AS Request Receiver
 * 시트 1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE 의 Apps Script
 * (Extensions → Apps Script 에 이 파일 내용 전체 붙여넣기)
 *
 * 배포 방법:
 *   Deploy → New deployment → Type: Web app
 *   Execute as: Me  /  Who has access: Anyone
 *   배포 후 발급되는 Web App URL 을 프론트에 입력
 */

const SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';
const FOLDER_ID = '10p3MrySfZRFsghn_n33-JhgFUhoGaJ_u';
const TZ = 'Asia/Seoul';

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _safe(s) {
  return String(s || '').replace(/[\\\/:*?"<>|\r\n\t]/g, '').trim();
}

function _summary(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.substring(0, max);
}

/** GET — 매장 목록 (D컬럼 unique) JSON 반환. 프론트가 캐시해서 드롭다운에 사용. */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === 'stores') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
      const last = sheet.getLastRow();
      const rng = sheet.getRange(3, 4, Math.max(1, last - 2), 1).getValues();
      const set = {};
      rng.forEach(r => {
        const v = String(r[0] || '').trim();
        if (v) set[v] = true;
      });
      const stores = Object.keys(set).sort((a, b) => a.localeCompare(b, 'ko'));
      return _json({ ok: true, stores: stores });
    }
    return _json({ ok: true, message: 'AS request endpoint. POST to submit.' });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

/**
 * POST — 신청 접수
 *   body(JSON): { branch, issue, location, manager, contact, photos: [{ name, mimeType, data(base64) }] }
 *   1) 드라이브 폴더 YYYYMMDD_매장명_증상요약 생성
 *   2) 사진 base64 디코드 후 업로드
 *   3) TXT 파일에 접수 내용 저장
 *   4) 시트 다음 행에 B(접수일자), C("APP"), D(매장명), J(접수내용), K(폴더 하이퍼링크) 입력
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ ok: false, error: 'No body' });
    }
    const data = JSON.parse(e.postData.contents);
    const branch = _safe(data.branch);
    const issue = String(data.issue || '').trim();
    const location = String(data.location || '').trim();
    const manager = String(data.manager || '').trim();
    const contact = String(data.contact || '').trim();
    const photos = Array.isArray(data.photos) ? data.photos : [];

    if (!branch) return _json({ ok: false, error: '매장명 누락' });
    if (!issue) return _json({ ok: false, error: '하자내용 누락' });

    const now = new Date();
    const sheetDate = Utilities.formatDate(now, TZ, 'yyyy. MM. dd');
    const folderDate = Utilities.formatDate(now, TZ, 'yyyyMMdd');
    const fileStamp = Utilities.formatDate(now, TZ, 'yyyyMMdd_HHmmss');
    const issueSummary = _summary(issue, 30);

    // 1) 드라이브 폴더 생성
    const parent = DriveApp.getFolderById(FOLDER_ID);
    const folderName = `${folderDate}_${_safe(branch)}_${_safe(issueSummary)}`;
    const folder = parent.createFolder(folderName);

    // 2) 사진 업로드
    let photoCount = 0;
    photos.forEach((p, idx) => {
      try {
        if (!p || !p.data) return;
        const mime = p.mimeType || 'image/jpeg';
        const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const name = p.name || `photo_${idx + 1}.${ext}`;
        const blob = Utilities.newBlob(Utilities.base64Decode(p.data), mime, name);
        folder.createFile(blob);
        photoCount += 1;
      } catch (er) {
        // 한 장 실패해도 나머지 진행
      }
    });

    // 3) TXT 저장
    const txt = [
      `접수일자: ${sheetDate} ${Utilities.formatDate(now, TZ, 'HH:mm:ss')}`,
      `매장명: ${branch}`,
      `하자내용: ${issue}`,
      `위치: ${location}`,
      `관리자: ${manager}`,
      `연락처: ${contact}`,
      `사진: ${photoCount}장`,
    ].join('\n');
    folder.createFile(`${fileStamp}_접수내용.txt`, txt, 'text/plain');

    // 4) 시트 행 추가
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 2).setValue(sheetDate); // B 접수일자
    sheet.getRange(newRow, 3).setValue('APP'); // C 접수채널
    sheet.getRange(newRow, 4).setValue(branch); // D 매장명 (E~H는 시트 수식이 자동)
    sheet.getRange(newRow, 10).setValue(issueSummary); // J 접수내용 요약
    const folderUrl = folder.getUrl();
    const linkLabel = photoCount > 0 ? `사진 ${photoCount}장` : '폴더';
    sheet.getRange(newRow, 11).setFormula(`=HYPERLINK("${folderUrl}","${linkLabel}")`); // K 사진

    return _json({
      ok: true,
      row: newRow,
      folderUrl: folderUrl,
      photoCount: photoCount,
      branch: branch,
    });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
