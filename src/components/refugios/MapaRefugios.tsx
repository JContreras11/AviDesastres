"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Pin = { id: string; nombre: string; gps_lat?: number | null; gps_lng?: number | null };

// Marcador HTML (divIcon) para no depender de los assets de imagen de Leaflet.
function pinHtml(activo: boolean) {
  return `<div style="font-size:${activo ? 30 : 22}px;line-height:1;transform:translate(-50%,-100%);filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">📍</div>`;
}

export function MapaRefugios({ pins, sel, onSelect }: { pins: Pin[]; sel: string | null; onSelect: (id: string) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const LRef = useRef<any>(null);

  // Crea el mapa una vez y coloca los marcadores.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const conCoord = pins.filter((p) => p.gps_lat != null && p.gps_lng != null);
      const map = L.map(elRef.current, { scrollWheelZoom: true }).setView([10.60, -66.97], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);
      for (const p of conCoord) {
        const m = L.marker([p.gps_lat as number, p.gps_lng as number], {
          icon: L.divIcon({ html: pinHtml(false), className: "", iconSize: [0, 0] }),
        }).addTo(map);
        m.bindPopup(`<b>${p.nombre}</b>`);
        m.on("click", () => onSelect(p.id));
        markersRef.current[p.id] = m;
      }
      if (conCoord.length) {
        map.fitBounds(L.latLngBounds(conCoord.map((p) => [p.gps_lat as number, p.gps_lng as number])).pad(0.2));
      }
      mapRef.current = map;
    })();
    return () => { cancelado = true; mapRef.current?.remove(); mapRef.current = null; markersRef.current = {}; };
  }, [pins, onSelect]);

  // Al seleccionar en la lista: centra, hace zoom y abre el popup del marcador.
  useEffect(() => {
    const m = sel && markersRef.current[sel];
    if (!m || !mapRef.current) return;
    mapRef.current.flyTo(m.getLatLng(), Math.max(mapRef.current.getZoom(), 15), { duration: 0.6 });
    m.openPopup();
    // Resalta el marcador activo.
    const L = LRef.current;
    for (const [id, mk] of Object.entries(markersRef.current)) {
      (mk as any).setIcon(L.divIcon({ html: pinHtml(id === sel), className: "", iconSize: [0, 0] }));
    }
  }, [sel]);

  return <div ref={elRef} className="w-full h-full" />;
}
