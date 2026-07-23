"use strict";

const NAVER_MAP_CLIENT_ID = "bsd3bg4vgo";

const courses = [
  {
    name: "백운대 순환 코스", tag: "가장 잘 맞아요",
    why: "보통 체력 · 4시간 이내 · 조망 선호", time: "3시간 40분",
    distance: "6.8 km", ascent: "▲ 612 m", level: "보통",
    risk: "암릉 2곳 · 급경사 1곳",
    points: "0,82 28,72 55,53 78,57 103,22 130,45 158,18 188,40 220,8 252,36 286,24 320,69",
  },
  {
    name: "우이동 완만 코스", tag: "초보자 추천",
    why: "완만함 · 대중교통 편리 · 쉼터 많음", time: "4시간 10분",
    distance: "8.2 km", ascent: "▲ 540 m", level: "쉬움",
    risk: "미끄럼 주의 1곳",
    points: "0,82 30,77 58,64 85,59 110,43 140,47 170,32 200,37 230,25 260,33 290,22 320,28",
  },
  {
    name: "숨은벽 능선 코스", tag: "경치가 좋아요",
    why: "조망 우수 · 한적함 · 도전적인 능선", time: "4시간 30분",
    distance: "7.4 km", ascent: "▲ 735 m", level: "어려움",
    risk: "암릉 4곳 · 추락 주의",
    points: "0,82 25,63 48,70 70,41 95,54 120,26 145,42 170,12 195,28 220,7 250,31 275,14 300,37 320,18",
  },
];

const trail = [
  [37.65801, 126.98962], [37.65857, 126.98792], [37.65952, 126.98575],
  [37.66034, 126.98366], [37.66092, 126.98172], [37.66072, 126.97973],
  [37.65992, 126.97815], [37.6587, 126.9779],
];

const pois = [
  [37.65801, 126.98962, "백운대 탐방지원센터", "입구"],
  [37.66034, 126.98366, "백운산장 터", "쉼터"],
  [37.66072, 126.97973, "위문 갈림길", "갈림길"],
  [37.6587, 126.9779, "백운대 836m", "정상"],
];

const state = {
  screen: "home",
  selected: 0,
  fitness: "보통",
  preference: "경치",
  saved: localStorage.getItem("sangil-saved") === "true",
  paused: false,
  offRoute: false,
};

const app = document.getElementById("app");
let toastTimer;
let naverPromise;
let gpsWatch;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
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
  return `
    <header class="topbar">
      <button class="brand" data-action="home"><span class="brand-mark">산</span>산길</button>
      <div class="weather"><span>북한산</span><b>23°</b><span>맑음 · 일몰 19:42</span></div>
      <button class="round" data-action="notice" aria-label="알림">♧</button>
    </header>`;
}

function bottomNav() {
  return `
    <nav class="bottom-nav" aria-label="주 메뉴">
      <button class="active" data-action="home"><span>⌂</span>둘러보기</button>
      <button data-action="recommend"><span>⌕</span>검색</button>
      <button data-action="no-record"><span>◉</span>산행</button>
      <button data-action="saved-list"><span>♧</span>저장</button>
      <button data-action="profile"><span>○</span>내 정보</button>
    </nav>`;
}

function homeView() {
  return `
    <main class="app">
      ${header()}
      <section class="hero">
        <span class="eyebrow">이번 주말, 가볍게 떠나요</span>
        <h1>오늘, 어느 산으로<br>갈까요?</h1>
        <p>내 체력과 시간에 꼭 맞는 길을 찾아드릴게요.</p>
        <button class="search" data-action="recommend"><span class="glass">⌕</span><b>산 이름이나 지역을 검색하세요</b><kbd>검색</kbd></button>
        <div class="quick"><button data-action="near">⌖ 내 주변</button><button data-action="recommend">♨ 4시간 이내</button><button data-action="recommend">♧ 초보 추천</button></div>
      </section>
      <section class="section">
        <div class="section-title"><div><span>지금 가장 좋은 산</span><h2>여름 능선이 기다려요</h2></div></div>
        <button class="mountain-card" data-action="recommend">
          <div class="mountain-visual"><div class="sun"></div><div class="ridge back"></div><div class="ridge"></div><span class="badge left">⌖ 경기 고양 · 18km</span><span class="badge right">✓ 최근 검수</span></div>
          <div class="mountain-info">
            <span class="level">보통</span><h3>북한산</h3><p>도심에서 만나는 시원한 화강암 능선</p>
            <div class="elevation"><strong>836m</strong><span>최고 고도</span></div>
            <div class="facts"><div class="fact"><span>추천 코스</span><b>3개</b></div><div class="fact"><span>오늘 날씨</span><b>맑음 23°</b></div><div class="fact"><span>교통</span><b>대중교통 편리</b></div></div>
          </div>
        </button>
      </section>
      ${bottomNav()}
    </main>`;
}

function optionButtons(kind, values, selected) {
  return values.map((value) =>
    `<button class="${value === selected ? "active" : ""}" data-choice="${kind}" data-value="${esc(value)}">${esc(value)}</button>`
  ).join("");
}

function courseCards() {
  return courses.map((course, index) => `
    <button class="course ${index === state.selected ? "selected" : ""}" data-course="${index}">
      <div class="course-top"><span class="rank">0${index + 1}</span><div class="course-main"><em>${course.tag}</em><h3>${course.name}</h3><p>${course.why}</p></div><span class="check">${index === state.selected ? "✓" : ""}</span></div>
      <div class="metrics"><div><b>${course.time}</b><span>예상 시간</span></div><div><b>${course.distance}</b><span>거리</span></div><div><b>${course.ascent}</b><span>상승</span></div><div><b>${course.level}</b><span>난이도</span></div></div>
      <div class="risk"><span>⚑ ${course.risk}</span><span>원점회귀</span></div>
    </button>`).join("");
}

function recommendView() {
  return `
    <main class="app">
      <header class="screen-head"><button class="back" data-action="home" aria-label="뒤로">‹</button><div><small>북한산</small><h1>코스 추천</h1></div></header>
      <section class="recommend">
        <aside class="filters"><span class="eyebrow" style="color:#668c78">나에게 맞는 산행</span><h1>어떤 산행을<br>원하세요?</h1><p>조건을 누르면 추천 결과가 바로 달라져요.</p>
          <div class="choice"><label>체력 수준</label><div>${optionButtons("fitness", ["가볍게", "보통", "도전"], state.fitness)}</div></div>
          <div class="choice"><label>가장 중요한 것</label><div>${optionButtons("preference", ["최단", "경치", "완만함", "교통"], state.preference)}</div></div>
          <button class="primary" data-action="show-results">3개 코스 보기 <span>→</span></button>
        </aside>
        <section class="results" id="results"><span class="results-label">추천 결과</span><h2>${state.fitness} 체력 · ${state.preference} 중심</h2>${courseCards()}<button class="primary" data-action="detail">선택한 코스 자세히 보기 <span>→</span></button></section>
      </section>
      ${bottomNav()}
    </main>`;
}

function mapMarkup(live = false) {
  return `<div class="map-wrap ${live ? "nav-map" : ""}"><div id="naver-map" class="map"></div><div id="map-state" class="map-state">네이버 지도를 불러오는 중…</div>${live ? '<span id="gps-chip" class="gps">현재 위치 확인</span>' : ""}</div>`;
}

function detailView() {
  const course = courses[state.selected];
  return `
    <main class="app">
      <header class="screen-head"><button class="back" data-action="recommend" aria-label="뒤로">‹</button><div><small>북한산</small><h1>${course.name}</h1></div><button class="save ${state.saved ? "saved" : ""}" data-action="save">${state.saved ? "✓ 저장됨" : "↓ 저장"}</button></header>
      <section class="detail">
        ${mapMarkup()}
        <aside class="summary"><span class="eyebrow">01 · 가장 잘 맞아요</span><h2>${course.name}</h2><p>${course.why}</p>
          <div class="metrics"><div><b>${course.time}</b><span>예상 시간</span></div><div><b>${course.distance}</b><span>총 거리</span></div><div><b>${course.ascent}</b><span>누적 상승</span></div><div><b>${course.level}</b><span>난이도</span></div></div>
          <div class="profile"><div class="profile-head"><span>고도 프로필</span><b>최고 836m</b></div><svg viewBox="0 0 320 90" preserveAspectRatio="none"><polygon points="${course.points} 320,90 0,90" fill="#e1eee5"></polygon><polyline points="${course.points}" fill="none" stroke="#17593b" stroke-width="3"></polyline></svg></div>
          <div class="caution"><b>⚠ 산행 전 확인</b><span>${course.risk} · 물 1.5L 이상 권장</span></div>
          <button class="naver-link" data-action="naver-link">N 네이버 지도에서 입구 길찾기 <span>↗</span></button>
          <button class="primary" data-action="start">산행 시작 <span>→</span></button>
          <small class="fine">네이버 지도 · 샘플 GPX 경로 · MVP 데이터</small>
        </aside>
      </section>
      ${bottomNav()}
    </main>`;
}

function navView() {
  const course = courses[state.selected];
  return `
    <main class="app nav-mode">
      <header class="nav-header"><button class="back" data-action="detail" aria-label="뒤로">‹</button><div class="nav-title"><small>북한산 · ${course.name}</small><b>${state.paused ? "산행 일시정지" : "산행 중"}</b></div><button class="sos" data-action="sos">SOS</button></header>
      ${mapMarkup(true)}
      ${state.offRoute ? '<aside class="off-alert"><div><b>경로를 벗어났어요</b><span>샘플 경로에서 떨어져 있어요</span></div><button data-action="off-route">알림 닫기</button></aside>' : ""}
      <section class="nav-sheet"><div class="next-turn"><div class="turn">↱</div><div class="next-copy"><small>120m 앞 갈림길</small><b>오른쪽 백운대 방향</b></div></div>
        <div class="nav-stats"><div><b>1.2 km</b><span>정상까지</span></div><div><b>42분</b><span>예상 시간</span></div><div><b>10:48</b><span>예상 도착</span></div></div>
        <div class="controls"><button data-action="pause">${state.paused ? "▶ 계속하기" : "Ⅱ 일시정지"}</button><button data-action="off-route">이탈 알림 테스트</button><button class="end" data-action="end">산행 종료</button></div>
      </section>
    </main>`;
}

function render() {
  if (gpsWatch !== undefined) {
    navigator.geolocation?.clearWatch(gpsWatch);
    gpsWatch = undefined;
  }
  app.innerHTML =
    state.screen === "home" ? homeView() :
    state.screen === "recommend" ? recommendView() :
    state.screen === "detail" ? detailView() : navView();
  window.scrollTo(0, 0);
  if (state.screen === "detail") initMap(false);
  if (state.screen === "nav") initMap(true);
}

function loadNaverMaps() {
  if (window.naver?.maps) return Promise.resolve();
  if (naverPromise) return naverPromise;
  naverPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return naverPromise;
}

async function initMap(live) {
  const status = document.getElementById("map-state");
  try {
    await loadNaverMaps();
    if (!document.getElementById("naver-map") || !window.naver?.maps) return;
    const maps = window.naver.maps;
    const map = new maps.Map("naver-map", {
      center: new maps.LatLng(37.6601, 126.9839),
      zoom: 15,
      mapTypeControl: true,
      zoomControl: true,
    });
    new maps.Polyline({
      map,
      path: trail.map(([lat, lng]) => new maps.LatLng(lat, lng)),
      strokeColor: "#f56c3d",
      strokeWeight: live ? 8 : 7,
      strokeOpacity: 1,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    pois.forEach(([lat, lng, name, type]) => {
      const marker = new maps.Marker({ map, position: new maps.LatLng(lat, lng), title: name });
      const info = new maps.InfoWindow({ content: `<div class="info"><b>${esc(name)}</b><span>${esc(type)}</span></div>`, borderWidth: 0, backgroundColor: "transparent" });
      maps.Event.addListener(marker, "click", () => info.open(map, marker));
    });
    if (state.offRoute) {
      new maps.Marker({ map, position: new maps.LatLng(37.6579, 126.9811), title: "경로 이탈 샘플" });
    }
    if (live) startGps(map, maps);
    status?.remove();
  } catch {
    if (status) status.innerHTML = "<b>지도를 불러오지 못했어요</b><small>네이버 콘솔의 Web 서비스 URL에 https://khd7924.github.io 를 등록한 다음 다시 확인해주세요.</small>";
  }
}

function startGps(map, maps) {
  const chip = document.getElementById("gps-chip");
  const fallback = new maps.LatLng(trail[2][0], trail[2][1]);
  const marker = new maps.Marker({ map, position: fallback, title: "현재 위치" });
  if (!navigator.geolocation) {
    if (chip) chip.textContent = "샘플 위치";
    return;
  }
  gpsWatch = navigator.geolocation.watchPosition(
    ({ coords }) => {
      const point = new maps.LatLng(coords.latitude, coords.longitude);
      marker.setPosition(point);
      map.setCenter(point);
      if (chip) chip.textContent = coords.accuracy <= 30 ? "GPS 좋음" : `GPS ±${Math.round(coords.accuracy)}m`;
    },
    () => { if (chip) chip.textContent = "샘플 위치"; },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
  );
}

app.addEventListener("click", async (event) => {
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    state[choice.dataset.choice] = choice.dataset.value;
    render();
    document.getElementById("results")?.scrollIntoView();
    return;
  }
  const course = event.target.closest("[data-course]");
  if (course) {
    state.selected = Number(course.dataset.course);
    render();
    document.getElementById("results")?.scrollIntoView();
    return;
  }
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (["home", "recommend", "detail"].includes(action)) {
    state.screen = action;
    render();
  } else if (action === "show-results") {
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  } else if (action === "save") {
    state.saved = !state.saved;
    localStorage.setItem("sangil-saved", String(state.saved));
    render();
    toast(state.saved ? "코스를 이 기기에 저장했습니다" : "저장을 취소했습니다");
  } else if (action === "start") {
    state.screen = "nav";
    render();
  } else if (action === "pause") {
    state.paused = !state.paused;
    render();
  } else if (action === "off-route") {
    state.offRoute = !state.offRoute;
    render();
  } else if (action === "end") {
    state.screen = "home";
    state.paused = false;
    state.offRoute = false;
    render();
    toast("산행 기록을 종료했습니다");
  } else if (action === "sos") {
    try { await navigator.clipboard.writeText("북한산 백운대 코스 · 현재 위치는 앱 지도에서 확인"); } catch {}
    toast("위치 안내 문구를 복사했습니다 · 긴급 상황은 119");
  } else if (action === "naver-link") {
    window.open("https://map.naver.com/p/search/%EB%B0%B1%EC%9A%B4%EB%8C%80%20%ED%83%90%EB%B0%A9%EC%A7%80%EC%9B%90%EC%84%BC%ED%84%B0", "_blank", "noopener,noreferrer");
  } else if (action === "near") {
    navigator.geolocation?.getCurrentPosition(
      () => toast("현재 위치를 확인했습니다"),
      () => toast("위치 권한을 허용하면 주변 산을 찾을 수 있어요"),
    );
  } else if (action === "saved-list") {
    toast(state.saved ? "저장한 북한산 코스 1개가 있어요" : "저장한 코스가 없어요");
  } else if (action === "no-record") {
    toast("산행 기록은 아직 없어요");
  } else if (action === "profile") {
    toast("내 정보 기능은 다음 단계에서 제공됩니다");
  } else if (action === "notice") {
    toast("새로운 알림이 없습니다");
  }
});

render();
