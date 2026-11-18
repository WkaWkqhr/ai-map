import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("accept-language", "ko,en");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "nominatim-distance-app/1.0 (Vercel serverless app)"
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "장소 검색 서비스가 응답하지 않습니다." }, { status: 502 });
    }

    const results = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return NextResponse.json({
      places: results.map(({ place_id, display_name, lat, lon }) => ({
        place_id,
        display_name,
        lat,
        lon
      }))
    });
  } catch {
    return NextResponse.json({ error: "장소 검색 중 오류가 발생했습니다." }, { status: 502 });
  }
}
