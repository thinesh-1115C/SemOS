import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy, Code, Sparkles } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  className?: string;
  isAi?: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '', isAi = false }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => {
      setCopiedCodeIndex(null);
    }, 2000);
  };

  let codeBlockCounter = 0;

  return (
    <div className={`prose prose-zinc max-w-none text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif font-bold text-lg sm:text-xl text-[#1A1A1A] mt-4 mb-2 pb-1 border-b border-[#EAE7E0]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#1A1A1A] mt-4 mb-2 pb-0.5 border-b border-[#EAE7E0]/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A68942]" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif font-semibold text-sm sm:text-base text-[#1A1A1A] mt-3 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 text-[#1A1A1A] leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-none pl-0 my-2.5 space-y-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-[#1A1A1A]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-5 text-[#1A1A1A]">
              <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#A68942]" />
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-4 py-2 border-l-2 border-[#A68942] bg-[#F6F4F0] rounded-r-xl italic text-zinc-700 text-xs">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1A1A1A] bg-[#A68942]/10 px-1 py-0.5 rounded border border-[#A68942]/20">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-700">
              {children}
            </em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#EAE7E0] bg-[#FBFBF9]">
              <table className="w-full text-xs text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F6F4F0] border-b border-[#EAE7E0] font-serif font-bold text-[#1A1A1A]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 border-r border-[#EAE7E0] last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-r border-[#EAE7E0] last:border-r-0 text-zinc-700">
              {children}
            </td>
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : 'code';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline) {
              const currentBlockIndex = codeBlockCounter++;
              const isCopied = copiedCodeIndex === currentBlockIndex;

              return (
                <div className="my-3 rounded-2xl overflow-hidden border border-[#333333] bg-[#1A1A1A] text-[#FBFBF9] font-mono text-xs shadow-md">
                  {/* Code Header Bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-[#333333]">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-[#A68942]" />
                      <span className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
                        {lang}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(codeString, currentBlockIndex)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#333333] hover:bg-[#404040] text-zinc-200 text-[11px] font-sans font-medium transition-colors"
                      title="Copy code to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Code Content */}
                  <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-emerald-300/90 whitespace-pre">
                    <code>{codeString}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-[#F6F4F0] border border-[#EAE7E0] text-[#1A1A1A] font-mono text-[11px] font-semibold">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
