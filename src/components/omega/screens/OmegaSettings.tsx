"use client";

import { memo, useState } from 'react';
import { OmegaHeader } from '../OmegaHeader';

const sections = [
  {
    title: 'Профиль',
    items: [
      { icon: 'person', label: 'Мой профиль', color: '#10b981', action: 'chevron' },
      { icon: 'edit', label: 'Смена ника', color: '#10b981', action: 'chevron' },
      { icon: 'notifications', label: 'Уведомления', color: '#10b981', action: 'toggle', active: true },
    ]
  },
  {
    title: 'Комната',
    items: [
      { icon: 'link', label: 'ID комнаты', color: '#f59e0b', action: 'copy' },
      { icon: 'share', label: 'Поделиться', color: '#f59e0b', action: 'chevron' },
      { icon: 'delete', label: 'Очистить историю', color: '#f59e0b', action: 'chevron' },
    ]
  },
  {
    title: 'Тема',
    items: [
      { icon: 'dark_mode', label: 'Тёмная тема', color: '#8b5cf6', action: 'toggle', active: true },
    ]
  }
];

export const OmegaSettings = memo(function OmegaSettings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Уведомления': true,
    'Тёмная тема': true
  });

  const handleToggle = (label: string) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setToggles(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="omega-screen">
      <OmegaHeader title="Настройки" />
      <div className="omega-settings">
        {sections.map(section => (
          <div key={section.title} className="omega-section">
            <div className="omega-section-title">{section.title}</div>
            {section.items.map(item => (
              <div key={item.label} className="omega-item" onClick={() => item.action === 'toggle' && handleToggle(item.label)}>
                <div className="omega-item-left">
                  <div className="omega-icon" style={{ background: `${item.color}33`, color: item.color }}>
                    <span className="material-icons">{item.icon}</span>
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.action === 'toggle' ? (
                  <div className={`omega-toggle ${toggles[item.label] ? 'active' : ''}`} />
                ) : (
                  <span className="material-icons" style={{ color: '#6b7280' }}>
                    {item.action === 'copy' ? 'content_copy' : 'chevron_right'}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <style jsx>{`
        .omega-screen { display: flex; flex-direction: column; height: 100%; background: #0a0a0a; }
        .omega-settings { flex: 1; overflow-y: auto; padding: 16px; }
        .omega-section { margin-bottom: 24px; }
        .omega-section-title { font-size: 14px; font-weight: 600; color: #a1a1aa; margin-bottom: 12px; padding-left: 8px; }
        .omega-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #1a1a1a; border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
        .omega-item:hover { background: #2a2a2a; }
        .omega-item-left { display: flex; align-items: center; gap: 12px; }
        .omega-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .omega-icon span { font-size: 20px; }
        .omega-toggle { width: 48px; height: 28px; background: #2a2a2a; border-radius: 14px; position: relative; transition: background 0.3s; }
        .omega-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
        .omega-toggle.active { background: #10b981; }
        .omega-toggle.active::after { transform: translateX(20px); }
      `}</style>
    </div>
  );
});

export default OmegaSettings;
