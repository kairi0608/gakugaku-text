"use client";

import { Eraser, PenLine, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = { points: Point[]; width: number; erase: boolean };

export function HandwritingCanvas({ onChange, initialBlob, disabled = false }: { onChange: (blob: Blob | null) => void; initialBlob?: Blob | null; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeRef = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [width, setWidth] = useState(4);

  const draw = useCallback((items: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, cssWidth, cssHeight);
    if (baseImageRef.current) context.drawImage(baseImageRef.current, 0, 0, cssWidth, cssHeight);
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of items) {
      if (!stroke.points.length) continue;
      context.strokeStyle = stroke.erase ? "#ffffff" : "#0f172a";
      context.fillStyle = stroke.erase ? "#ffffff" : "#0f172a";
      context.lineWidth = stroke.erase ? Math.max(16, stroke.width * 4) : stroke.width;
      if (stroke.points.length === 1) {
        context.beginPath();
        context.arc(stroke.points[0].x, stroke.points[0].y, context.lineWidth / 2, 0, Math.PI * 2);
        context.fill();
        continue;
      }
      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
      context.stroke();
    }
  }, []);

  const emit = useCallback((items: Stroke[]) => {
    const canvas = canvasRef.current;
    draw(items);
    if (!canvas || !items.length) return onChange(null);
    canvas.toBlob(blob => onChange(blob), "image/webp", 0.92);
  }, [draw, onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      draw(strokesRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!initialBlob || strokesRef.current.length || baseImageRef.current) return;
    const url = URL.createObjectURL(initialBlob);
    const image = new Image();
    image.onload = () => {
      baseImageRef.current = image;
      draw(strokesRef.current);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [draw, initialBlob]);

  function point(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || event.button > 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeRef.current = { points: [point(event)], width, erase: tool === "eraser" };
    draw([...strokesRef.current, activeRef.current]);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activeRef.current || disabled) return;
    event.preventDefault();
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const rect = event.currentTarget.getBoundingClientRect();
    for (const item of events) activeRef.current.points.push({ x: item.clientX - rect.left, y: item.clientY - rect.top });
    draw([...strokesRef.current, activeRef.current]);
  }

  function finish(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activeRef.current) return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const next = [...strokesRef.current, activeRef.current];
    activeRef.current = null;
    strokesRef.current = next;
    setStrokes(next);
    emit(next);
  }

  function undo() {
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    setStrokes(next);
    emit(next);
  }

  function clear() {
    baseImageRef.current = null;
    strokesRef.current = [];
    setStrokes([]);
    emit([]);
  }

  return <div className="handwriting-field">
    <div className="handwriting-toolbar" aria-label="手書きツール">
      <button className={tool === "pen" ? "tool-button active" : "tool-button"} type="button" disabled={disabled} aria-pressed={tool === "pen"} onClick={() => setTool("pen")}><PenLine aria-hidden="true" size={17} />ペン</button>
      <button className={tool === "eraser" ? "tool-button active" : "tool-button"} type="button" disabled={disabled} aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}><Eraser aria-hidden="true" size={17} />消しゴム</button>
      <label className="stroke-width">線の太さ<select value={width} disabled={disabled} onChange={event => setWidth(Number(event.target.value))}><option value="2">細い</option><option value="4">標準</option><option value="7">太い</option></select></label>
      <button className="tool-button" type="button" disabled={disabled || !strokes.length} onClick={undo}><RotateCcw aria-hidden="true" size={17} />1つ戻す</button>
      <button className="tool-button danger" type="button" disabled={disabled || !strokes.length} onClick={clear}><Trash2 aria-hidden="true" size={17} />全消去</button>
    </div>
    <canvas ref={canvasRef} className="handwriting-canvas" aria-label="手書き回答欄" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} />
    <p className="caption">マウス・指・スタイラスで書けます。キャンバスの外側では通常どおりスクロールできます。</p>
  </div>;
}
