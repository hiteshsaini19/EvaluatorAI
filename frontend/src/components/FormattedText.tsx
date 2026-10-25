import { Fragment } from 'react';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
  text: string;
  className?: string;
}

// Renders question/option text: ```fenced``` blocks become monospace code blocks with their
// indentation kept, `inline code` is shown in monospace, and line breaks in plain text are kept.
export function FormattedText({ text, className }: FormattedTextProps) {
  const parts = text.split(/```[^\n`]*\n?([\s\S]*?)```/g);

  return (
    <div className={cn('space-y-3', className)}>
      {parts.map((part, idx) => {
        // split() with one capture group alternates: text, code, text, code, ...
        if (idx % 2 === 1) {
          return (
            <pre
              key={idx}
              className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed font-mono font-normal"
            >
              <code>{part.replace(/\n$/, '')}</code>
            </pre>
          );
        }
        const trimmed = part.replace(/^\n+|\n+$/g, '');
        if (!trimmed) return null;
        return (
          <p key={idx} className="whitespace-pre-wrap break-words">
            {trimmed.split(/(`[^`\n]+`)/g).map((chunk, i) =>
              chunk.startsWith('`') && chunk.endsWith('`') && chunk.length > 2 ? (
                <code key={i} className="font-mono text-[0.9em] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                  {chunk.slice(1, -1)}
                </code>
              ) : (
                <Fragment key={i}>{chunk}</Fragment>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
