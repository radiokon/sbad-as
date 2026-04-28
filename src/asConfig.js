// AS 신청 백엔드 설정. Apps Script Web App URL을 발급받으면 여기 값을 교체.
// 형식: https://script.google.com/macros/s/AKfycbx.../exec

export const APPS_SCRIPT_URL = '__SET_APPS_SCRIPT_URL__';

export const HQ_AS_PHONE = '010-5420-4250';

// 매장 마스터(접수 시트) ID — D컬럼 unique 추출용 (드롭다운 옵션 데이터 소스)
export const REQUEST_SHEET_ID = '1HYnYrmdBX9Qzg3JV8gSaxXUysbIwvYPuXBMfGGJX3oE';

// 매장 목록 fetch 우선순위:
//   1) Apps Script GET ?action=stores  (인증 후 정확)
//   2) Sheet CSV gviz endpoint         (공개 시트라 빠른 폴백)
export const STORES_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/gviz/tq?tqx=out:csv&gid=0&range=D3:D`;

export const isAppsScriptConfigured = () =>
  APPS_SCRIPT_URL && APPS_SCRIPT_URL !== '__SET_APPS_SCRIPT_URL__';
