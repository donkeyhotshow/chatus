import { useState } from 'react';
import { DrawingLayerService } from '@/services/DrawingLayerService';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  strokes: unknown[];
  zIndex: number;
}

interface LayerPanelProps {
  service: DrawingLayerService;
}

export function LayerPanel({ service }: LayerPanelProps) {
  const [layers, setLayers] = useState<Layer[]>(service.layers);

  // Force re-render when service state changes (e.g., from undo/redo)
  // This is a simplified approach; a more robust solution might use an EventEmitter in DrawingLayerService
  // or react context for state management.
  const forceUpdate = useState(0)[1];

  service.renderAllLayers = () => {
    // Original render logic with null-safety checks
    const canvasEl = service['canvas'] as HTMLCanvasElement | null;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d')!;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const sortedLayers = [...service.layers].sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach(layer => {
      if (!layer.visible) return;

      ctx.globalAlpha = layer.opacity;

      layer.strokes.forEach(stroke => {
        service['renderStroke'](stroke, ctx);
      });

      ctx.globalAlpha = 1;
    });
    setLayers([...service.layers]); // Update local state to trigger re-render
    forceUpdate(prev => prev + 1);
  };

  return (
    <div className="layer-panel bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Layers</h3>
        <button
          onClick={() => service.createLayer(`Layer ${layers.length + 1}`)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Layer
        </button>
      </div>

      <div className="space-y-2">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className={`p-2 rounded cursor-pointer ${service.activeLayerId === layer.id ? 'bg-blue-100' : 'bg-gray-50'
              }`}
            onClick={() => service.setActiveLayer(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => service.toggleLayerVisibility(layer.id)}
                  className="form-checkbox"
                />
                <span>{layer.name}</span>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); service.moveLayerUp(layer.id); }}
                  disabled={idx === 0}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); service.moveLayerDown(layer.id); }}
                  disabled={idx === layers.length - 1}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); service.deleteLayer(layer.id); }}
                  className="p-1 rounded bg-red-400 text-white hover:bg-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) => service.setLayerOpacity(layer.id, Number(e.target.value) / 100)}
              className="w-full mt-1 accent-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => service.undo()}
          disabled={service.historyIndex <= 0}
          className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          ⟲ Undo
        </button>
        <button
          onClick={() => service.redo()}
          disabled={service.historyIndex >= service['history'].length - 1}
          className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          ⟳ Redo
        </button>
      </div>
    </div>
  );
}
