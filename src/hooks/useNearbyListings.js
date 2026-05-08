import { useEffect, useRef, useState } from "react";

const NYC_FALLBACKS = [
  { latitude: 40.671, longitude: -73.981, name: "Park Slope" },
  { latitude: 40.7644, longitude: -73.9235, name: "Astoria" },
  { latitude: 40.7195, longitude: -73.8448, name: "Forest Hills" },
  { latitude: 40.8973, longitude: -73.9085, name: "Riverdale" },
  { latitude: 40.787, longitude: -73.9754, name: "Upper West Side" },
  { latitude: 40.6261, longitude: -74.0327, name: "Bay Ridge" },
  { latitude: 40.7556, longitude: -73.883, name: "Jackson Heights" },
  { latitude: 40.7081, longitude: -73.9571, name: "Williamsburg" },
  { latitude: 40.7447, longitude: -73.9485, name: "Long Island City" },
  { latitude: 40.6451, longitude: -74.0123, name: "Sunset Park" },
];

const PAGE_SIZE = 10;

function pickFallback() {
  return NYC_FALLBACKS[Math.floor(Math.random() * NYC_FALLBACKS.length)];
}

export function useNearbyListings({ refreshSignal = 0 } = {}) {
  const [coords, setCoords] = useState(null);
  const [offset, setOffset] = useState(0);
  const [listings, setListings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fallbackName, setFallbackName] = useState(null);
  const firstSignal = useRef(true);

  useEffect(() => {
    if (firstSignal.current) {
      firstSignal.current = false;
      return;
    }
    setOffset((o) => o + PAGE_SIZE);
  }, [refreshSignal]);

  useEffect(() => {
    let cancelled = false;

    function resolveFallback() {
      const fb = pickFallback();
      if (cancelled) return;
      setFallbackName(fb.name);
      setCoords({ latitude: fb.latitude, longitude: fb.longitude });
    }

    if (!navigator.geolocation) {
      resolveFallback();
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      resolveFallback,
      { timeout: 8000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    if (listings !== null) setRefreshing(true);

    fetch("/api/nearby-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        offset,
        limit: PAGE_SIZE,
      }),
    })
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((data) => {
        if (cancelled) return;
        const next = data.listings || [];
        if (!next.length && offset > 0) {
          setOffset(0);
          return;
        }
        setListings(next);
        setRefreshing(false);
      })
      .catch(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, offset]);

  function refresh() {
    setOffset((o) => o + PAGE_SIZE);
  }

  return { listings, refreshing, fallbackName, refresh };
}
