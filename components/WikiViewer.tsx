'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WikiViewerProps {
    content: string;
}

export default function WikiViewer({ content }: WikiViewerProps) {
    return (
        <div className="prose prose-lg max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom components for better styling
                    h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-medium mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4">
                            {children}
                        </blockquote>
                    ),
                    code: ({ children }) => (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-4">
                            {children}
                        </pre>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} className="text-blue-600 hover:text-blue-800 underline">
                            {children}
                        </a>
                    ),
                    img: ({ src, alt }) => (
                        <img src={src} alt={alt} className="max-w-full h-auto rounded-lg shadow-md my-4" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
