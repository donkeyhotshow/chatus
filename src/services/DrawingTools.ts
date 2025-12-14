// Simplified single-definition DrawingTools to avoid duplicate identifier issues
export enum DrawingTool {
  PEN = 'pen',
  BRUSH = 'brush',
  ERASER = 'eraser',
  FILL = 'fill',
  SHAPE_LINE = 'line',
  SHAPE_RECT = 'rectangle',
  SHAPE_CIRCLE = 'circle',
  SHAPE_ARROW = 'arrow',
  TEXT = 'text',
  EYEDROPPER = 'eyedropper',
  SELECT = 'select',
}

export type DrawPoint = { x: number; y: number; pressure?: number; timestamp: number };

interface TextOptions {
  fontSize: number;
  fontFamily: string;
  color: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}

export class AdvancedDrawingTools {
  private baseWidth = 3;
  private brushSettings = { baseWidth: 5, pressureSensitivity: true };
  private currentTool: DrawingTool = DrawingTool.PEN;

  setCurrentTool(tool: DrawingTool) {
    this.currentTool = tool;
  }

  getCurrentTool(): DrawingTool {
    return this.currentTool;
  }

  drawBrushStroke(ctx: CanvasRenderingContext2D, points: DrawPoint[], color: string) {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const width = (p1.pressure ?? 1) * this.brushSettings.baseWidth;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  async floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const target = this.getPixelColor(imageData, x, y);
    const replacement = this.hexToRgba(fillColor);
    if (this.colorsEqual(target, replacement)) return;
    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [px, py] = stack.pop()!;
      if (px < 0 || px >= ctx.canvas.width || py < 0 || py >= ctx.canvas.height) continue;
      const current = this.getPixelColor(imageData, px, py);
      if (this.colorsEqual(current, target)) {
        this.setPixelColor(imageData, px, py, replacement);
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  drawShape(ctx: CanvasRenderingContext2D, shape: DrawingTool, start: { x: number; y: number }, end: { x: number; y: number }) {
    ctx.beginPath();
    switch (shape) {
      case DrawingTool.SHAPE_LINE:
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case DrawingTool.SHAPE_RECT:
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        break;
      case DrawingTool.SHAPE_CIRCLE:
        const r = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case DrawingTool.SHAPE_ARROW:
        this.drawArrow(ctx, start, end);
        break;
      default:
        break;
    }
  }

  addText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: TextOptions) {
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    ctx.fillStyle = opts.color;
    ctx.textAlign = opts.align ?? 'left';
    ctx.textBaseline = opts.baseline ?? 'alphabetic';
    ctx.fillText(text, x, y);
  }

  private drawArrow(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) {
    const head = 10;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  private getPixelColor(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const idx = (y * imageData.width + x) * 4;
    return [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3]];
  }

  private setPixelColor(imageData: ImageData, x: number, y: number, col: [number, number, number, number]) {
    const idx = (y * imageData.width + x) * 4;
    imageData.data[idx] = col[0];
    imageData.data[idx + 1] = col[1];
    imageData.data[idx + 2] = col[2];
    imageData.data[idx + 3] = col[3];
  }

  private colorsEqual(a: [number, number, number, number], b: [number, number, number, number]) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  private hexToRgba(hex: string): [number, number, number, number] {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
  }
}