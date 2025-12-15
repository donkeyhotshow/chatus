export interface DrawPoint { x: number; y: number; pressure?: number; timestamp: number; }

export interface Stroke {
  id: string;
  points: DrawPoint[];
  userId?: string;
  color: string;
  width: number;
  tool?: string;
  timestamp?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  strokes: Stroke[];
  zIndex: number;
}

interface HistoryState {
  layers: Layer[];
  timestamp: number;
}

export class DrawingLayerService {
  public layers: Layer[] = [];
  public activeLayerId: string | null = null;
  private history: HistoryState[] = [];
  public historyIndex: number = -1;
  private canvas: HTMLCanvasElement | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? null;
    this.createLayer('Background');
    if (this.layers.length > 0) this.activeLayerId = this.layers[0].id;
  }

  createLayer(name: string): Layer {
    const layer: Layer = {
      id: `layer_${Date.now()}`,
      name,
      visible: true,
      opacity: 1,
      strokes: [],
      zIndex: this.layers.length,
    };
    this.layers.push(layer);
    this.saveHistory();
    this.renderAllLayers();
    return layer;
  }

  addStrokeToLayer(layerId: string, stroke: Stroke) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return;
    layer.strokes.push(stroke);
    this.saveHistory();
    this.renderAllLayers();
  }

  setActiveLayer(layerId: string) {
    this.activeLayerId = layerId;
  }

  toggleLayerVisibility(layerId: string) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return;
    layer.visible = !layer.visible;
    this.renderAllLayers();
  }

  setLayerOpacity(layerId: string, opacity: number) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return;
    layer.opacity = opacity;
    this.renderAllLayers();
  }

  moveLayerUp(layerId: string) {
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx > 0) {
      [this.layers[idx - 1], this.layers[idx]] = [this.layers[idx], this.layers[idx - 1]];
      this.layers.forEach((l, i) => (l.zIndex = i));
      this.saveHistory();
      this.renderAllLayers();
    }
  }

  moveLayerDown(layerId: string) {
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx >= 0 && idx < this.layers.length - 1) {
      [this.layers[idx + 1], this.layers[idx]] = [this.layers[idx], this.layers[idx + 1]];
      this.layers.forEach((l, i) => (l.zIndex = i));
      this.saveHistory();
      this.renderAllLayers();
    }
  }

  deleteLayer(layerId: string) {
    this.layers = this.layers.filter((l) => l.id !== layerId);
    if (this.activeLayerId === layerId) this.activeLayerId = this.layers[0]?.id ?? null;
    this.saveHistory();
    this.renderAllLayers();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  private saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ layers: JSON.parse(JSON.stringify(this.layers)), timestamp: Date.now() });
    this.historyIndex++;
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private restoreState(state: HistoryState) {
    this.layers = JSON.parse(JSON.stringify(state.layers));
    this.renderAllLayers();
  }

  private renderStroke(stroke: Stroke, ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (!stroke.points?.length) return;
    ctx.beginPath();
    if (stroke.points.length === 1) {
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  renderAllLayers() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const sorted = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    sorted.forEach((layer) => {
      if (!layer.visible) return;
      ctx.globalAlpha = layer.opacity;
      layer.strokes.forEach((stroke) => this.renderStroke(stroke, ctx));
      ctx.globalAlpha = 1;
    });
  }
}





// UI Component (will be in a separate file)
/*
export function LayerPanel({ service }: Props) {
  const [layers, setLayers] = useState(service.layers);

  return (
    <div className="layer-panel">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Layers</h3>
        <button onClick={() => service.createLayer(`Layer ${layers.length + 1}`)}>
          + New Layer
        </button>
      </div>

      <div className="space-y-2">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className={`p-2 rounded cursor-pointer ${
              service.activeLayerId === layer.id ? 'bg-blue-100' : 'bg-gray-50'
            }`}
            onClick={() => service.setActiveLayer(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => service.toggleLayerVisibility(layer.id)}
                />
                <span>{layer.name}</span>
              </div>

              <div className="flex gap-1">
                <button onClick={() => service.moveLayerUp(layer.id)}>↑</button>
                <button onClick={() => service.moveLayerDown(layer.id)}>↓</button>
                <button onClick={() => service.deleteLayer(layer.id)}>🗑️</button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) => service.setLayerOpacity(layer.id, Number(e.target.value) / 100)}
              className="w-full mt-1"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => service.undo()}
          disabled={service.historyIndex <= 0}
          className="flex-1 py-2 bg-gray-200 rounded"
        >
          ⟲ Undo
        </button>
        <button
          onClick={() => service.redo()}
          disabled={service.historyIndex >= service.history.length - 1}
          className="flex-1 py-2 bg-gray-200 rounded"
        >
          ⟳ Redo
        </button>
      </div>
    </div>
  );
}
*/
