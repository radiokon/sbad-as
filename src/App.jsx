import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronRight, ChevronLeft, Phone, AlertTriangle,
  Snowflake, Wind, Lightbulb, Zap,
  Utensils, Wrench, CheckCircle2, XCircle,
  Home, BookOpen, AlertCircle,
  Clock, Shield, Leaf, ExternalLink, Settings,
  Armchair, LayoutGrid, Tag, Droplets, Info, Loader2
} from 'lucide-react';

const SHEET_ID = '15ikYhQMT9gt_WveoWxKTwi1f1yjHH02GObpmrzxl8a8';

const sheetUrl = (sheetName) => 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

const iconMap = {
  Lightbulb, Zap, Tag, Wrench, Droplets, Settings, 
  Armchair, Utensils, LayoutGrid, Wind, Snowflake
};

function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const parseLine = (line) => {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
      else { current += char; }
    }
    result.push(current);
    return result;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
    return row;
  });
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [search, setSearch] = useState('');
  const [completedSteps, setCompletedSteps] = useState({});
  const [data, setData] = useState({ categories: [], issues: [], steps: [], details: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TEAL = '#1F7A7A';
  const TEAL_DEEP = '#155E5E';
  const IVORY = '#FAF4E4';
  const IVORY_SOFT = '#FDF9ED';
  const INK = '#1A2E2E';
  const INK_MUTED = '#5A6E6E';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, issRes, stpRes, detRes] = await Promise.all([
          fetch(sheetUrl('categories')).then(r => r.text()),
          fetch(sheetUrl('issues')).then(r => r.text()),
          fetch(sheetUrl('steps')).then(r => r.text()),
          fetch(sheetUrl('details')).then(r => r.text()),
        ]);
        setData({
          categories: parseCSV(catRes),
          issues: parseCSV(issRes),
          steps: parseCSV(stpRes),
          details: parseCSV(detRes),
        });
        setError(null);
      } catch (err) {
        setError('매뉴얼 데이터를 불러오는 중 문제가 발생했어요.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = useMemo(() => {
    return data.categories
      .map(cat => ({
        ...cat,
        order: parseInt(cat.order) || 999,
        issues: data.issues
          .filter(iss => iss.category_id === cat.id)
          .map(iss => ({ ...iss, order: parseInt(iss.order) || 999 }))
          .sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => a.order - b.order);
  }, [data]);

  const issueDetailsMap = useMemo(() => {
    const map = {};
    data.issues.forEach(iss => {
      const stepsList = data.steps
        .filter(s => s.issue_id === iss.id)
        .map(s => ({ ...s, order: parseInt(s.order) || 999 }))
        .sort((a, b) => a.order - b.order);
      const detail = data.details.find(d => d.issue_id === iss.id) || {};
      map[iss.id] = {
        title: iss.title,
        category: data.categories.find(c => c.id === iss.category_id)?.label || '',
        warning: detail.warning || null,
        steps: stepsList,
        callIf: detail.callIf || '',
        tip: detail.tip || null,
      };
    });
    return map;
  }, [data]);

  const filteredIssues = useMemo(() => {
    if (!search) return [];
    const allIssues = categories.flatMap(cat => 
      cat.issues.map(iss => ({ ...iss, category: cat.label, categoryId: cat.id }))
    );
    return allIssues.filter(iss => 
      iss.title.toLowerCase().includes(search.toLowerCase()) ||
      iss.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, categories]);

  const goToIssue = (categoryId, issueId) => {
    setSelectedCategory(categoryId);
    setSelectedIssue(issueId);
    setScreen('issue');
    setCompletedSteps({});
    setSearch('');
  };
  const goHome = () => { setScreen('home'); setSelectedCategory(null); setSelectedIssue(null); setSearch(''); };
  const goToCategory = (categoryId) => { setSelectedCategory(categoryId); setScreen('category'); };
  const goToSitemap = () => { setScreen('sitemap'); setSelectedCategory(null); setSelectedIssue(null); setSearch(''); };
  const toggleStep = (idx) => { setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] })); };

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const currentIssue = selectedIssue ? issueDetailsMap[selectedIssue] : null;

  const severityConfig = {
    high: { label: '긴급', color: '#C84A3F', bg: '#FBE3E0' },
    mid: { label: '보통', color: '#C97F1F', bg: '#FBEBD3' },
    low: { label: '간단', color: '#3F8B5E', bg: '#DDEEDF' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: TEAL, color: 'white' }}>
        <div className="text-center">
          <div className="text-[10px] tracking-[0.25em] opacity-80 mb-1">premium beef &amp; veggies</div>
          <div className="text-2xl font-black tracking-tight mb-6">SHABUALLDAY</div>
          <Loader2 className="w-8 h-8 mx-auto animate-spin opacity-80" />
          <div className="text-xs opacity-70 mt-3">매뉴얼 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: IVORY_SOFT }}>
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: '#C84A3F' }} />
          <div className="font-bold mb-2" style={{ color: INK }}>데이터 로드 실패</div>
          <div className="text-sm mb-4" style={{ color: INK_MUTED }}>{error}</div>
          <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ backgroundColor: TEAL, color: 'white' }}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: IVORY_SOFT, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="w-full max-w-md relative pb-24" style={{ backgroundColor: '#FFFFFF', color: INK }}>
        
        {screen === 'home' && (
          <>
            <header className="px-5 pt-10 pb-6" style={{ backgroundColor: TEAL, color: '#FFFFFF' }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[10px] tracking-[0.25em] opacity-80">premium beef &amp; veggies</div>
                  <div className="text-2xl font-black tracking-tight">SHABUALLDAY</div>
                </div>
                <Leaf className="w-6 h-6 opacity-90" />
              </div>
              <div className="text-xs opacity-70 mt-1">점주용 운영 매뉴얼</div>
            </header>

            <div className="px-5 pt-6 pb-5" style={{ backgroundColor: IVORY }}>
              <h1 className="text-xl font-bold mb-1" style={{ color: INK }}>AS 자가수리 매뉴얼</h1>
              <p className="text-sm leading-relaxed" style={{ color: INK_MUTED }}>
                문제가 발생했나요?<br/>단계별 가이드로 빠르게 해결하세요.
              </p>
              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: INK_MUTED }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="증상이나 장비명 검색"
                  className="w-full bg-white border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: '#E5DEC9', color: INK }} />
              </div>
            </div>

            {search && (
              <div className="px-5 pt-5 pb-2 bg-white">
                <div className="text-xs mb-2" style={{ color: INK_MUTED }}>{filteredIssues.length}개 결과</div>
                <div className="space-y-2">
                  {filteredIssues.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: INK_MUTED }}>검색 결과가 없어요</div>
                  ) : (
                    filteredIssues.map(iss => (
                      <button key={iss.id} onClick={() => goToIssue(iss.categoryId, iss.id)}
                        className="w-full rounded-xl p-3 text-left flex items-center justify-between transition-colors"
                        style={{ backgroundColor: IVORY_SOFT, border: `1px solid #EFE7D2` }}>
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: INK_MUTED }}>{iss.category}</div>
                          <div className="text-sm font-medium" style={{ color: INK }}>{iss.title}</div>
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: INK_MUTED }} />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {!search && (
              <>
                <div className="px-5 pt-5 pb-2 bg-white">
                  <a href="https://fcdaum.com/" target="_blank" rel="noopener noreferrer"
                    className="block rounded-2xl p-4 transition-all active:scale-[0.98]"
                    style={{ backgroundColor: TEAL_DEEP, color: '#FFFFFF' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold mb-0.5 opacity-90">1년 이전 매장 AS 접수</div>
                        <div className="text-sm font-bold">다움FC에 접수해주세요</div>
                        <div className="text-[10px] opacity-80 mt-0.5">fcdaum.com</div>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                </div>

                <div className="px-5 pt-6 pb-2 bg-white">
                  <h2 className="text-sm font-bold mb-3" style={{ color: INK }}>카테고리별 매뉴얼</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(cat => {
                      const Icon = iconMap[cat.icon] || Wrench;
                      return (
                        <button key={cat.id} onClick={() => goToCategory(cat.id)}
                          className="rounded-2xl p-4 text-left transition-all active:scale-95"
                          style={{ backgroundColor: IVORY, border: '1px solid #EFE7D2' }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: cat.bg }}>
                            <Icon className="w-5 h-5" style={{ color: cat.color }} />
                          </div>
                          <div className="font-semibold text-sm mb-0.5" style={{ color: INK }}>{cat.label}</div>
                          <div className="text-xs" style={{ color: INK_MUTED }}>{cat.issues.length}개 항목</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-5 pt-6 pb-6 bg-white">
                  <div className="rounded-2xl p-4" style={{ backgroundColor: IVORY, border: '1px solid #EFE7D2' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: TEAL }}>
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm mb-1" style={{ color: INK }}>안전 수칙 + 다움FC 활용 팁</div>
                        <div className="text-xs leading-relaxed" style={{ color: INK_MUTED }}>
                          전기·가스 작업은 반드시 전원 차단 후 진행. 다움FC 접수 시 <strong>사업자등록증을 함께 업로드</strong>하면 세금계산서 발행 및 일정 조율이 수월합니다.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {screen === 'sitemap' && (
          <>
            <header className="px-5 pt-8 pb-5 sticky top-0 z-10" style={{ backgroundColor: TEAL, color: '#FFFFFF' }}>
              <button onClick={goHome} className="flex items-center gap-1 text-sm mb-3 opacity-80 hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />홈
              </button>
              <h1 className="text-xl font-bold">전체 매뉴얼</h1>
              <div className="text-xs opacity-80 mt-1">대분류 {categories.length}개 · 항목 {data.issues.length}개</div>
            </header>
            <div className="px-5 py-6 bg-white">
              <div className="space-y-6">
                {categories.map((cat) => {
                  const Icon = iconMap[cat.icon] || Wrench;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b" style={{ borderColor: '#EFE7D2' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                          <Icon className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <div className="font-bold text-base" style={{ color: INK }}>{cat.label}</div>
                        <div className="text-xs ml-1" style={{ color: INK_MUTED }}>({cat.issues.length})</div>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {cat.issues.map((iss) => (
                          <li key={iss.id}>
                            <button onClick={() => goToIssue(cat.id, iss.id)}
                              className="w-full text-left flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors group">
                              <span className="text-sm leading-tight mt-0.5" style={{ color: cat.color }}>•</span>
                              <span className="text-sm leading-snug flex-1" style={{ color: INK }}>{iss.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: INK_MUTED }} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {screen === 'category' && currentCategory && (
          <>
            <header className="px-5 pt-8 pb-5 sticky top-0 z-10" style={{ backgroundColor: TEAL, color: '#FFFFFF' }}>
              <button onClick={goHome} className="flex items-center gap-1 text-sm mb-4 opacity-80 hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />홈
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  {(() => {
                    const Icon = iconMap[currentCategory.icon] || Wrench;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{currentCategory.label}</h1>
                  <div className="text-xs opacity-80">{currentCategory.issues.length}개 항목</div>
                </div>
              </div>
            </header>
            <div className="px-5 py-5 space-y-2 bg-white">
              <div className="text-xs mb-3" style={{ color: INK_MUTED }}>항목을 선택하세요</div>
              {currentCategory.issues.map(iss => {
                const sev = severityConfig[iss.severity] || severityConfig.low;
                return (
                  <button key={iss.id} onClick={() => goToIssue(currentCategory.id, iss.id)}
                    className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                    style={{ backgroundColor: IVORY, border: '1px solid #EFE7D2' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-medium text-sm flex-1" style={{ color: INK }}>{iss.title}</div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: INK_MUTED }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: INK_MUTED }}>
                        <Clock className="w-3 h-3" />약 {iss.time}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {screen === 'issue' && currentIssue && (
          <>
            <header className="px-5 pt-8 pb-5 sticky top-0 z-10" style={{ backgroundColor: TEAL, color: '#FFFFFF' }}>
              <button onClick={() => setScreen(selectedCategory ? 'category' : 'sitemap')} className="flex items-center gap-1 text-sm mb-3 opacity-80 hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />{currentIssue.category}
              </button>
              <h1 className="text-xl font-bold leading-tight">{currentIssue.title}</h1>
            </header>
            <div className="px-5 py-5 space-y-4 bg-white">
              {currentIssue.warning && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#FBEBD3', border: '1px solid #F0D9A8' }}>
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#C97F1F' }} />
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: '#9C621A' }}>주의사항</div>
                      <div className="text-sm leading-relaxed" style={{ color: '#7A4F18' }}>{currentIssue.warning}</div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs mb-3 font-bold tracking-wide uppercase" style={{ color: TEAL_DEEP }}>자가 점검 단계</div>
                <div className="space-y-3">
                  {currentIssue.steps.map((step, idx) => {
                    const completed = completedSteps[idx];
                    return (
                      <button key={idx} onClick={() => toggleStep(idx)}
                        className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                        style={completed ? { backgroundColor: '#DDEEDF', border: '1px solid #B8D8C0' } : { backgroundColor: IVORY, border: '1px solid #EFE7D2' }}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                            style={completed ? { backgroundColor: '#3F8B5E', color: 'white' } : { backgroundColor: TEAL, color: 'white' }}>
                            {completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm mb-1" style={completed ? { color: INK_MUTED, textDecoration: 'line-through' } : { color: INK }}>{step.title}</div>
                            <div className="text-sm leading-relaxed" style={completed ? { color: INK_MUTED } : { color: '#3A4848' }}>{step.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {currentIssue.tip && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: IVORY_SOFT, border: '1px dashed #C9B98C' }}>
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#9C621A' }} />
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: '#9C621A' }}>다움FC 활용 팁</div>
                      <div className="text-sm leading-relaxed" style={{ color: '#7A4F18' }}>{currentIssue.tip}</div>
                    </div>
                  </div>
                </div>
              )}
              {currentIssue.callIf && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: TEAL, color: 'white' }}>
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm mb-1">본사 AS 신청 기준</div>
                      <div className="text-sm leading-relaxed opacity-95">{currentIssue.callIf}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2 pt-2">
                <a href="tel:010-5420-4250" className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm" style={{ backgroundColor: TEAL, color: 'white' }}>
                  <Phone className="w-4 h-4" />본사 AS팀 전화 (010-5420-4250)
                </a>
                <a href="https://fcdaum.com/" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: IVORY, color: TEAL_DEEP, border: '1px solid #EFE7D2' }}>
                  <ExternalLink className="w-4 h-4" />다움FC 접수 (1년 이전 매장)
                </a>
              </div>
              <div className="pt-4 pb-2">
                <div className="text-xs text-center mb-3" style={{ color: INK_MUTED }}>이 매뉴얼이 도움 되셨나요?</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: IVORY_SOFT, border: '1px solid #EFE7D2', color: INK }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#3F8B5E' }} />해결됐어요
                  </button>
                  <button className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: IVORY_SOFT, border: '1px solid #EFE7D2', color: INK }}>
                    <XCircle className="w-4 h-4" style={{ color: '#C84A3F' }} />안 됐어요
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 py-3" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #EFE7D2' }}>
          <div className="flex justify-around">
            <button onClick={goHome} className="flex flex-col items-center gap-1 transition-colors py-1" style={{ color: screen === 'home' ? TEAL : INK_MUTED }}>
              <Home className="w-5 h-5" /><span className="text-[10px] font-bold">홈</span>
            </button>
            <button onClick={goToSitemap} className="flex flex-col items-center gap-1 transition-colors py-1" style={{ color: screen === 'sitemap' ? TEAL : INK_MUTED }}>
              <BookOpen className="w-5 h-5" /><span className="text-[10px] font-bold">전체 매뉴얼</span>
            </button>
            <a href="tel:010-5420-4250" className="flex flex-col items-center gap-1 transition-colors py-1" style={{ color: INK_MUTED }}>
              <Phone className="w-5 h-5" /><span className="text-[10px] font-bold">본사 연락</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}