import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

export type DrawPoint = { x: number; y: number; pressure?: number; timestamp: number };

export class DrawingService {
  private pathBuffer: DrawPoint[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private lastFlush: number = 0;
  private firestore: Firestore;
  private userId: string;
  public currentColor: string = '#000';
  public currentWidth: number = 4;
  public currentTool: string = 'pen';

  constructor(firestore: Firestore, userId: string) {
    this.firestore = firestore;
    this.userId = userId;
  }

  startDrawing(roomId: string, canvasId: string) {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      this.flushPathBuffer(roomId, canvasId);
    }, 50);
  }

  addPoint(x: number, y: number, pressure: number = 1) {
    this.pathBuffer.push({ x, y, pressure, timestamp: Date.now() });
  }

  private async flushPathBuffer(roomId: string, canvasId: string) {
    if (this.pathBuffer.length === 0) return;

    const points = [...this.pathBuffer];
    this.pathBuffer = [];

    const compressed = this.compressPath(points, 2);

    try {
      await addDoc(collection(this.firestore, `rooms/${roomId}/canvasPaths/${canvasId}/strokes`), {
        points: compressed,
        userId: this.userId,
        color: this.currentColor,
        width: this.currentWidth,
        tool: this.currentTool,
        timestamp: serverTimestamp(),
      });
    } catch {
      // Silently ignore upload failures (network issues)
    }
  }

  private compressPath(points: DrawPoint[], tolerance: number): DrawPoint[] {
    if (points.length < 3) return points;

    const simplified: DrawPoint[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const distance = this.perpendicularDistance(curr, prev, next);
      if (distance > tolerance) simplified.push(curr);
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  private perpendicularDistance(p: DrawPoint, p1: DrawPoint, p2: DrawPoint) {
    const x = p.x;
    const y = p.y;
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  stopDrawing() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}


export class DrawingRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  onStrokeReceived(stroke: Stroke) {
    this.renderStroke(stroke);
  }

  private renderStroke(stroke: Stroke) {
    const ctx = this.ctx;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    // Interpolate між точками для smooth curve
    const points = stroke.points;

    if (points.length === 1) {
      ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Catmull-Rom spline для smooth interpolation
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }

    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
  }
}

interface Stroke {
  id: string;
  points: { x: number; y: number; pressure?: number; timestamp: number }[];
  userId?: string;
  color: string;
  width: number;
  tool?: string;
  timestamp?: any;
}
