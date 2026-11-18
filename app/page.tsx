"use client";

import { FormEvent, useState } from "react";

type Place = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type PlaceFieldProps = {
  label: string;
  value: string;
  selected: Place | null;
  suggestions: Place[];
  loading: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (place: Place) => void;
};

function PlaceField({
  label,
  value,
  selected,
  suggestions,
  loading,
  onChange,
  onSearch,
  onSelect
}: PlaceFieldProps) {
  return (
    <div className="field-group">
      <label htmlFor={label}>{label}</label>
      <div className="search-row">
        <input
          id={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearch();
            }
          }}
          placeholder={`${label}를 입력하세요`}
          autoComplete="off"
          aria-describedby={`${label}-status`}
        />
        <button type="button" className="search-button" onClick={onSearch} disabled={loading}>
          {loading ? "조회 중" : "조회"}
        </button>
      </div>
      <div id={`${label}-status`} className="field-status" aria-live="polite">
        {selected ? `선택됨: ${selected.display_name}` : "검색 결과에서 장소를 선택해 주세요."}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions" role="listbox" aria-label={`${label} 검색 결과`}>
          {suggestions.map((place) => (
            <button
              type="button"
              className="suggestion"
              key={place.place_id}
              onClick={() => onSelect(place)}
              role="option"
            >
              <span className="pin">●</span>
              <span>{place.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [start, setStart] = useState<Place | null>(null);
  const [end, setEnd] = useState<Place | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<Place[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Place[]>([]);
  const [searching, setSearching] = useState<"start" | "end" | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function searchPlace(kind: "start" | "end") {
    const query = kind === "start" ? startText.trim() : endText.trim();
    if (!query) {
      setError(`${kind === "start" ? "출발지" : "도착지"}를 입력해 주세요.`);
      return;
    }

    setError("");
    setSearching(kind);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { places?: Place[]; error?: string };
      if (!response.ok) throw new Error(data.error || "장소를 조회하지 못했습니다.");

      if (kind === "start") setStartSuggestions(data.places ?? []);
      else setEndSuggestions(data.places ?? []);

      if (!data.places?.length) {
        setError("검색 결과가 없습니다. 더 구체적인 장소명을 입력해 주세요.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "장소 조회에 실패했습니다.");
    } finally {
      setSearching(null);
    }
  }

  async function calculateDistance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!start || !end) {
      setError("출발지와 도착지를 검색한 뒤 결과를 각각 선택해 주세요.");
      return;
    }

    setError("");
    setCalculating(true);
    setDistance(null);
    setMapUrl(null);
    try {
      const response = await fetch(
        `/api/route?startLat=${start.lat}&startLon=${start.lon}&endLat=${end.lat}&endLon=${end.lon}`
      );
      const data = (await response.json()) as { distance?: number; mapUrl?: string; error?: string };
      if (!response.ok || data.distance === undefined || !data.mapUrl) {
        throw new Error(data.error || "거리를 계산하지 못했습니다.");
      }
      setDistance(data.distance);
      setMapUrl(data.mapUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "거리 계산에 실패했습니다.");
    } finally {
      setCalculating(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card">
        <div className="eyebrow">OPENSTREETMAP DISTANCE</div>
        <h1>두 장소 사이의 거리를<br /><span>간편하게 확인하세요.</span></h1>
        <p className="intro">실제 장소를 검색하고 자동차 기준 경로 거리를 계산해 보세요.</p>

        <form onSubmit={calculateDistance}>
          <PlaceField
            label="출발지"
            value={startText}
            selected={start}
            suggestions={startSuggestions}
            loading={searching === "start"}
            onChange={(value) => {
              setStartText(value);
              setStart(null);
              setStartSuggestions([]);
            }}
            onSearch={() => searchPlace("start")}
            onSelect={(place) => {
              setStart(place);
              setStartText(place.display_name);
              setStartSuggestions([]);
            }}
          />

          <div className="route-line" aria-hidden="true"><span>↓</span></div>

          <PlaceField
            label="도착지"
            value={endText}
            selected={end}
            suggestions={endSuggestions}
            loading={searching === "end"}
            onChange={(value) => {
              setEndText(value);
              setEnd(null);
              setEndSuggestions([]);
            }}
            onSearch={() => searchPlace("end")}
            onSelect={(place) => {
              setEnd(place);
              setEndText(place.display_name);
              setEndSuggestions([]);
            }}
          />

          <button className="calculate-button" type="submit" disabled={calculating}>
            {calculating ? "거리 계산 중..." : "거리 계산하기"}
          </button>
        </form>

        {error && <p className="error-message" role="alert">{error}</p>}

        {distance !== null && mapUrl && (
          <div className="result" aria-live="polite">
            <div className="result-label">총거리</div>
            <div className="distance">{distance.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}<small> km</small></div>
            <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">
              지도에서 보기 <span>↗</span>
            </a>
          </div>
        )}

        <footer>Nominatim · OpenStreetMap · OSRM</footer>
      </section>
    </main>
  );
}
