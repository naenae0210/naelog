import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

// 글 편집기 (npm run dev 에서만 동작, 배포된 사이트에는 영향 없음)
// 브라우저에서 고친 본문을 public/posts/<slug>/index.html (영어판은 public/en/posts/<slug>/) 의 <main> 부분에 덮어쓴다.
// 저장할 때마다 이전 버전을 .edit-history/ 에 남긴다.
function postEditor() {
  const postsDir = { ko: path.resolve('public/posts'), en: path.resolve('public/en/posts') };
  const historyDir = path.resolve('.edit-history');
  const MAIN_RE = /(<main class="wrap">)([\s\S]*?)(\n\s*<\/main>)/;

  const send = (res, code, body, type = 'application/json') => {
    res.statusCode = code;
    res.setHeader('Content-Type', `${type}; charset=utf-8`);
    res.end(type === 'application/json' ? JSON.stringify(body) : body);
  };
  const fileOf = (slug, lang = 'ko') => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug || '') || !['ko', 'en'].includes(lang)) return null;
    const f = path.join(postsDir[lang], slug, 'index.html');
    return fs.existsSync(f) ? f : null;
  };
  const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

  return {
    name: 'naedevlog-post-editor',
    hooks: {
      'astro:server:setup': ({ server }) => {
      // Astro 라우터보다 먼저 받도록 미들웨어 스택 맨 앞에 넣는다. (trailingSlash: always 때문에 URL은 /로 끝난다)
      server.middlewares.stack.unshift({ route: '', handle: (req, res, next) => {
        // 개발 서버는 public/posts/<slug>/ 폴더 주소를 index.html로 열어주지 않아서 직접 연다.
        const page = req.method === 'GET' && req.url?.match(/\/(en\/)?posts\/([a-z0-9-]+)\/(?:index\.html)?(?:\?.*)?$/);
        const pageFile = page && fileOf(page[2], page[1] ? 'en' : 'ko');
        if (pageFile) return send(res, 200, fs.readFileSync(pageFile, 'utf8'), 'text/html');

        const i = req.url?.indexOf('/__edit/') ?? -1;
        if (i < 0) return next();
        const url = new URL(req.url.slice(i), 'http://x');
        const action = url.pathname.replace('/__edit/', '').replace(/\/$/, '');

        if (action === 'ping') return send(res, 200, { ok: true });

        if (action === 'source' && req.method === 'GET') {
          const f = fileOf(url.searchParams.get('slug'), url.searchParams.get('lang') || 'ko');
          if (!f) return send(res, 404, { error: '글을 찾을 수 없다' });
          return send(res, 200, fs.readFileSync(f, 'utf8'), 'text/html');
        }

        if (action === 'save' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { slug, lang, main, title, tags } = JSON.parse(body);
              const f = fileOf(slug, lang || 'ko');
              if (!f) return send(res, 404, { error: '글을 찾을 수 없다' });
              const src = fs.readFileSync(f, 'utf8');
              if (!MAIN_RE.test(src)) return send(res, 400, { error: '<main class="wrap"> 영역을 찾을 수 없다' });

              // 이전 버전 백업
              const stamp = new Date().toISOString().replace(/[:.]/g, '-');
              const hist = path.join(historyDir, lang === 'en' ? `en-${slug}` : slug);
              fs.mkdirSync(hist, { recursive: true });
              fs.writeFileSync(path.join(hist, `${stamp}.html`), src);

              let out = src.replace(MAIN_RE, (_, a, __, c) => a + main.replace(/\s+$/, '') + c);
              if (title) out = out.replace(/<title>[^<]*<\/title>/, `<title>${title} · naelog</title>`);
              if (Array.isArray(tags)) {
                const esc = (t) => String(t).replace(/,/g, '\\,').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const tm = `<meta name="post:tags" content="${tags.map(esc).join(', ')}" />`;
                out = /<meta name="post:tags"[^>]*>/.test(out)
                  ? out.replace(/<meta name="post:tags"[^>]*>/, tm)
                  : out.replace(/(\s*)(<meta name="post:date"[^>]*>)/, `$1$2$1${tm}`);
              }
              const upd = `<meta name="post:updated" content="${today()}" />`;
              out = /<meta name="post:updated"[^>]*>/.test(out)
                ? out.replace(/<meta name="post:updated"[^>]*>/, upd)
                : out.replace(/(\s*)(<meta name="post:date"[^>]*>)/, `$1$2$1${upd}`);

              fs.writeFileSync(f, out);
              return send(res, 200, { ok: true });
            } catch (e) {
              return send(res, 500, { error: String(e) });
            }
          });
          return;
        }
        return send(res, 404, { error: 'unknown action' });
      } });
      },
    },
  };
}

// GitHub Pages 주소에 맞춰 바꾼다.
//  - https://<아이디>.github.io/<저장소>/  →  site: 'https://<아이디>.github.io', base: '/<저장소>'
//  - 저장소 이름이 <아이디>.github.io 이거나 커스텀 도메인이면 base: '/'
export default defineConfig({
  site: 'https://naenae0210.github.io',
  base: '/naelog',
  trailingSlash: 'always',
  integrations: [postEditor()],
});
