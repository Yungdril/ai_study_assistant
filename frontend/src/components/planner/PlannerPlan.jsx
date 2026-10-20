import { Children, Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BR_MARK, normalizePlanMarkdown } from "./normalizePlanMarkdown";


// Convert normalized line-break markers into real React line breaks.
// Raw HTML from the model is never rendered.
function withBreaks(children) {
  return Children.map(children, (child) => {
    if (typeof child !== "string" || !child.includes(BR_MARK)) {
      return child;
    }

    return child.split(BR_MARK).map((part, index, parts) => (
      <Fragment key={index}>
        {part}
        {index < parts.length - 1 && <br />}
      </Fragment>
    ));
  });
}

function CodeBlock({ className, children, ...props }) {
  const isFencedCode = /language-/.test(className || "");

  return (
    <code
      className={
        isFencedCode
          ? `font-mono text-[0.85em] ${className || ""}`
          : "bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[0.85em] font-mono text-slate-200 break-words"
      }
      {...props}
    >
      {children}
    </code>
  );
}

const components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold text-slate-100 mt-6 mb-3 first:mt-0">
      {withBreaks(children)}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-slate-100 mt-6 mb-3 pb-2 border-b border-white/[0.08] first:mt-0">
      {withBreaks(children)}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-blue-300 mt-5 mb-2 first:mt-0">
      {withBreaks(children)}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-200 mt-4 mb-1.5 first:mt-0">
      {withBreaks(children)}
    </h4>
  ),

  p: ({ children }) => (
    <p className="leading-relaxed mb-3 last:mb-0 break-words">
      {withBreaks(children)}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-slate-50">{children}</strong>
  ),

  em: ({ children }) => (
    <em className="italic text-slate-300">{children}</em>
  ),

  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-4 space-y-1.5 marker:text-slate-500 last:mb-0">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-4 space-y-1.5 marker:text-slate-500 last:mb-0">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="leading-relaxed break-words">{withBreaks(children)}</li>
  ),

  hr: () => <hr className="my-5 border-white/[0.08]" />,

  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500/40 pl-3 my-4 text-slate-300 break-words">
      {children}
    </blockquote>
  ),

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline underline-offset-2 break-words"
    >
      {children}
    </a>
  ),

  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-white/[0.08] bg-deep p-3.5 my-4 text-sm">
      {children}
    </pre>
  ),

  code: CodeBlock,

  // Wide study schedules scroll inside their own container.
  table: ({ children }) => (
    <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-max min-w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-white/[0.05]">{children}</thead>
  ),

  tr: ({ children }) => (
    <tr className="border-b border-white/[0.06] last:border-b-0 even:bg-white/[0.02]">
      {children}
    </tr>
  ),

  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
      {withBreaks(children)}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-3 py-2 align-top text-slate-300 min-w-[7rem] max-w-[22rem]">
      {withBreaks(children)}
    </td>
  ),
};

export default function PlannerPlan({ children }) {
  const normalizedPlan = normalizePlanMarkdown(children);

  return (
    <div className="min-w-0 max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {normalizedPlan}
      </ReactMarkdown>
    </div>
    
  );
}