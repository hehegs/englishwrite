// 손글씨 캔버스 엔진
// - 포인터 이벤트(스타일러스/터치/마우스)로 그리기
// - 영어 4선 공책 가이드라인 배경
// - 펜 / 형광펜 / 지우개(획 단위)
// - 필압(pressure) 반영, 실행취소/다시실행, PNG 저장
// - 따라쓰기용 흐린 글씨(고스트) 배경 지원

class Handwriting {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;

    this.strokes = [];        // 확정된 획들
    this.redoStack = [];      // 다시실행용
    this.current = null;      // 그리는 중인 획
    this.drawing = false;
    this.activePointerId = null;
    this.sawPen = false;      // 펜 입력을 본 적 있으면 터치는 무시(손바닥 방지)

    // 도구 설정
    this.tool = "pen";        // pen | highlighter | eraser
    this.color = "#1a237e";
    this.size = 4;
    this.guide = "fourline";  // fourline | grid | blank
    this.ghostText = "";      // 따라쓰기용 흐린 글씨

    this.lineHeight = 120;    // 4선 한 줄(공책 한 칸)의 높이(px)

    this._bind();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  _bind() {
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => this._onDown(e));
    c.addEventListener("pointermove", (e) => this._onMove(e));
    c.addEventListener("pointerup", (e) => this._onUp(e));
    c.addEventListener("pointercancel", (e) => this._onUp(e));
    c.addEventListener("pointerleave", (e) => this._onUp(e));
    // 터치 스크롤/제스처가 그리기를 방해하지 않도록
    c.style.touchAction = "none";
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.cssW = rect.width;
    this.cssH = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    this.render();
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      p: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  }

  _onDown(e) {
    if (e.pointerType === "pen") this.sawPen = true;
    // 펜을 한 번이라도 봤다면, 터치 입력은 손바닥으로 간주하고 무시
    if (this.sawPen && e.pointerType === "touch") return;
    if (this.drawing) return;

    this.drawing = true;
    this.activePointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
    const pt = this._pos(e);

    if (this.tool === "eraser") {
      this._eraseAt(pt);
      this.current = { eraser: true }; // 드래그 지우개 표시용
      return;
    }

    this.current = {
      tool: this.tool,
      color: this.color,
      size: this.size,
      points: [pt],
    };
    this.redoStack = [];
  }

  _onMove(e) {
    if (!this.drawing || e.pointerId !== this.activePointerId) return;
    const pt = this._pos(e);

    if (this.tool === "eraser") {
      this._eraseAt(pt);
      return;
    }

    const pts = this.current.points;
    const last = pts[pts.length - 1];
    pts.push(pt);
    // 실시간으로 마지막 구간만 그려서 반응성을 높인다
    this._drawSegment(this.current, last, pt);
  }

  _onUp(e) {
    if (!this.drawing || e.pointerId !== this.activePointerId) return;
    this.drawing = false;
    this.activePointerId = null;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}

    if (this.current && this.current.points && this.current.points.length) {
      this.strokes.push(this.current);
    }
    this.current = null;
    if (this.tool === "eraser") this.render();
    this._notify();
  }

  // 지우개: 누른 지점 근처의 획을 통째로 제거(예측 가능하고 실행취소 쉬움)
  _eraseAt(pt) {
    const r = Math.max(this.size * 3, 16);
    const before = this.strokes.length;
    this.strokes = this.strokes.filter(
      (s) => !this._strokeNear(s, pt, r)
    );
    if (this.strokes.length !== before) this.render();
  }

  _strokeNear(stroke, pt, r) {
    if (!stroke.points) return false;
    return stroke.points.some(
      (q) => Math.hypot(q.x - pt.x, q.y - pt.y) <= r + stroke.size
    );
  }

  _drawSegment(stroke, a, b) {
    const ctx = this.ctx;
    ctx.save();
    if (stroke.tool === "highlighter") {
      ctx.globalAlpha = 0.35;
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth = stroke.size * 4;
    } else {
      ctx.globalAlpha = 1;
      ctx.lineWidth = stroke.size * (0.6 + b.p);
    }
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  _drawStroke(stroke) {
    const pts = stroke.points;
    if (!pts || pts.length === 0) return;
    if (pts.length === 1) {
      // 점 하나 찍기
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = stroke.tool === "highlighter" ? 0.35 : 1;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    for (let i = 1; i < pts.length; i++) {
      this._drawSegment(stroke, pts[i - 1], pts[i]);
    }
  }

  // 전체 다시 그리기: 배경(흰색) → 가이드라인 → 고스트 → 획
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cssW, this.cssH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    if (this.guide === "fourline") this._drawFourLine();
    else if (this.guide === "grid") this._drawGrid();

    if (this.ghostText) this._drawGhost();

    for (const s of this.strokes) this._drawStroke(s);
  }

  // 영어 4선 공책: 윗선 / 중간 점선 / 기준선(진하게) / 아랫선
  _drawFourLine() {
    const ctx = this.ctx;
    const lh = this.lineHeight;
    const pad = 16;
    for (let top = pad; top + lh <= this.cssH; top += lh + 24) {
      const third = lh / 3;
      const yTop = top;
      const yMidUp = top + third;       // x-height 윗선(점선)
      const yBase = top + third * 2;     // 기준선
      const yBottom = top + third * 3;   // 디센더 아랫선

      ctx.save();
      ctx.strokeStyle = "#c5cae9";
      ctx.lineWidth = 1;
      this._hline(yTop);
      this._hline(yBottom);

      // 중간선은 점선
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "#b0bec5";
      this._hline(yMidUp);
      ctx.setLineDash([]);

      // 기준선은 진하게
      ctx.strokeStyle = "#7986cb";
      ctx.lineWidth = 2;
      this._hline(yBase);
      ctx.restore();
    }
  }

  _drawGrid() {
    const ctx = this.ctx;
    const step = 40;
    ctx.save();
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let x = step; x < this.cssW; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.cssH); ctx.stroke();
    }
    for (let y = step; y < this.cssH; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.cssW, y); ctx.stroke();
    }
    ctx.restore();
  }

  _hline(y) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.lineTo(this.cssW - 8, y);
    ctx.stroke();
  }

  // 따라쓰기: 첫 번째 4선 칸에 흐린 글씨를 그려준다
  _drawGhost() {
    const ctx = this.ctx;
    const lh = this.lineHeight;
    const pad = 16;
    const third = lh / 3;
    const yBase = pad + third * 2;       // 기준선
    const fontSize = third * 2;          // x-height + ascender 정도
    ctx.save();
    ctx.fillStyle = "rgba(120, 130, 180, 0.22)";
    ctx.font = `${fontSize}px "Comic Sans MS", "Segoe Print", cursive`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(this.ghostText, 24, yBase);
    ctx.restore();
  }

  // ---- 외부 제어용 API ----
  setTool(t) { this.tool = t; }
  setColor(c) { this.color = c; }
  setSize(s) { this.size = s; }
  setGuide(g) { this.guide = g; this.render(); }
  setGhost(text) { this.ghostText = text || ""; this.render(); }

  undo() {
    if (!this.strokes.length) return;
    this.redoStack.push(this.strokes.pop());
    this.render();
    this._notify();
  }

  redo() {
    if (!this.redoStack.length) return;
    this.strokes.push(this.redoStack.pop());
    this.render();
    this._notify();
  }

  clear() {
    if (!this.strokes.length) return;
    this.redoStack = [];
    this.strokes = [];
    this.render();
    this._notify();
  }

  isEmpty() { return this.strokes.length === 0; }

  // PNG로 내보내기 (흰 배경 포함)
  toPNG() {
    return this.canvas.toDataURL("image/png");
  }

  onChange(cb) { this._onChangeCb = cb; }
  _notify() { if (this._onChangeCb) this._onChangeCb(); }
}
