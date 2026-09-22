import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown formatted text cleanly into HTML elements
 * without displaying raw syntax characters like *, **, ###, or markdown links.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  // Split into lines or blocks
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentQuote: string[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 opacity-80" />
                <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 list-decimal list-inside space-y-1 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushQuote = () => {
    if (currentQuote.length > 0) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-2.5 rounded-r-xl border-l-3 border-primary bg-primary/5 px-3.5 py-2 text-xs text-muted-foreground italic space-y-1"
        >
          {currentQuote.map((q, idx) => (
            <p key={idx}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      currentQuote = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [headerRow, ...bodyRows] = tableRows;
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            {headerRow && (
              <thead className="border-b border-border bg-muted/60 font-bold text-foreground">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2">
                      {renderInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-muted-foreground">
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-2.5 overflow-x-auto rounded-xl border border-border/80 bg-muted/80 p-3 font-mono text-[0.725rem] text-foreground"
          >
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushQuote();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Markdown Tables (| col1 | col2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      flushQuote();
      // Skip separator rows (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Blockquotes (> text)
    if (trimmed.startsWith(">")) {
      flushList();
      flushTable();
      const quoteText = trimmed.replace(/^>\s*/, "");
      currentQuote.push(quoteText);
      continue;
    } else {
      flushQuote();
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-border/70" />);
      continue;
    }

    // Headings (#, ##, ###, ####)
    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList();
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2].trim();
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${elements.length}`} className="mt-3.5 mb-1.5 text-base font-bold text-foreground tracking-tight">
              {renderInline(headingText)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${elements.length}`} className="mt-3 mb-1.5 text-sm font-bold text-foreground">
              {renderInline(headingText)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${elements.length}`} className="mt-2.5 mb-1 text-xs font-bold text-foreground uppercase tracking-wide">
              {renderInline(headingText)}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={`h4-${elements.length}`} className="mt-2 mb-1 text-xs font-bold text-foreground">
              {renderInline(headingText)}
            </h4>
          );
        }
        continue;
      }
    }

    // Bullet Lists (* item, - item, • item)
    if (/^[\*\-\•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[\*\-\•]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Numbered Lists (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Normal Paragraph
    if (trimmed.length > 0) {
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    } else {
      // Empty line acts as paragraph spacer if not in list
      flushList();
    }
  }

  flushList();
  flushQuote();
  flushTable();

  return <div className={`space-y-2 text-xs ${className}`}>{elements}</div>;
}

/**
 * Parses inline formatting:
 * - Links: [label](url)
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `code`
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex tokenizer for inline tokens:
  // 1: `code`
  // 2: [text](url)
  // 3: **bold** or __bold__
  // 4: *italic* or _italic_
  const tokenRegex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_))/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[0.72rem] font-semibold text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length > 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-foreground">
          {renderInline(inner)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2 && !part.startsWith("__"))
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground/90">
          {renderInline(inner)}
        </em>
      );
    }

    return part;
  });
}
