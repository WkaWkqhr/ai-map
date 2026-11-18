# 거리 측정기

Nominatim으로 장소를 검색하고 OpenStreetMap의 OSRM 경로 서비스를 이용해 출발지와 도착지 사이의 자동차 기준 거리를 계산하는 Next.js 앱입니다.

## 실행

```bash
npm install
npm run dev
```

## Vercel 배포

GitHub에 저장소를 만든 뒤 Vercel에서 해당 저장소를 Import하면 됩니다. 별도의 Redis, 데이터베이스, 환경변수는 필요하지 않습니다.

장소 검색은 Nominatim 사용 정책에 맞춰 서버 API 라우트에서 요청하며, 검색 결과에서 장소를 선택해야 거리 계산을 할 수 있습니다.
