/* naedevlog 글 편집기
   npm run dev 로 띄운 로컬 화면에서만 나타난다. 배포된 사이트에서는 아무것도 하지 않는다.
   편집: 문장을 클릭해서 고친다. Enter는 새 문단(목록 안에서는 새 항목). 태그는 제목 아래 입력칸에서 쉼표로 나눠 고친다.
   저장: Ctrl/Cmd + S, 취소: Esc. 그림, 계산기, 코드 블록은 잠겨 있다(필요하면 HTML 파일에서 직접 고친다). */
(function () {
  const me = document.currentScript;
  if (!me) return;
  const base = new URL('../', me.src).pathname;            // 예: /naedevlog/
  const api = (p) => base + '__edit/' + p + '/';
  const m = location.pathname.match(/\/(en\/)?posts\/([^/]+)\/?/) || [];
  const slug = m[2], lang = m[1] ? 'en' : 'ko';
  if (!slug) return;

  fetch(api('ping')).then((r) => (r.ok ? r.json() : null)).then((j) => j && j.ok && init()).catch(() => {});

  // 태그는 쉼표로 나눈다. 태그 안의 쉼표는 \, 로 쓴다
  const splitTags = (s) => s.split(/(?<!\\),/).map((t) => t.replace(/\\,/g, ',').trim()).filter(Boolean);

  function init() {
    const css = document.createElement('style');
    css.textContent = `
      .nd-fab { position: fixed; right: 24px; bottom: 24px; z-index: 50; display: flex; gap: 8px; align-items: center;
        font: 600 14px var(--font); }
      .nd-btn { cursor: pointer; border: 0; border-radius: 10px; padding: 11px 18px; font: inherit;
        background: var(--text); color: var(--bg); box-shadow: 0 4px 14px rgba(0,0,0,.12); }
      .nd-btn.ghost { background: var(--bg); color: var(--sub); box-shadow: 0 0 0 1px var(--line-strong); }
      .nd-btn.primary { background: var(--blue); }
      .nd-btn:disabled { opacity: .5; cursor: default; }
      .nd-status { background: var(--bg); color: var(--sub); padding: 8px 12px; border-radius: 8px; box-shadow: 0 0 0 1px var(--line); }
      .nd-editing main.wrap { outline: 2px dashed var(--blue-light); outline-offset: 16px; border-radius: 4px; }
      .nd-editing main.wrap [contenteditable="true"]:focus,
      .nd-editing main.wrap:focus { outline: none; }
      .nd-editing main.wrap p:hover, .nd-editing main.wrap li:hover, .nd-editing main.wrap h1:hover,
      .nd-editing main.wrap h2:hover, .nd-editing main.wrap h3:hover, .nd-editing main.wrap td:hover { background: var(--blue-soft); }
      .nd-tags { font: 13px var(--font); padding: 3px 10px; min-width: 240px; border: 1px solid var(--line-strong); border-radius: 6px;
        background: var(--bg); color: var(--text); }
      .nd-tags:focus { outline: none; border-color: var(--blue); }
      .nd-locked { position: relative; }
      .nd-editing .nd-locked::after { content: '잠김: HTML에서 수정'; position: absolute; top: 8px; right: 10px;
        font: 600 11px var(--font); color: var(--faint); background: var(--bg); padding: 2px 8px; border-radius: 6px; box-shadow: 0 0 0 1px var(--line); }
    `;
    document.head.appendChild(css);

    const fab = document.createElement('div');
    fab.className = 'nd-fab';
    document.body.appendChild(fab);

    let main = document.querySelector('main.wrap');
    let original = '';
    let dirty = false;
    let tagInput = null;

    const ui = (state, msg) => {
      fab.innerHTML = '';
      if (msg) { const s = document.createElement('span'); s.className = 'nd-status'; s.textContent = msg; fab.appendChild(s); }
      const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'nd-btn ' + cls; b.textContent = label; b.onclick = fn; fab.appendChild(b); return b; };
      if (state === 'view') btn('편집', '', start);
      if (state === 'edit') { btn('취소', 'ghost', cancel); btn('저장', 'primary', save); }
      if (state === 'busy') btn('저장 중…', 'primary', () => {}).disabled = true;
    };
    ui('view');

    async function start() {
      // 계산기 등 스크립트가 바꿔 놓은 화면이 아니라, 파일 원본 본문을 불러와서 편집한다.
      const src = await (await fetch(api('source') + '?slug=' + slug + '&lang=' + lang)).text();
      const doc = new DOMParser().parseFromString(src, 'text/html');
      const fresh = doc.querySelector('main.wrap');
      if (!fresh) return alert('본문(<main class="wrap">)을 찾지 못했다.');
      original = fresh.innerHTML;
      main.innerHTML = original;

      main.contentEditable = 'true';
      main.spellcheck = false;
      main.querySelectorAll('svg, .figure > :not(figcaption), #calc, pre, script, style, .post-meta').forEach((el) => {
        el.contentEditable = 'false';
      });
      main.querySelectorAll('.figure, pre').forEach((el) => el.classList.add('nd-locked'));
      main.querySelectorAll('#calc').forEach((el) => el.classList.add('nd-locked'));

      // 태그: 칩을 지우고 쉼표로 나눈 입력칸으로 바꾼다. 저장할 때 칩과 <meta name="post:tags">를 같이 고친다.
      const meta = main.querySelector('.post-meta');
      tagInput = null;
      if (meta) {
        const tm = doc.querySelector('meta[name="post:tags"]');
        const tags = tm ? splitTags(tm.content) : [...meta.querySelectorAll('.tag')].map((t) => t.textContent);
        meta.querySelectorAll('.tag').forEach((t) => t.remove());
        tagInput = document.createElement('input');
        tagInput.className = 'nd-tags';
        tagInput.placeholder = '태그, 쉼표로 구분';
        tagInput.value = tags.map((t) => t.trim().replace(/,/g, '\\,')).filter(Boolean).join(', ');
        meta.appendChild(tagInput);
      }
      document.execCommand('defaultParagraphSeparator', false, 'p');
      document.documentElement.classList.add('nd-editing');
      dirty = false;
      main.addEventListener('input', onInput);
      main.addEventListener('paste', onPaste);
      ui('edit', '편집 중 · 저장 Ctrl+S · 취소 Esc');
    }

    const onInput = () => { dirty = true; };
    function onPaste(e) {           // 서식 없이 글자만 붙인다
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    }

    function stop() {
      main.removeEventListener('input', onInput);
      main.removeEventListener('paste', onPaste);
      document.documentElement.classList.remove('nd-editing');
    }

    function cancel() {
      if (dirty && !confirm('저장하지 않은 수정 내용을 버릴까?')) return;
      dirty = false;
      stop();
      location.reload();
    }

    const readTags = () => tagInput ? splitTags(tagInput.value) : null;

    function clean(root) {
      const c = root.cloneNode(true);
      const meta = c.querySelector('.post-meta');
      const tags = readTags();
      if (meta && tags) {
        meta.querySelectorAll('.nd-tags, .tag').forEach((el) => el.remove());
        while (meta.lastChild && meta.lastChild.nodeType === 3 && !meta.lastChild.textContent.trim()) meta.lastChild.remove();
        if (tags.length) {
          meta.append('\n      ');
          tags.forEach((t) => { const s = document.createElement('span'); s.className = 'tag'; s.textContent = t; meta.append(s); });
        }
        meta.append('\n    ');
      }
      c.removeAttribute('contenteditable'); c.removeAttribute('spellcheck');
      c.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
      c.querySelectorAll('.nd-locked').forEach((el) => { el.classList.remove('nd-locked'); if (!el.className) el.removeAttribute('class'); });
      // 브라우저가 몰래 넣는 서식 태그를 벗겨낸다
      c.querySelectorAll('span[style], font').forEach((el) => el.replaceWith(...el.childNodes));
      c.querySelectorAll('[style=""]').forEach((el) => el.removeAttribute('style'));
      c.querySelectorAll('p, li, h1, h2, h3').forEach((el) => { if (!el.textContent.trim() && !el.querySelector('img,svg,code')) el.remove(); });
      c.querySelectorAll('br').forEach((br) => { if (!br.nextSibling && br.parentElement && /^(P|LI|H\d)$/.test(br.parentElement.tagName)) br.remove(); });
      return c.innerHTML.replace(/&nbsp;/g, ' ');
    }

    async function save() {
      ui('busy');
      const h1 = main.querySelector('h1');
      try {
        const r = await fetch(api('save'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, lang, main: clean(main), title: h1 ? h1.textContent.trim() : '', tags: readTags() }),
        });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || r.status);
        dirty = false;
        stop();
        location.reload();
      } catch (e) {
        alert('저장 실패: ' + e.message);
        ui('edit', '저장 실패, 다시 시도');
      }
    }

    document.addEventListener('keydown', (e) => {
      if (!document.documentElement.classList.contains('nd-editing')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  }
})();
