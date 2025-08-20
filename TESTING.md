# pageRoute 테스트 가이드

이 문서는 `pageRoute` API를 로컬에서 테스트하는 방법을 설명합니다.

## 🚀 빠른 시작

### 1. 개발 서버 실행

```bash
# 의존성 설치
yarn install

# 개발 서버 실행 (포트 8787에서 실행)
yarn dev
```

### 2. 테스트 설정

`test-page-api.js` 파일에서 다음 설정을 변경하세요:

```javascript
const config = {
  baseUrl: 'http://localhost:8787',
  pageId: 'your-actual-notion-page-id',  // 실제 Notion 페이지 ID
  notionToken: 'your-actual-notion-token' // 실제 Notion API 토큰
};
```

### 3. API 테스트 실행

```bash
# 테스트 스크립트 실행
yarn test:page

# 또는 직접 실행
node test-page-api.js
```

## 📋 필요한 정보

### Notion 페이지 ID 찾기
1. Notion에서 테스트할 페이지를 엽니다
2. URL에서 페이지 ID를 복사합니다:
   ```
   https://www.notion.so/workspace/PAGE-ID?v=...
   ```

### Notion API 토큰 생성
1. [Notion Developers](https://developers.notion.com/) 페이지로 이동
2. "My integrations" 클릭
3. 새 integration 생성
4. "Internal Integration Token" 복사

## 🔍 로그 확인

개발 서버 실행 시 콘솔에서 다음과 같은 로그를 확인할 수 있습니다:

```
🚀 pageRoute 시작 - pageId: your-page-id
🔑 notionToken 존재: true
📄 파싱된 pageId: your-page-id
📡 fetchPageById 호출 중...
✅ fetchPageById 성공
📊 page 구조: { hasRecordMap: true, hasBlock: true, blockCount: 5 }
🔧 baseBlocks 처리 시작
🔄 블록 처리 반복 1
📦 현재 총 블록 수: 5
⏳ 대기 중인 블록 수: 0
✅ 모든 블록 처리 완료
🏗️ 컬렉션 처리 시작
📋 컬렉션 정보: { hasCollection: false, hasCollectionView: false }
🎉 pageRoute 완료 - 응답 생성 중
```

## 🐛 에러 디버깅

### 일반적인 에러들

1. **401 Unauthorized**
   - Notion API 토큰이 잘못되었거나 만료됨
   - 토큰을 다시 생성하고 업데이트

2. **404 Not Found**
   - 페이지 ID가 잘못됨
   - 페이지에 대한 접근 권한이 없음
   - Integration이 페이지에 추가되지 않음

3. **500 Internal Server Error**
   - 서버 로그를 확인하여 구체적인 에러 메시지 확인
   - pageRoute 함수의 try-catch 블록에서 상세한 에러 정보 제공

### 로그 레벨

- 🚀 함수 시작
- 📡 API 호출
- ✅ 성공
- ❌ 에러
- 🔄 반복 처리
- 📊 데이터 정보

## 🛠️ 수동 테스트

curl을 사용한 수동 테스트:

```bash
curl -X GET \
  "http://localhost:8787/v1/page/YOUR-PAGE-ID" \
  -H "Authorization: Bearer YOUR-NOTION-TOKEN" \
  -H "Content-Type: application/json"
```

## 📝 추가 테스트 시나리오

1. **빈 페이지 테스트**
   - 내용이 없는 페이지로 테스트

2. **대용량 페이지 테스트**
   - 많은 블록이 있는 페이지로 테스트

3. **컬렉션 뷰 테스트**
   - 데이터베이스/테이블이 포함된 페이지로 테스트

4. **권한 테스트**
   - 다른 사용자의 페이지로 테스트 (권한 없음)

## 🔧 환경 변수 설정

`.env` 파일을 생성하여 환경 변수로 설정할 수도 있습니다:

```bash
NOTION_TOKEN=your-notion-token
NOTION_PAGE_ID=your-page-id
```

이 경우 `test-page-api.js`에서 환경 변수를 읽도록 수정하세요.
