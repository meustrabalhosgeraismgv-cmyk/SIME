import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Layers, X, ChevronDown, Car, Footprints, Bike, Clock, Route } from 'lucide-react';

const ANGOLA_CENTER = [-12.3, 17.5];
const ANGOLA_ZOOM = 6;

const VAGAS_COLORS = {
  disponivel: '#4CAF50',
  poucas: '#FF9800',
  lotada: '#F44336',
  unknown: '#9E9E9E',
};

function getVagasStatus(escola) {
  if (!escola.vagas_totais) return 'unknown';
  const ocupacao = ((escola.vagas_totais - escola.vagas_disponiveis) / escola.vagas_totais) * 100;
  if (ocupacao >= 95) return 'lotada';
  if (ocupacao >= 70) return 'poucas';
  return 'disponivel';
}

function getMarkerIcon(status) {
  const color = VAGAS_COLORS[status] || VAGAS_COLORS.unknown;
  return L.divIcon({
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
    html: `
      <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}"/>
        <circle cx="14" cy="14" r="7" fill="white" opacity="0.9"/>
        <svg x="8" y="8" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </svg>
    `,
  });
}

const PROVINCIAS_COORDS = {
  'Bengo': [-8.7833, 13.6500],
  'Benguela': [-12.5783, 13.4072],
  'Bié': [-12.3667, 17.3500],
  'Cabinda': [-5.5500, 12.2000],
  'Cuando Cubango': [-14.7667, 17.6833],
  'Cuanza Norte': [-9.0833, 15.2500],
  'Cuanza Sul': [-10.8667, 14.8833],
  'Cunene': [-16.7667, 15.9667],
  'Huambo': [-12.7642, 15.7367],
  'Huíla': [-14.9167, 13.5000],
  'Luanda': [-8.8368, 13.2343],
  'Lunda Norte': [-8.2833, 19.3667],
  'Lunda Sul': [-10.2833, 20.7500],
  'Malanje': [-9.5400, 16.3411],
  'Moxico': [-13.4017, 21.3167],
  'Namibe': [-15.1961, 12.1522],
  'Uíge': [-7.6167, 15.0500],
  'Zaire': [-6.5667, 13.2833],
};

const TILE_LAYERS = {
  rua: {
    name: 'Mapa',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satelite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

export default function MapaAngola({ escolas = [], compact = false, onSelectEscola }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [mapType, setMapType] = useState('rua');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routingMode, setRoutingMode] = useState('car');
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getEscolaCoords = useCallback((escola) => {
    if (escola.latitude && escola.longitude) {
      return [parseFloat(escola.latitude), parseFloat(escola.longitude)];
    }
    const fallback = PROVINCIAS_COORDS[escola.municipio_nome];
    return fallback || null;
  }, []);

  const fitToEscola = useCallback((escola) => {
    const map = mapInstance.current;
    if (!map) return;
    const coords = getEscolaCoords(escola);
    if (coords) {
      map.flyTo(coords, 15, { duration: 1.5 });
    }
  }, [getEscolaCoords]);

  const startRouting = useCallback(async (escola, mode) => {
    const map = mapInstance.current;
    if (!map) return;

    const activeMode = mode || routingMode;

    setGettingLocation(true);

    const getCoords = () => new Promise((resolve, reject) => {
      if (userLocation) {
        resolve(userLocation);
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => reject(new Error('Não foi possível obter a sua localização')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    try {
      const origin = await getCoords();
      setUserLocation(origin);

      const escolaCoords = getEscolaCoords(escola);
      if (!escolaCoords) return;

      const dest = escolaCoords;

      if (routeRef.current) {
        map.removeLayer(routeRef.current);
      }
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#2196F3;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      });
      userMarkerRef.current = L.marker(origin, { icon: userIcon }).addTo(map);

      const isWalk = activeMode === 'walk';
      const isBike = activeMode === 'bike';
      let distanceKm = 0;
      let durationMin = 0;
      let routeCoords = [origin, dest];
      let usedOsrm = false;

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          routeCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          distanceKm = route.distance / 1000;

          if (isWalk) {
            durationMin = Math.round((distanceKm / 5) * 60);
          } else if (isBike) {
            durationMin = Math.round((distanceKm / 15) * 60);
          } else {
            durationMin = Math.round(route.duration / 60);
          }
          usedOsrm = true;
        }
      } catch (e) {
        console.warn('OSRM falhou, usando linha recta:', e);
      }

      if (!usedOsrm) {
        const R = 6371;
        const dLat = (dest[0] - origin[0]) * Math.PI / 180;
        const dLng = (dest[1] - origin[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(origin[0] * Math.PI / 180) * Math.cos(dest[0] * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const speedKmh = isWalk ? 5 : isBike ? 15 : 40;
        durationMin = Math.round((distanceKm / speedKmh) * 60);
      }

      const routeLine = L.polyline(routeCoords, {
        color: isWalk ? '#FF9800' : isBike ? '#4CAF50' : '#2196F3',
        weight: usedOsrm ? 5 : 3,
        opacity: 0.8,
        dashArray: usedOsrm ? null : '10, 6',
      }).addTo(map);

      routeRef.current = routeLine;

      setRouteInfo({
        distancia: distanceKm.toFixed(1),
        duracao: durationMin,
        modo: activeMode,
        passos: 0,
        googleMapsUrl: `https://www.google.com/maps/dir/${origin[0]},${origin[1]}/${dest[0]},${dest[1]}/@${(origin[0]+dest[0])/2},${(origin[1]+dest[1])/2},12z`,
      });

      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    } catch (err) {
      console.error('Erro na rota:', err);
    } finally {
      setGettingLocation(false);
    }
  }, [userLocation, getEscolaCoords]);

  const searchEscolas = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const results = escolas.filter(e =>
      e.nome.toLowerCase().includes(q) ||
      e.municipio_nome?.toLowerCase().includes(q) ||
      e.tipo?.toLowerCase().includes(q)
    );
    setSearchResults(results);
  }, [escolas]);

  useEffect(() => {
    searchEscolas(searchQuery);
  }, [searchQuery, searchEscolas]);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: ANGOLA_CENTER,
      zoom: ANGOLA_ZOOM,
      zoomControl: false,
      scrollWheelZoom: !compact,
      dragging: !compact,
      doubleClickZoom: !compact,
      touchZoom: !compact,
    });

    const streetLayer = L.tileLayer(TILE_LAYERS.rua.url, {
      attribution: TILE_LAYERS.rua.attribution,
      maxZoom: 18,
    }).addTo(map);

    layerRef.current = streetLayer;
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [compact]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const tileConfig = TILE_LAYERS[mapType];
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18,
    }).addTo(map);

    layerRef.current = newLayer;
  }, [mapType]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    Object.entries(PROVINCIAS_COORDS).forEach(([nome, coords]) => {
      if (!compact) {
        const label = L.divIcon({
          className: '',
          iconSize: [80, 20],
          iconAnchor: [40, 10],
          html: `<div style="font-size:11px;font-weight:600;color:#333;text-shadow:1px 1px 2px white,-1px -1px 2px white,1px -1px 2px white,-1px 1px 2px white;white-space:nowrap;pointer-events:none;">${nome}</div>`,
        });
        const lbl = L.marker(coords, { icon: label, interactive: false }).addTo(map);
        markersRef.current.push(lbl);
      }
    });

    escolas.forEach((escola) => {
      let lat, lng;

      if (escola.latitude && escola.longitude) {
        lat = escola.latitude;
        lng = escola.longitude;
      } else {
        const municipioCoords = PROVINCIAS_COORDS[escola.municipio_nome];
        if (!municipioCoords) return;
        lat = municipioCoords[0] + (Math.random() - 0.5) * 0.01;
        lng = municipioCoords[1] + (Math.random() - 0.5) * 0.01;
      }

      const status = getVagasStatus(escola);
      const escolaId = escola._id || escola.id;
      const marker = L.marker([lat, lng], { icon: getMarkerIcon(status) }).addTo(map);

      const tipoLabel = escola.tipo === 'pre_escolar' ? 'Ensino Pré-Escolar' :
                       escola.tipo === 'ensino_primario' ? 'Ensino Primário' :
                       escola.tipo === 'ensino_medio' ? 'Ensino Médio' :
                       escola.tipo;

      marker.bindPopup(`
        <div style="min-width:220px;font-family:Inter,sans-serif;">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1a1a1a;">${escola.nome}</h3>
          <p style="margin:0 0 3px;font-size:12px;color:#666;">${tipoLabel}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#666;">📍 ${escola.municipio_nome}</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:8px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
              <span style="color:#666;">Vagas disponíveis</span>
              <span style="font-weight:600;color:${VAGAS_COLORS[status]};">${escola.vagas_disponiveis || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;">
              <span style="color:#666;">Total</span>
              <span style="font-weight:600;">${escola.vagas_totais || 0}</span>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button onclick="window.__sime_select_escola && window.__sime_select_escola('${escolaId}')" style="flex:1;padding:6px;background:#0061a4;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Ver Detalhes</button>
            <button onclick="window.__sime_route_escola && window.__sime_route_escola('${escolaId}')" style="padding:6px 10px;background:#4CAF50;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
              Rota
            </button>
          </div>
          <button onclick="window.__sime_solicitar_vaga && window.__sime_solicitar_vaga('${escolaId}', '${escola.nome.replace(/'/g, "\\'")}')" style="width:100%;margin-top:6px;padding:6px;background:#FF9800;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Solicitar Vagas</button>
        </div>
      `, { maxWidth: 280 });

      marker.on('click', () => {
        setSelectedEscola(escola);
        fitToEscola(escola);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [escolas, compact, fitToEscola]);

  useEffect(() => {
    window.__sime_select_escola = (id) => {
      const escola = escolas.find(e => (e._id || e.id) === id);
      if (escola && onSelectEscola) {
        onSelectEscola(escola);
      }
    };
    window.__sime_route_escola = (id) => {
      const escola = escolas.find(e => (e._id || e.id) === id);
      if (escola) startRouting(escola);
    };
    window.__sime_solicitar_vaga = (id, nome) => {
      window.location.href = `/escolas/${id}#solicitar`;
    };
    return () => {
      delete window.__sime_select_escola;
      delete window.__sime_route_escola;
      delete window.__sime_solicitar_vaga;
    };
  }, [escolas, onSelectEscola, startRouting]);

  const handleSelectResult = (escola) => {
    setSearchQuery(escola.nome);
    setSearchResults([]);
    setShowSearch(false);
    fitToEscola(escola);
    setSelectedEscola(escola);
    startRouting(escola);
  };

  const clearRoute = () => {
    const map = mapInstance.current;
    if (map) {
      if (routeRef.current) map.removeLayer(routeRef.current);
      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    }
    routeRef.current = null;
    userMarkerRef.current = null;
    setRouteInfo(null);
    setUserLocation(null);
  };

  return (
    <div className="relative w-full" style={{ height: compact ? '256px' : '100%', minHeight: compact ? '256px' : '400px' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: compact ? '12px' : '0' }} />

      {!compact && (
        <>
          {/* Search Bar */}
          <div className="absolute top-3 left-3 z-[1000]" style={{ width: '280px' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Pesquisar escola..."
                className="w-full h-10 pl-9 pr-9 rounded-lg bg-white shadow-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-transparent"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {showSearch && searchResults.length > 0 && (
              <div className="mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                {searchResults.map((escola) => (
                  <button
                    key={escola._id || escola.id}
                    onClick={() => handleSelectResult(escola)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 group"
                  >
                    <MapPin className="w-4 h-4 text-[#0061a4] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{escola.nome}</p>
                      <p className="text-xs text-gray-500">{escola.municipio_nome}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium flex-shrink-0">
                       {escola.tipo === 'pre_escolar' ? 'Pré' :
                        escola.tipo === 'ensino_primario' ? 'Prim' :
                        escola.tipo === 'ensino_medio' ? 'Méd' :
                        '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showSearch && searchQuery && searchResults.length === 0 && (
              <div className="mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">Nenhuma escola encontrada</p>
              </div>
            )}
          </div>

          {/* Layer Toggle */}
          <div className="absolute top-3 right-3 z-[1000]">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {Object.entries(TILE_LAYERS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setMapType(key)}
                  className={`block w-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    mapType === key
                      ? 'bg-[#0061a4] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Controls - Top Center Horizontal */}
          {!compact && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex items-center overflow-hidden">
                <button
                  onClick={() => mapInstance.current?.zoomOut()}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors text-xl font-bold"
                >
                  −
                </button>
                <div className="w-px h-6 bg-gray-200"></div>
                <button
                  onClick={() => mapInstance.current?.zoomIn()}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Route Mode Selector (shown when routing) */}
          {routeInfo && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Route className="w-4 h-4 text-[#0061a4]" />
                  <span className="font-semibold text-gray-900">{routeInfo.distancia} km</span>
                  <span className="text-gray-400">•</span>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {routeInfo.duracao >= 60
                      ? `${Math.floor(routeInfo.duracao / 60)}h ${routeInfo.duracao % 60}min`
                      : `${routeInfo.duracao} min`
                    }
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setRoutingMode('car'); if (selectedEscola) startRouting(selectedEscola, 'car'); }}
                    className={`p-2 rounded-lg ${routingMode === 'car' ? 'bg-[#0061a4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Car className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setRoutingMode('bike'); if (selectedEscola) startRouting(selectedEscola, 'bike'); }}
                    className={`p-2 rounded-lg ${routingMode === 'bike' ? 'bg-[#0061a4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Bike className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setRoutingMode('walk'); if (selectedEscola) startRouting(selectedEscola, 'walk'); }}
                    className={`p-2 rounded-lg ${routingMode === 'walk' ? 'bg-[#0061a4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Footprints className="w-4 h-4" />
                  </button>
                </div>
                {routeInfo.googleMapsUrl && (
                  <a href={routeInfo.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    Navegar
                  </a>
                )}
                <button onClick={clearRoute} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-3 py-2">
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#4CAF50]"></span>
                  <span className="text-gray-600">Disponível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF9800]"></span>
                  <span className="text-gray-600">Poucas vagas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#F44336]"></span>
                  <span className="text-gray-600">Lotada</span>
                </div>
              </div>
            </div>
          </div>

          {/* School Count */}
          <div className="absolute bottom-3 right-3 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-3 py-2">
              <span className="text-xs font-medium text-gray-600">
                {escolas.length} escola{escolas.length !== 1 ? 's' : ''} no mapa
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
