// public/posts/<slug>/index.html (영어판은 public/en/posts/<slug>/) 을 빌드할 때 읽어서 글 목록을 만든다.
// 글 쪽에서 <title>, <meta name="description">, <meta name="post:*"> 만 채우면 홈에 자동으로 올라간다.
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOG, LOGS, logOf } from './logs';

export interface PostInfo {
  slug: string; lang: 'ko' | 'en'; log: string; title: string; description: string; series: string; part: number;
  date: string; category: string; tags: string[]; draft: boolean;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");

function meta(html: string, name: string): string {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i');
  return decode(html.match(re)?.[1]?.trim() ?? '');
}

export function getPosts(lang: 'ko' | 'en' = 'ko'): PostInfo[] {
  const dir = path.join(process.cwd(), 'public', ...(lang === 'en' ? ['en'] : []), 'posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'index.html')))
    .map((d) => {
      const html = fs.readFileSync(path.join(dir, d.name, 'index.html'), 'utf8');
      const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? d.name).replace(/\s*·\s*nae\w*log\s*$/, '');
      const log = meta(html, 'post:log');
      return {
        slug: d.name,
        lang,
        log: LOGS.some((l) => l.id === log) ? log : DEFAULT_LOG,
        title,
        description: meta(html, 'description'),
        date: meta(html, 'post:date'),
        category: meta(html, 'post:category') || '기타',
        // 태그는 쉼표로 나눈다. 태그 안의 쉼표는 \, 로 쓴다 (예: Peau noire\, masques blancs)
        tags: meta(html, 'post:tags').split(/(?<!\\),/).map((t) => t.replace(/\\,/g, ',').trim()).filter(Boolean),
        // 시리즈 글의 편 번호. 같은 날짜면 뒤 편이 위로 온다
        series: meta(html, 'post:series'),
        part: Number(meta(html, 'post:part')) || 0,
        draft: meta(html, 'post:draft') === 'true',
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || b.part - a.part);
}

// 목록 화면에 보일 글. 영어 목록은 영어판이 있는 로그(dev)는 영어 글, 나머지는 한국어 글을 보여 준다.
export function listPosts(lang: 'ko' | 'en', log?: string): PostInfo[] {
  const all = lang === 'en'
    ? [...getPosts('en'), ...getPosts('ko').filter((p) => !logOf(p.log).enPosts)].sort((a, b) => b.date.localeCompare(a.date) || b.part - a.part)
    : getPosts();
  return all.filter((p) => !log || p.log === log);
}

