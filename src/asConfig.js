// AS 신청 백엔드 설정. Apps Script Web App URL을 발급받으면 여기 값을 교체.
// 형식: https://script.google.com/macros/s/AKfycbx.../exec

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyt_nDzXT8LW_YsD6p5n6eLmzzoS-wGNHuUFNOdyZVnIxsB-c6-Ea_xcbmZxgnGJ9Nuew/exec';

// 매장 마스터(접수 시트) ID — D컬럼 unique 추출용 (드롭다운 옵션 데이터 소스)
export const REQUEST_SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';

// 매장 마스터 탭(gid=1021023439) B컬럼.
// 시트 행 5~177 = 정식 매장 173개 (B5 김포운양 ~ B177 안산선부).
// B178(경주용황)은 미오픈이라 제외.
const STORES_GID = '1021023439';
export const STORES_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${STORES_GID}&range=B5:B177`;

// 폐점 / 미오픈 등 드롭다운에서 숨길 매장.
export const EXCLUDED_STORES = ['다산신도시'];

export const isAppsScriptConfigured = () =>
  APPS_SCRIPT_URL && APPS_SCRIPT_URL !== '__SET_APPS_SCRIPT_URL__';
