import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function coordinate(value: string | null) {
  const number = Number(value);
  return Number.isFinite(number) && number >= -180 && number <= 180 ? number : null;
}

export async function GET(request: NextRequest) {
  const startLat = coordinate(request.nextUrl.searchParams.get("startLat"));
  const startLon = coordinate(request.nextUrl.searchParams.get("startLon"));
  const endLat = coordinate(request.nextUrl.searchParams.get("endLat"));
  const endLon = coordinate(request.nextUrl.searchParams.get("endLon"));

  if (startLat === null || startLon === null || endLat === null || endLon === null) {
    return NextResponse.json({ error: "유효한 출발지와 도착지 좌표가 필요합니다." }, { status: 400 });
  }

  try {
    const routeUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLon},${startLat};${endLon},${endLat}?overview=false`;
    const response = await fetch(routeUrl, { next: { revalidate: 60 } });
    if (!response.ok) {
      return NextResponse.json({ error: "경로 서비스가 응답하지 않습니다." }, { status: 502 });
    }

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{ distance?: number }>;
    };
    const meters = data.routes?.[0]?.distance;
    if (data.code !== "Ok" || typeof meters !== "number") {
      return NextResponse.json({ error: "두 장소 사이의 경로를 찾지 못했습니다." }, { status: 404 });
    }

    const mapUrl = new URL("https://www.openstreetmap.org/directions");
    mapUrl.searchParams.set("engine", "fossgis_osrm_car");
    mapUrl.searchParams.set(
      "route",
      `${startLat},${startLon};${endLat},${endLon}`
    );

    return NextResponse.json({
      distance: meters / 1000,
      mapUrl: mapUrl.toString()
    });
  } catch {
    return NextResponse.json({ error: "거리 계산 중 오류가 발생했습니다." }, { status: 502 });
  }
}
