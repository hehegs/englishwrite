// 앱 전체 조립: 모드 전환, 도구 바, 단어 연습(따라쓰기/받아쓰기), 저장, 설정 저장
(function () {
  "use strict";

  const board = new Handwriting(document.getElementById("board"));

  // 상태
  let mode = "free";              // free | trace | dictation
  let currentSet = WORD_SETS[0];
  let index = 0;
  let revealed = false;

  // ---- 요소 ----
  const $ = (sel) => document.querySelector(sel);
  const practiceBar = $("#practiceBar");
  const promptEl = $("#prompt");
  const progressEl = $("#progress");
  const wordSetSelect = $("#wordSetSelect");
  const toast = $("#toast");

  // ---- 설정 저장/복원 ----
  function saveSettings() {
    try {
      localStorage.setItem("ew-settings", JSON.stringify({
        color: board.color, size: board.size, guide: board.guide,
        setId: currentSet.id, font: currentFont,
      }));
    } catch (_) {}
  }
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem("ew-settings") || "{}");
      if (s.color) { board.setColor(s.color); markActive("#colors .swatch", "data-color", s.color); }
      if (s.size) { board.setSize(s.size); $("#sizeRange").value = s.size; }
      if (s.guide) { board.setGuide(s.guide); $("#guideSelect").value = s.guide; }
      if (s.setId) { const f = WORD_SETS.find((x) => x.id === s.setId); if (f) currentSet = f; }
      if (s.font && FONTS[s.font]) applyFont(s.font);
    } catch (_) {}
  }

  // 따라쓰기 가이드 글씨 글꼴 (시스템 폴백 포함)
  const FONTS = {
    comic:   '"Comic Neue", "Comic Sans MS", "Segoe Print", cursive',
    andika:  '"Andika", "Comic Sans MS", sans-serif',
    patrick: '"Patrick Hand", "Comic Sans MS", cursive',
    edu:     '"Edu VIC WA NT Beginner", "Comic Sans MS", cursive',
  };
  let currentFont = "comic";
  function applyFont(key) {
    currentFont = FONTS[key] ? key : "comic";
    board.setGhostFont(FONTS[currentFont]);
    const sel = $("#fontSelect");
    if (sel) sel.value = currentFont;
  }

  function markActive(groupSel, attr, value) {
    document.querySelectorAll(groupSel).forEach((el) => {
      el.classList.toggle("active", el.getAttribute(attr) === value);
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  // ---- 단어장 채우기 ----
  function fillWordSets() {
    wordSetSelect.innerHTML = "";
    WORD_SETS.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${s.title} (${s.level})`;
      wordSetSelect.appendChild(o);
    });
    wordSetSelect.value = currentSet.id;
  }

  function currentItem() {
    return currentSet.items[index];
  }

  // ---- 모드 전환 ----
  function setMode(m) {
    mode = m;
    document.querySelectorAll(".mode-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === m)
    );
    const isPractice = m === "trace" || m === "dictation";
    practiceBar.classList.toggle("hidden", !isPractice);
    index = 0;
    renderPractice();
  }

  // 연습 화면(프롬프트 + 가이드/고스트) 갱신
  function renderPractice() {
    if (mode === "free") {
      board.setGhost("");
      return;
    }
    const item = currentItem();
    revealed = false;
    progressEl.textContent = `${index + 1} / ${currentSet.items.length}`;

    if (mode === "trace") {
      // 따라쓰기: 흐린 글씨를 캔버스에 깔아주고, 상단에 단어/뜻 표시
      board.setGhost(item.en);
      promptEl.innerHTML =
        `<div class="word">${escapeHtml(item.en)}</div>` +
        `<div class="meaning">${escapeHtml(item.ko)}</div>`;
    } else if (mode === "dictation") {
      // 받아쓰기: 단어는 숨기고 소리로만 듣고 쓰게 한다
      board.setGhost("");
      promptEl.innerHTML =
        `<div class="hint">🔊 듣기 버튼을 눌러 단어를 듣고 써 보세요</div>` +
        `<div class="word blurred" id="answerWord">${escapeHtml(item.en)}</div>`;
      // 새 문제는 자동으로 한 번 읽어준다
      Speech.speak(item.en, 0.9);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }

  function nextItem(dir) {
    const n = currentSet.items.length;
    index = (index + dir + n) % n;
    board.clear();
    renderPractice();
  }

  function reveal() {
    revealed = true;
    if (mode === "dictation") {
      const w = $("#answerWord");
      if (w) w.classList.remove("blurred");
      promptEl.querySelector(".hint").textContent = "✅ 정답이에요. 비교해 보세요!";
    } else if (mode === "trace") {
      Speech.speak(currentItem().en, 0.9);
    }
  }

  // ---- 이벤트 연결 ----
  function bindUI() {
    // 모드 탭
    document.querySelectorAll(".mode-btn").forEach((b) =>
      b.addEventListener("click", () => setMode(b.dataset.mode))
    );

    // 도구
    document.querySelectorAll(".tool").forEach((b) =>
      b.addEventListener("click", () => {
        board.setTool(b.dataset.tool);
        markActive(".tool", "data-tool", b.dataset.tool);
      })
    );

    // 색상
    document.querySelectorAll(".swatch").forEach((b) =>
      b.addEventListener("click", () => {
        board.setColor(b.dataset.color);
        markActive("#colors .swatch", "data-color", b.dataset.color);
        saveSettings();
      })
    );

    // 굵기 / 배경
    $("#sizeRange").addEventListener("input", (e) => {
      board.setSize(Number(e.target.value)); saveSettings();
    });
    $("#guideSelect").addEventListener("change", (e) => {
      board.setGuide(e.target.value); saveSettings();
    });
    $("#fontSelect").addEventListener("change", (e) => {
      applyFont(e.target.value); saveSettings();
    });

    // 편집 버튼
    $("#undoBtn").addEventListener("click", () => board.undo());
    $("#redoBtn").addEventListener("click", () => board.redo());
    $("#clearBtn").addEventListener("click", () => {
      if (board.isEmpty()) return;
      board.clear();
      showToast("지웠어요");
    });
    $("#saveBtn").addEventListener("click", saveImage);

    // 단어 연습
    wordSetSelect.addEventListener("change", (e) => {
      currentSet = getWordSet(e.target.value);
      index = 0;
      board.clear();
      renderPractice();
      saveSettings();
    });
    $("#speakBtn").addEventListener("click", () => {
      if (!Speech.supported()) return showToast("이 브라우저는 음성을 지원하지 않아요");
      Speech.speak(currentItem().en, 0.9);
    });
    $("#speakSlowBtn").addEventListener("click", () => Speech.speak(currentItem().en, 0.55));
    $("#revealBtn").addEventListener("click", reveal);
    $("#prevBtn").addEventListener("click", () => nextItem(-1));
    $("#nextBtn").addEventListener("click", () => nextItem(1));

    // 키보드 단축키 (키보드도 함께 쓰는 환경 대비)
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); board.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); board.redo(); }
      else if (mode !== "free") {
        if (e.key === "ArrowRight") nextItem(1);
        else if (e.key === "ArrowLeft") nextItem(-1);
        else if (e.key === " ") { e.preventDefault(); Speech.speak(currentItem().en, 0.9); }
      }
    });
  }

  function saveImage() {
    const url = board.toPNG();
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `영어쓰기-${stamp}.png`;
    a.click();
    showToast("이미지로 저장했어요 💾");
  }

  // ---- 초기화 ----
  fillWordSets();
  loadSettings();
  fillWordSets();          // 설정 복원 후 선택값 반영
  bindUI();
  setMode("free");

  // PWA 서비스워커 등록 (오프라인 지원)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
