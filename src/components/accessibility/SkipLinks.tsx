'use client';

import { memo } from 'react';

interface SkipLink {
  href: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Перейти к основному контенту' },
  { href: '#chat-input', label: 'Перейти к полю ввода' },
  { href: '#navigation', label: 'Перейти к навигации' },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

export const SkipLinks = memo(function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  return (
    <nav aria-label="Быстрая навигация" className="skip-links">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}

      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .skip-link {
          position: absolute;
          left: -9999px;
          top: 0;
          padding: 12px 24px;
          background: var(--accent-primary);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border-radius: 0 0 8px 0;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          transition: left 0.2s ease;
        }

        .skip-link:focus {
          left: 0;
          outline: 2px solid white;
          outline-offset: 2px;
        }
      `}</style>
    </nav>
  );
});
