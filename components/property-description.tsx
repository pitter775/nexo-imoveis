'use client';

import { Fragment } from 'react';

type PropertyDescriptionProps = {
  value?: string | null;
  className?: string;
};

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'divider' };

export function PropertyDescription({
  value,
  className = '',
}: PropertyDescriptionProps) {
  const blocks = parseDescription(value ?? '');

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 text-slate-700 ${className}`.trim()}>
      {blocks.map((block, index) => {
        if (block.type === 'divider') {
          return <div key={`divider-${index}`} className="h-px bg-slate-200" />;
        }

        if (block.type === 'list') {
          return (
            <ul key={`list-${index}`} className="space-y-2 pl-5 text-[15px] leading-7 text-slate-600">
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`} className="list-disc">
                  {renderInlineTokens(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'heading') {
          const headingClassName =
            block.level === 1
              ? 'text-xl font-bold text-slate-900'
              : block.level === 2
                ? 'text-lg font-bold text-slate-900'
                : 'text-base font-bold uppercase tracking-[0.12em] text-primary';

          return (
            <h4 key={`heading-${index}`} className={headingClassName}>
              {renderInlineTokens(block.text)}
            </h4>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="text-[15px] leading-7 text-slate-600">
            {renderInlineTokens(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function parseDescription(value: string): Block[] {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = [];
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    if (/^---+$/.test(line)) {
      flushList();
      flushParagraph();
      blocks.push({ type: 'divider' });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      flushParagraph();
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      continue;
    }

    const listMatch = line.match(/^[-*•]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      currentList.push(listMatch[1].trim());
      continue;
    }

    flushList();
    currentParagraph.push(line);
  }

  flushList();
  flushParagraph();

  return blocks;
}

function renderInlineTokens(text: string) {
  const normalized = text.replace(/\*\*/g, '__BOLD__');
  const parts = normalized.split('__BOLD__');

  return parts.map((part, index) => {
    const key = `${part}-${index}`;

    if (index % 2 === 1) {
      return (
        <strong key={key} className="font-semibold text-slate-900">
          {part}
        </strong>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}
