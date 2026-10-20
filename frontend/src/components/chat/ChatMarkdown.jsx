import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// A chat-specific markdown renderer with polished typography and proper
// code block styling. Deliberately separate from the shared
// shared/MarkdownRenderer.jsx (used by PDF/Quiz/Flashcards/Planner) so this
// visual pass only affects Chat messages — those other tools keep rendering
// exactly as before, untouched. Same underlying libraries, no new deps.
function CodeBlock({ className, children, ...props }) {
  const isFenced = /language-/.test(className || "");

  if (!isFenced) {
    return (
      <code
        className="bg-slate-800/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-[0.85em] font-mono text-slate-200"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <code className={`font-mono text-[0.85em] ${className || ""}`} {...props}>
      {children}
    </code>
  );
}

const components = {
  p: ({ children }) => (
    <p className="leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold text-slate-100 mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-slate-100 mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-200 mt-3 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-700 pl-3 italic text-slate-400 my-3">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 my-3 text-sm">
      {children}
    </pre>
  ),
  code: CodeBlock,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-800 px-3 py-1.5 text-left font-semibold text-slate-200 bg-slate-900/60">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-800 px-3 py-1.5 align-top">
      {children}
    </td>
  ),
};

export default function ChatMarkdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
