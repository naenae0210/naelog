# naelog

개발 공부, 읽은 책, 모아 둔 글을 한곳에 남기는 기록 사이트다. 로그 세 개가 같은 디자인을 쓴다.

| 로그 | 주소 | `post:log` |
| --- | --- | --- |
| dev: 개발 기록 | `/dev/` | `dev` |
| book: 읽은 책의 인용문 | `/book/` | `book` |
| scrap: 기사 링크 공유 | `/scrap/` | `scrap` |

홈(`/`)은 세 로그의 글을 날짜순으로 모두 보여 준다. dev 글은 영어판이 있다(`/en/`). 헤더 오른쪽에서 EN/한국어 전환과 다크/라이트 모드를 바꾼다. 로그 이름과 소개 문구는 `src/logs.ts`에서 바꾼다.

## 로컬에서 보기

```bash
npm install
npm run dev      # http://localhost:4321/naelog/
```

## GitHub Pages 배포

1. GitHub에 `naelog` 저장소를 만들고 이 폴더를 push한다.
2. `astro.config.mjs`의 `site`를 `https://<내 아이디>.github.io`로 바꾼다. 저장소 이름이 다르면 `base`도 바꾼다.
3. 저장소 Settings → Pages → Source를 **GitHub Actions**로 바꾼다.
4. `main`에 push하면 `.github/workflows/deploy.yml`이 빌드하고 배포한다.

## 글 쓰는 흐름

1. Claude에게 "book에 ○○ 인용 올려 줘", "scrap에 이 링크 올려 줘"처럼 로그를 정해서 요청한다.
2. 받은 HTML을 `public/posts/<slug>/index.html`로 넣는다. 홈 목록은 자동으로 갱신된다.
3. push한다.

Claude Code로 이 폴더를 열면 `CLAUDE.md` 규칙대로 알아서 처리한다.

## 글 직접 고치기

1. `npm run dev`로 띄우고 글을 연다.
2. 오른쪽 아래 **편집**을 누른다. 문장을 클릭해서 고치고, Enter로 새 문단(목록 안에서는 새 항목)을 만든다. 태그는 날짜 옆 입력칸에서 쉼표로 나눠 고친다.
3. **저장**(Ctrl/Cmd + S)을 누르면 HTML 파일에 바로 반영된다. 취소는 Esc.
4. 확인했으면 commit, push한다.

- 그림, 계산기, 코드 블록은 잠겨 있다. 이런 부분은 HTML 파일을 에디터로 열어 직접 고친다.
- 저장할 때마다 이전 버전이 `.edit-history/<slug>/`에 남는다. 잘못 저장했으면 거기서 되살린다.
- 편집 버튼은 로컬 개발 서버에서만 보인다. 배포된 사이트에는 나타나지 않는다.
- 밖에서 급하게 고칠 때는 GitHub 저장소에서 파일을 열고 연필 아이콘으로 수정해도 된다.

## 추후 기획: 인스타 카드와 영상

- 글 하나에서 인스타 카드(1080×1350)를 뽑는다. 블로그와 같은 색과 폰트를 써서 한 브랜드로 묶는다.
- 짧은 설명 영상(릴스)은 글의 그림을 장면으로 나눠 만든다.
- 카드 마지막 장과 영상 끝에 블로그 주소를 넣어 유입을 만든다.
