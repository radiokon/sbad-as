// AS 신청 백엔드 설정. Apps Script Web App URL을 발급받으면 여기 값을 교체.
// 형식: https://script.google.com/macros/s/AKfycbx.../exec

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiPXHeR1n0ugk7ZcgyeAzCUyVzjxufK2yo2wOGa58Ubnw5ymFYLaH-fgE6y0v0MNRH4A/exec';

// 매장 마스터(접수 시트) ID — D컬럼 unique 추출용 (드롭다운 옵션 데이터 소스)
export const REQUEST_SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';

// 매장 마스터 탭(gid=1021023439) B컬럼에서 매장명 가져오기.
// B1은 헤더("매장명")라 B2부터. 빈 셀은 gviz가 자동 트리밍.
const STORES_GID = '1021023439';
export const STORES_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${STORES_GID}&range=B2:B`;

export const isAppsScriptConfigured = () =>
  APPS_SCRIPT_URL && APPS_SCRIPT_URL !== '__SET_APPS_SCRIPT_URL__';
