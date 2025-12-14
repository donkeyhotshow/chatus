import { DrawingTool, AdvancedDrawingTools } from '@/services/DrawingTools';

interface DrawingToolbarProps {
  tools: AdvancedDrawingTools;
  onSelectTool: (tool: DrawingTool) => void;
}

export function DrawingToolbar({ tools, onSelectTool }: DrawingToolbarProps) {
  return (
    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
      {Object.values(DrawingTool).map(tool => (
        <button
          key={tool}
          onClick={() => onSelectTool(tool)}
          className={`p-2 rounded hover:bg-gray-200 ${tools.getCurrentTool() === tool ? 'bg-blue-500 text-white' : ''}`}
          title={tool}
        >
          {getToolIcon(tool)}
        </button>
      ))}
    </div>
  );
}

function getToolIcon(tool: DrawingTool): string {
  const icons = {
    pen: '✏️',
    brush: '🖌️',
    eraser: '🧹',
    fill: '🪣',
    line: '📏',
    rectangle: '▭',
    circle: '⭕',
    arrow: '➡️',
    text: 'A',
    eyedropper: '💧',
    select: '◻️'
  };
  return icons[tool] || '🔧';
}
