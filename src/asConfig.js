// AS 신청 백엔드 설정. Apps Script Web App URL을 발급받으면 여기 값을 교체.
// 형식: https://script.google.com/macros/s/AKfycbx.../exec

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiPXHeR1n0ugk7ZcgyeAzCUyVzjxufK2yo2wOGa58Ubnw5ymFYLaH-fgE6y0v0MNRH4A/exec';

// 매장 마스터(접수 시트) ID — D컬럼 unique 추출용 (드롭다운 옵션 데이터 소스)
export const REQUEST_SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';

// 매장 마스터 탭(gid=1021023439) B컬럼.
// 매장 No 1~172 = 시트 행 5~176. 그 뒤(B177=안산선부 No.177, B178=경주용황 No.173)는
// 비순차 추가 행이라 사용자 요청대로 제외.
const STORES_GID = '1021023439';
export const STORES_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${STORES_GID}&range=B5:B176`;

export const isAppsScriptConfigured = () =>
  APPS_SCRIPT_URL && APPS_SCRIPT_URL !== '__SET_APPS_SCRIPT_URL__';
