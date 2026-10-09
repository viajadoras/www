import rss from '@astrojs/rss';
import type { APIContext, MarkdownInstance } from 'astro';

interface Article {
  title: string;
  description: string;
  date: string;
  updated?: string;
}

export function GET(context: APIContext) {
  const posts = Object.values(
    import.meta.glob<MarkdownInstance<Article>>('./blog/*.md', {
      eager: true,
    }),
  ).sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
  return rss({
    title: 'Blog Viajadoras',
    description:
      'Guias para mulheres que querem viajar sozinha ou com amigas, achar companhia e sair mais na cidade.',
    site: context.site ?? 'https://viajadoras.com',
    items: posts.map(({ frontmatter, url }) => ({
      title: frontmatter.title,
      description: frontmatter.description,
      link: `${url}/`.replace(/\/+$/, '/'),
      pubDate: new Date(`${frontmatter.date}T12:00:00Z`),
    })),
    customData: '<language>pt-BR</language>',
  });
}
