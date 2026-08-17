"use strict";

const app = document.getElementById("app");
const state = { screen: "home", loading: true, error: "", query: "", type: "all", mountains: [], courses: [], trails: [], results: [], selected: null };
let toastTimer;

const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const clean = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const short = (value, size = 130) => clean(value).length > size ? `${clean(value).slice(0, size)}…` : clean(value);

function normalizeMountain(item, index) {
  return {
    kind: "mountain", id: `mountain-${item.mntilistno || index}`,
    name: clean(item.mntiname) || "이름 없는 산", region: clean(item.mntiadd) || "지역 정보 없음",
    height: clean(item.mntihigh), summary: clean(item.mntisummary || item.mntidetails),
    details: clean(item.mntidetails || item.mntisummary), manager: clean(item.mntiadmin), source: "산림청",
  };
}

function normalizeCourse(item, index) {
  return {
    kind: "course", id: `course-${item.crsIdx || item.routeIdx || index}`,
    name: clean(item.crsKorNm) || "이름 없는 걷기 코스", region: clean(item.sigun) || "지역 정보 없음",
    distance: clean(item.crsDstnc), duration: clean(item.crsTotlRqrmHour), level: clean(item.crsLevel),
    summary: clean(item.crsSummary || item.crsContents), details: clean(item.crsContents || item.crsSummary),
    travelerInfo: clean(item.travelerinfo), gpxPath: clean(item.gpxpath), source: "두루누비",
  };
}

function formatMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return "정보 없음";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}시간` : ""}${hours && rest ? " " : ""}${rest ? `${rest}분` : ""}`;
}

function normalizeTrail(item, index) {
  const start = clean(item.start);
  const via = clean(item.via);
  const end = clean(item.end);
  return {
    kind: "trail", id: `trail-${index}`,
    name: clean(item.name) || `${start}~${end}` || "이름 없는 탐방로",
    region: "국립공원 탐방로", start, via, end,
    distance: Number(item.distanceMeters) ? (Number(item.distanceMeters) / 1000).toFixed(1) : "",
    uphill: formatMinutes(item.uphillMinutes), downhill: formatMinutes(item.downhillMinutes),
    summary: [start, via, end].filter(Boolean).join(" → "),
    details: [start, via, end].filter(Boolean).join(" → "), source: "국립공원공단",
  };
}

function toast(message) {
  clearTimeout(toastTimer);
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  toastTimer = setTimeout(() => node.remove(), 2300);
}

function header() {
  return `<header class="topbar"><button class="brand" data-action="home"><span class="brand-mark" aria-hidden="true">👣</span>두발로 구석구석</button><div class="weather"><span>전국 산·걷기길</span><b>${state.mountains.length.toLocaleString()}개 산</b><span>${(state.courses.length + state.trails.length).toLocaleString()}개 코스</span></div><button class="round" data-action="help" aria-label="도움말">?</button></header>`;
}

function bottomNav(active) {
  return `<nav class="bottom-nav" aria-label="주 메뉴"><button class="${active === "home" ? "active" : ""}" data-action="home"><span>⌂</span>홈</button><button class="${active === "search" ? "active" : ""}" data-action="search"><span>⌕</span>검색</button><button data-action="near"><span>◎</span>내 주변</button><button data-action="saved"><span>♡</span>저장</button><button data-action="profile"><span>☻</span>내 정보</button></nav>`;
}

function searchForm(compact = false) {
  return `<form class="search" data-search-form style="${compact ? "margin-bottom:20px;box-shadow:none;border:1px solid #dfe4df" : ""}"><span class="glass">⌕</span><input name="query" value="${esc(state.query)}" placeholder="산 이름, 지역 또는 걷기 코스를 검색하세요" aria-label="산과 걷기 코스 검색" style="flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-weight:700"><button type="submit" style="padding:9px 14px;border-radius:5px;background:#d9f077;font-weight:900">검색</button></form>`;
}

function homeView() {
  const message = state.loading ? "전국 데이터를 불러오는 중입니다…" : state.error || `산림청 산 ${state.mountains.length.toLocaleString()}개, 두루누비 ${state.courses.length.toLocaleString()}개, 국립공원 탐방로 ${state.trails.length.toLocaleString()}개를 검색할 수 있습니다.`;
  return `<main class="app">${header()}<section class="hero"><span class="eyebrow">전국 산과 걷기길을 한곳에서</span><h1>오늘은,<br>어느 길로 갈까요?</h1><p>${esc(message)}</p>${searchForm()}<div class="quick"><button data-quick="북한산">북한산</button><button data-quick="지리산">지리산</button><button data-quick="설악산">설악산</button><button data-quick="제주">제주 걷기길</button></div></section><section class="section"><div class="section-title"><div><h2>전국 산길을 찾아보세요</h2></div></div><button class="mountain-card" data-action="search"><div class="mountain-visual club-visual"><img src="./home-hero.png" alt="초원 산책로에서 함께 걷는 두발로 구석구석 동호회원"><span class="badge left">산림청 전국 산 정보</span><span class="badge right">두루누비 걷기 코스</span><small class="creator-credit">by khd</small></div><div class="mountain-info"><span class="level">전국 검색</span><h3>${state.mountains.length.toLocaleString()}개 산</h3><p>산 이름과 지역으로 산림청의 상세정보를 검색하세요.</p><div class="facts"><div class="fact"><span>산 정보</span><b>${state.mountains.length.toLocaleString()}건</b></div><div class="fact"><span>걷기 코스</span><b>${state.courses.length.toLocaleString()}건</b></div><div class="fact"><span>출처</span><b>산림청·두루누비</b></div></div></div></button></section>${bottomNav("home")}</main>`;
}

function typeButtons() {
  return [["all", "전체"], ["mountain", "산"], ["course", "걷기 코스"], ["trail", "탐방로"]].map(([value, label]) => `<button class="${state.type === value ? "active" : ""}" data-type="${value}">${label}</button>`).join("");
}

function resultCard(item, index) {
  const mountain = item.kind === "mountain";
  const trail = item.kind === "trail";
  return `<button class="course" data-result="${esc(item.id)}"><div class="course-top"><span class="rank">${String(index + 1).padStart(2, "0")}</span><div class="course-main"><em>${esc(item.region)} · ${mountain ? "산림청 산 정보" : trail ? "국립공원 탐방로" : "두루누비 걷기 코스"}</em><h3>${esc(item.name)}</h3><p>${esc(short(item.summary || item.region))}</p></div><span class="check">›</span></div><div class="metrics"><div><b>${esc(trail ? (item.start || "정보 없음") : item.region)}</b><span>${trail ? "출발점" : "지역"}</span></div><div><b>${esc(mountain ? (item.height ? `${item.height}m` : "정보 없음") : (item.distance ? `${item.distance}km` : "정보 없음"))}</b><span>${mountain ? "높이" : "거리"}</span></div><div><b>${esc(mountain ? (item.manager || "산림청") : trail ? item.uphill : (item.duration || "정보 없음"))}</b><span>${mountain ? "관리기관" : trail ? "상행시간" : "예상시간"}</span></div><div><b>${item.source}</b><span>출처</span></div></div></button>`;
}

function searchView() {
  const title = state.loading ? "데이터를 불러오는 중입니다" : state.query ? `‘${esc(state.query)}’ 검색 결과 ${state.results.length.toLocaleString()}건` : "검색어를 입력해 주세요";
  const cards = state.results.length ? state.results.slice(0, 50).map(resultCard).join("") : `<div class="course"><div class="course-main"><h3>${state.error ? "데이터를 불러오지 못했습니다" : "검색 결과가 없습니다"}</h3><p>${esc(state.error || "다른 산 이름이나 지역으로 검색해 보세요.")}</p></div></div>`;
  return `<main class="app"><header class="screen-head"><button class="back" data-action="home" aria-label="뒤로">‹</button><div><small>전국 공공데이터</small><h1>산·걷기 코스 검색</h1></div></header><section class="recommend"><aside class="filters"><span class="eyebrow" style="color:#668c78">전국 산길 찾기</span><h1>어디로<br>떠날까요?</h1><p>산 이름, 지역, 코스명 또는 출발·도착 지점을 입력하세요.</p><div class="choice"><label>검색 종류</label><div>${typeButtons()}</div></div><p style="margin-top:30px;font-size:12px">산림청 ${state.mountains.length.toLocaleString()}건<br>두루누비 ${state.courses.length.toLocaleString()}건<br>국립공원공단 탐방로 ${state.trails.length.toLocaleString()}건</p></aside><section class="results"><span class="results-label">검색 결과</span><h2>${title}</h2>${searchForm(true)}${cards}${state.results.length > 50 ? "<p>결과가 많아 처음 50건만 표시했습니다. 지역명을 함께 입력해 보세요.</p>" : ""}</section></section>${bottomNav("search")}</main>`;
}

function detailView() {
  const item = state.selected;
  if (!item) return searchView();
  const mountain = item.kind === "mountain";
  const trail = item.kind === "trail";
  const trailFacts = trail ? `<div class="caution"><b>탐방 경로</b><span>${esc(item.start || "정보 없음")} → ${esc(item.via || "경유지 없음")} → ${esc(item.end || "정보 없음")}</span></div><div class="metrics"><div><b>${esc(item.uphill)}</b><span>상행</span></div><div><b>${esc(item.downhill)}</b><span>하행</span></div></div>` : "";
  return `<main class="app"><header class="screen-head"><button class="back" data-action="search" aria-label="뒤로">‹</button><div><small>${item.source}</small><h1>${esc(item.name)}</h1></div></header><section class="detail"><div class="map-wrap"><div class="mountain-visual" style="position:absolute;inset:0"><div class="sun"></div><div class="ridge back"></div><div class="ridge"></div><span class="badge left">${esc(item.region)}</span><span class="badge right">${mountain ? "전국 산 정보" : trail ? "국립공원 탐방로" : "걷기 코스"}</span></div></div><aside class="summary"><span class="eyebrow">${mountain ? "산림청 산 정보" : trail ? "국립공원공단 탐방로" : "두루누비 걷기 코스"}</span><h2>${esc(item.name)}</h2><p>${esc(item.details || item.summary || "상세 설명이 제공되지 않았습니다.")}</p><div class="metrics"><div><b>${esc(trail ? (item.start || "없음") : item.region)}</b><span>${trail ? "출발점" : "지역"}</span></div><div><b>${esc(mountain ? (item.height ? `${item.height}m` : "없음") : (item.distance ? `${item.distance}km` : "없음"))}</b><span>${mountain ? "높이" : "거리"}</span></div><div><b>${esc(trail ? (item.end || "없음") : mountain ? (item.manager || "없음") : (item.duration || "없음"))}</b><span>${trail ? "도착점" : mountain ? "관리기관" : "예상시간"}</span></div><div><b>${item.source}</b><span>출처</span></div></div>${trailFacts}${!mountain && item.travelerInfo ? `<div class="caution"><b>여행자 안내</b><span>${esc(item.travelerInfo)}</span></div>` : ""}<button class="naver-link" data-naver-search="${esc(trail ? `${item.start} ${item.end}` : item.name)}">N 네이버 지도에서 검색<span>›</span></button>${!mountain && item.gpxPath ? `<button class="primary" data-gpx="${esc(item.gpxPath)}">GPX 경로 열기 <span>›</span></button>` : ""}<small class="fine">산행 전 현장 통제·날씨·안전정보를 확인하세요.</small></aside></section>${bottomNav("search")}</main>`;
}

function runSearch(query = state.query) {
  state.query = clean(query);
  const searchTerm = state.query.toLocaleLowerCase("ko-KR");
  const pool = [
    ...(state.type === "all" || state.type === "mountain" ? state.mountains : []),
    ...(state.type === "all" || state.type === "course" ? state.courses : []),
    ...(state.type === "all" || state.type === "trail" ? state.trails : []),
  ];
  state.results = searchTerm ? pool
    .map((item) => {
      const name = item.name.toLocaleLowerCase("ko-KR");
      const region = item.region.toLocaleLowerCase("ko-KR");
      const regionWords = region.split(/[\s,·/()]+/).filter(Boolean);
      const route = [item.start, item.via, item.end].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
      const rank = name === searchTerm ? 0
        : region === searchTerm || regionWords.includes(searchTerm) ? 1
        : region.includes(searchTerm) ? 2
        : name.includes(searchTerm) ? 3
        : route.includes(searchTerm) ? 4
        : -1;
      return { item, rank };
    })
    .filter(({ rank }) => rank >= 0)
    .sort((left, right) => left.rank - right.rank || left.item.name.localeCompare(right.item.name, "ko-KR"))
    .map(({ item }) => item) : [];
}

function render() {
  app.innerHTML = state.screen === "home" ? homeView() : state.screen === "detail" ? detailView() : searchView();
  window.scrollTo(0, 0);
}

async function loadPublicData() {
  try {
    const responses = await Promise.all([fetch("./mountains.json"), fetch("./walking-courses.json"), fetch("./national-park-trails.json")]);
    if (responses.some((response) => !response.ok)) throw new Error("JSON 파일을 찾을 수 없습니다.");
    const [mountainDocument, courseDocument, trailDocument] = await Promise.all(responses.map((response) => response.json()));
    state.mountains = (Array.isArray(mountainDocument) ? mountainDocument : mountainDocument.items || []).map(normalizeMountain);
    state.courses = (Array.isArray(courseDocument) ? courseDocument : courseDocument.items || []).map(normalizeCourse);
    state.trails = (Array.isArray(trailDocument) ? trailDocument : trailDocument.items || []).map(normalizeTrail);
    if (state.query) runSearch();
  } catch (error) {
    state.error = `전국 데이터를 불러오지 못했습니다. ${error.message}`;
  } finally {
    state.loading = false;
    render();
  }
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-search-form]");
  if (!form) return;
  event.preventDefault();
  if (state.loading) return toast("데이터를 불러오는 중입니다. 잠시만 기다려 주세요.");
  state.screen = "search";
  runSearch(new FormData(form).get("query"));
  render();
});

app.addEventListener("click", (event) => {
  const quick = event.target.closest("[data-quick]");
  if (quick) { state.screen = "search"; runSearch(quick.dataset.quick); return render(); }
  const type = event.target.closest("[data-type]");
  if (type) { state.type = type.dataset.type; runSearch(); return render(); }
  const result = event.target.closest("[data-result]");
  if (result) { state.selected = [...state.mountains, ...state.courses, ...state.trails].find((item) => item.id === result.dataset.result); state.screen = "detail"; return render(); }
  const naver = event.target.closest("[data-naver-search]");
  if (naver) return window.open(`https://map.naver.com/p/search/${encodeURIComponent(naver.dataset.naverSearch)}`, "_blank", "noopener,noreferrer");
  const gpx = event.target.closest("[data-gpx]");
  if (gpx) return window.open(gpx.dataset.gpx, "_blank", "noopener,noreferrer");
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "home") state.screen = "home";
  else if (action === "search") state.screen = "search";
  else if (action === "help") return toast("검색창에 산 이름이나 지역을 입력해 보세요.");
  else if (action === "near") return toast("내 주변 검색은 다음 단계에서 지도 위치와 연결합니다.");
  else if (action === "saved") return toast("코스 저장 기능은 다음 단계에서 추가합니다.");
  else if (action === "profile") return toast("내 정보 기능은 다음 단계에서 추가합니다.");
  render();
});

render();
loadPublicData();
