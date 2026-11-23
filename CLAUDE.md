# naelog 작업 규칙 (Claude용)

개인 기록 사이트 naelog다. 그 안에 로그 세 개가 있고 UI/UX는 모두 같다.

- `dev`: 개발 전반의 기록(지금은 AI 인프라 위주). 배운 것, 정리한 것, 연구한 것, 앞으로 배울 것. 템플릿 `templates/dev-template.html`.
- `book`: 읽은 책에서 옮겨 둔 인용문. 책 정보와 `.quote` 목록이 전부다. 템플릿 `templates/book-template.html`.
- `scrap`: 기사, 아티클 링크 공유. 원문 링크 카드(`.source`), 발췌(`.quote`), 짧은 메모. 템플릿 `templates/scrap-template.html`.

Astro 정적 사이트이고 GitHub Pages로 배포한다. 저장소는 `naenae0210/naelog`, 주소는 https://naenae0210.github.io/naelog/ 다. 로컬 폴더 이름은 `naedevlog` 그대로다.

## 구조

- `public/posts/<slug>/index.html`: 글 하나 = HTML 파일 하나. 넣기만 하면 홈 목록에 자동으로 올라간다.
- `templates/<log>-template.html`: 로그별 새 글 템플릿.
- `public/assets/naedevlog.css`: 공통 디자인. 모든 글이 이 파일 하나를 쓴다.
- `src/logs.ts`: 사이트 이름과 로그 목록(id, 이름, 소개 문구). 로그를 늘리거나 고칠 때 여기만 바꾼다.
- `src/posts.ts`: 빌드할 때 글 폴더를 읽어 목록을 만든다.
- `src/components/Home.astro`: 글 목록 화면. 글을 전부 HTML에 넣고 처음 10개만 보여 준다. 스크롤이 목록 끝에 닿으면 10개씩 더 연다(Home.astro 안 script의 `STEP`). `src/pages/index.astro`(전체)와 `src/pages/[log].astro`(`/dev/`, `/book/`, `/scrap/`)가 같이 쓴다.
- `public/assets/site.js`: 다크/라이트 토글, 한국어/영어 링크. 모든 페이지가 `<head>`에서 부른다.
- `public/en/posts/<slug>/index.html`: dev 글의 영어판. 영어 목록은 `/en/`, `/en/dev/`, `/en/book/`, `/en/scrap/` 모두 있다. book, scrap 영어 목록은 문구만 영어이고 한국어 글로 연결한다.
- `public/assets/edit.js`, `astro.config.mjs`의 `postEditor`: 로컬 글 편집기. 본문과 태그를 고친다.

## 새 글 추가

1. 로그에 맞는 템플릿을 `public/posts/<slug>/index.html`로 복사한다. slug는 영어 소문자와 하이픈.
2. `<head>`의 `post:*` 메타를 채운다.
   - `post:log`: `dev`, `book`, `scrap` 중 하나. 없으면 `dev`로 본다. 템플릿에 이미 맞춰져 있다(헤더 nav의 `aria-current`, 푸터 `naelog · <로그>`).
   - `post:category`: dev는 주제 `AI Infra`, `OS`, `Network`, `Data` 중 하나(Data는 DB, 벡터 DB, 스토리지처럼 데이터를 저장하고 꺼내는 시스템). 한국어판과 영어판에 같은 영어 이름을 쓴다. 넷에 맞지 않는 글이 생기면 새 주제를 정하고 여기에 더한다. book은 저자, scrap은 매체.
   - `post:tags`: 쉼표로 나눈다. 태그 안에 쉼표가 있으면 `\,`로 쓴다 (예: `Peau noire\, masques blancs`).
   - `post:date`: YYYY-MM-DD. 이 날짜 순으로 홈에 정렬된다.
   - 아직 공개하지 않을 글은 `post:draft`를 `true`로 둔다.
3. 본문을 쓰고 필요 없는 컴포넌트는 지운다.
4. dev 글이면 영어판도 만든다(아래 영어판 규칙).
5. `npm run build`로 확인한다.

## 편집기를 깨지 않으려면

- 본문은 반드시 `<main class="wrap">` ... `</main>` 안에 둔다. 편집기가 이 영역만 덮어쓴다.
- `</body>` 바로 앞에 `<script src="../../assets/edit.js"></script>`를 둔다.
- `<head>`에 `<script src="../../assets/site.js"></script>`를 둔다(테마가 화면보다 먼저 정해져야 한다).
- 태그는 `.post-meta` 안의 `<span class="tag">`와 `<meta name="post:tags">` 두 곳에 있다. 편집기가 둘을 같이 고친다.
- 글 전용 `<script>`, `<style>`은 `<main>` 밖에 둔다.

## 디자인 규칙

- 라이트 문서형이 기본이고 다크 모드가 있다. 흰 배경, 검정 본문, 포인트 색은 파랑(`--blue`) 하나. 주황(`--warn`)은 주의 표시에만 쓴다.
- 다크 모드는 `:root[data-theme="dark"]`의 변수 값으로만 만든다. 글 스타일에 hex를 쓰지 않아야 다크에서도 맞는다(`#fff` 대신 `var(--bg)`).
- 장식(그라데이션, 글로우, 진한 테두리, 그림자)을 넣지 않는다. 구분은 여백과 1px 회색 선으로 한다.
- 색은 CSS 변수만 쓴다. 새 색을 만들지 않는다.
- 글 전용 스타일은 그 글의 `<style>`에만 넣는다.
- 그림은 인라인 SVG로 그린다. 템플릿 SVG 주석의 색만 쓴다. 강조할 것 하나만 파랑으로 칠한다. 공통 CSS가 이 hex 값들을 다크 색으로 바꿔 주므로 팔레트 밖 색을 쓰면 다크에서 깨진다.
- 경로는 상대 경로(`../../assets/...`)로 쓴다.
- 인터랙티브 요소(계산기 등)는 그 글 안의 `<script>`에 외부 라이브러리 없이 만든다.

## 글쓰기 규칙

- dev 글은 존댓말(합니다/입니다)로 쓴다. 다른 사람이 쓴 원고를 옮길 때도 존댓말을 그대로 둔다.
- 시리즈 글은 `<meta name="post:series" content="시리즈 이름">`과 `<meta name="post:part" content="n">`을 둔다. 목록과 제목 위 작은 줄에 "LLM 서빙 1편"처럼 나온다. 제목에는 번호를 넣지 않고, 위쪽에 `.series`(편 목록), 아래쪽에 `.series-pager`(이전/다음 편)를 둔다. 예: `public/posts/llm-serving-*`.
- em dash(—)는 쓰지 않는다. 콜론, 쉼표, 하이픈을 쓴다.
- 제목과 소제목에 번호를 붙이지 않는다.
- 제목은 글에 가장 잘 맞는 것을 먼저 찾는다. 질문형은 글이 하나의 질문에 답하고 그 질문이 독자를 끌어당길 때만 쓰고, 항상 질문으로 만들 필요는 없다.
- 메모리 단위는 GiB로 통일한다.
- 계산값과 실측값을 구분해서 적는다. 가정은 캡션이나 콜아웃에 밝힌다.
- 아래 dev 규칙(GiB, 계산값/실측값, 다섯 가지 질문)은 dev 글에만 해당한다. book, scrap의 인용과 발췌는 원문 그대로 옮기고 고치지 않는다(원문의 em dash도 그대로 둔다).
- 직접 실험하고 잰 글은 끝에 다섯 가지 질문(가장 어려웠던 문제, 고른 이유, 대안 비교, 개선 수치, 재사용 가능성)에 답한다.
- 앞으로 배울 것을 적는 글은 무엇을, 왜, 어떤 순서로 배울지와 끝났을 때 답할 수 있어야 할 질문을 적는다.

## 영어판 (dev만)

- dev 글을 쓰면 영어판을 `public/en/posts/<같은 slug>/index.html`에 같이 만든다. book, scrap은 영어판을 만들지 않는다.
- book, scrap 글에는 EN 링크를 달지 않는다. Google 번역 링크(translate.goog)는 지역에 따라 막혀서 쓰지 않는다.
- 구조, 숫자, 그림, 계산기는 한국어판과 똑같이 두고 글자만 옮긴다. SVG 안 글자가 길어지면 좌표만 조정한다.
- `<html lang="en">`, 경로는 `../../../assets/...`. 헤더는 로고가 `../../`(영어 목록), nav는 `../../dev/`, `../../book/`, `../../scrap/`(영어 목록)이다.
- 두 파일이 서로 가리키게 한다. 한국어판에 `<link rel="alternate" hreflang="en" href="../../en/posts/<slug>/" />`, 영어판에 `<link rel="alternate" hreflang="ko" href="../../../posts/<slug>/" />`.
- 영어 제목은 첫 글자만 대문자(sentence case)로 쓰고, 한국어판처럼 콜론으로 앞뒤를 나눈다. 고유명사와 약어(GPU, MinIO, vLLM)는 원래 표기대로. 질문 형태를 쓸 때는 물음표 없이 간접의문 어순으로 쓴다. 예: `Why 70B doesn't fit on one A100: GPU memory and quantization`
- `post:category`는 한국어판과 같은 영어 이름을 그대로 쓴다. 계산기 문구와 숫자 표기(만 → k)도 영어로 바꾼다.
- 영어도 em dash를 쓰지 않고, 단위는 GiB다. 한국어판을 고치면 영어판도 같이 고친다.
