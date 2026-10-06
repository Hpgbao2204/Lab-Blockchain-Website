import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const external = (href?: string) => !!href && /^https?:\/\//i.test(href);

/** Headings start at h2 (the post title is the page's h1); links leave the site in a new tab. */
const components: Components = {
  h1: ({ children }) => <h2>{children}</h2>,
  a: ({ href, children }) =>
    external(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    ),
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
  table: ({ children }) => (
    <div className="prose-table">
      <table>{children}</table>
    </div>
  ),
};

/**
 * Members' posts are Markdown (GitHub flavour: tables, task lists, strikethrough). Raw HTML is
 * not rendered and unsafe link schemes are dropped, so a post cannot run scripts.
 */
export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`prose-post ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
