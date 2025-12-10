'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import 'maplibre-gl/dist/maplibre-gl.css';
import Wave from 'react-wavify';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';

const Ombak1 = () => (
  <Wave
    fill="#081380"
    paused={false}
    style={{ display: 'flex' }}
    options={{ height: 30, amplitude: 50, speed: 0.2, points: 3 }}
  />
);

const Ombak2 = () => (
<Wave fill="url(#gradient)" options={{ height: 20, amplitude: 50, speed: 0.2, points: 3 }}>
  <defs>
    <linearGradient id="gradient" gradientTransform="rotate(90)">
      <stop offset="10%"  stopColor="white" />
      <stop offset="90%" stopColor="#081380" />
    </linearGradient>
  </defs>
</Wave>
);

function calculateDestination(lat, lon, distanceMeters, bearing) {
  const R = 6371e3; 
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const θ = toRad(bearing);
  const δ = distanceMeters / R;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return [toDeg(λ2), toDeg(φ2)]; 
}

// Gak kepake (buat jaga jaga kalo FC gabisa ngirim COG)
function calculateBearing(startLat, startLon, destLat, destLon) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLonRad = (startLon * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLonRad = (destLon * Math.PI) / 180;

  const y = Math.sin(destLonRad - startLonRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLonRad - startLonRad);

  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  return (brng + 360) % 360; 
}

export default function Home() {
  const [dronePos, setDronePos] = useState(null);
  const [droneSpd, setDroneSpd] = useState(null);
  const [surpic, setSurpic] = useState(null);
  const [undpic, setUndpic] = useState(null);
  const [times, setTimee] = useState(null);
  const [path, setPath] = useState([]);
  const [checkp, setPoint] = useState([]); 
  const [grid, setGrid] = useState(null); 
  const [waypo, setwaypo] = useState(null); 
  const [trajectoryBearing, setTrajectoryBearing] = useState(0); 
  const mapRef = useRef(null); 
  const [selectedLintasan, setSelectedLintasan] = useState("A"); 

  const [viewState, setViewState] = useState(null);

  useEffect(() => {
    if (path.length < 2) return; 
    
    const currentPoint = path[path.length - 1]; // [lon, lat, cog]
    const prevPoint = path[path.length - 2];

    const curLat = currentPoint[1];
    const curLon = currentPoint[0];
    const prevLat = prevPoint[1];
    const prevLon = prevPoint[0];

    const bearing = calculateBearing(prevLat, prevLon, curLat, curLon);
    setTrajectoryBearing(bearing);

  }, [path]); 

  const headingLineData = useMemo(() => {
    if (!dronePos) return null;
    
    const lineLength = 10; 
    const endPoint = calculateDestination(dronePos.lat, dronePos.lon, lineLength, trajectoryBearing);

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [dronePos.lon, dronePos.lat], 
          endPoint          
        ]
      }
    };
  }, [dronePos, trajectoryBearing]);

  const updateGrid = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    const west = bounds.getWest();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const north = bounds.getNorth();
    
    const lines = [];
    const distance = 5; // meter

    // Konversi meter ke derajat latitude
    const latStep = distance / 111132;

    // Garis Horizontal
    for (let lat = Math.floor(south / latStep) * latStep; lat < north; lat += latStep) {
        lines.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[west - 0.01, lat], [east + 0.01, lat]]
            }
        });
    }

    // Garis vertikal 
    const centerLat = map.getCenter().lat;
    const lonStep = distance / (111320 * Math.cos(centerLat * (Math.PI / 180)));

    for (let lon = Math.floor(west / lonStep) * lonStep; lon < east; lon += lonStep) {
        lines.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[lon, south - 0.01], [lon, north + 0.01]]
            }
        });
    }

    setGrid({
        type: 'FeatureCollection',
        features: lines
    });
  }, []);

  useEffect(() => {
    const droneRef = ref(db, "Data/GPS_DATA");
    const spdRef = ref(db, "Data/Speed Over Ground");
    const imgRef = ref(db, "Data/Centerpoint Garis");
    
    const checkpRef = ref(db, "Data/Checkpoint"); 
    const waypoRef = ref(db, "Data/Waypoint");

    const unsubgps = onValue(droneRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newPos = { lat: data.latitude, lon: data.longitude, cog: data.COG };
        setDronePos(newPos);
        setPath(prev => [...prev, [newPos.lon, newPos.lat, newPos.cog]]);
      }
    });

    const unsubspd = onValue(spdRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDroneSpd({ km: data.SOG_KMH, knot: data.SOG_KNOT, heading: data.Heading });
      }
    });

    const unsubpic = onValue(imgRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.imageBase64) {
        setSurpic(`data:image/png;base64,${data.imageBase64}`);
      }
    });

    const unundpic = onValue(imgRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.underwaterImageBase64) {
        setUndpic(`data:image/png;base64,${data.underwaterImageBase64}`);
      }
    });

    const unsubtim = onValue(imgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimee({ dt: data.Date, dy: data.Day, tm: data.Time });
      }
    });

    const uncheckp = onValue(checkpRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setPoint(data); 
    });

    const unwp = onValue(waypoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setwaypo(data); 
    });

    return () => {
      unsubgps();
      unsubspd();
      unsubpic();
      unundpic();
      unsubtim();
      uncheckp();
      unwp();
    };
  }, []);

  useEffect(() => {
    if (dronePos) {
      setViewState(prev => ({
        ...prev,
        zoom: 19.5,
        longitude: dronePos.lon,
        latitude: dronePos.lat
      }));
    }
  }, [dronePos]);

let headingGeoJSON = null;
  if (dronePos) {
    const lineLength = 10; 
    const endPoint = calculateDestination(dronePos.lat, dronePos.lon, lineLength, dronePos.cog || 0);

    headingGeoJSON = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [dronePos.lon, dronePos.lat],
          endPoint
        ]
      }
    };
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Navbar */}
      <div className="grid grid-cols-3 bg-[#081380] text-white px-4 md:px-6 pt-4 md:pt-6 font-bold text-center text-base md:text-lg xl:text-xl z-20">
        <div className="col-span-1">
          <img src="UNY.png" className="h-10 md:h-12 object-contain" alt="UNY Logo" />
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span>Mavis Sengkuni - Universitas Negeri Yogyakarta</span>
          <div className="mt-1">
            <select
              value={selectedLintasan}
              onChange={(e) => setSelectedLintasan(e.target.value)}
              className="bg-[#081380] text-white rounded px-3 py-0.5 focus:outline-none focus:border-cyan-400 cursor-pointer text-center hover:bg-[#0a1a6b] transition-colors"
            >
              <option value="A">Lintasan A</option>
              <option value="B">Lintasan B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ombak */}
      <div className="absolute top-16 md:top-20 left-0 w-full h-40 pointer-events-none">
        <div className="absolute bottom-20 w-full z-10 transform rotate-180">
          <Ombak1 />
        </div>
        <div className="absolute bottom-20 w-full z-0 transform rotate-180">
          <Ombak2 />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 p-3 md:p-4 lg:p-5 overflow-hidden z-10">

        {/* Grid Kiri */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 overflow-hidden">

          {/* Kiri Atas */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Tabel */}
            <div className="col-span-1 md:col-span-5 bg-black rounded-2xl p-4 text-white">
              <details className="w-full h-full flex flex-col">

                <summary className=" hover:scale-97 cursor-pointer flex-1 flex items-center justify-center text-xl md:text-2xl font-bold tracking-wide bg-gradient-to-r from-white via-gray-200 to-white text-black rounded-md px-2 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 mr-3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                    <span>
                      {(() => {
                        if (!checkp || Object.keys(checkp).length === 0) return "Data Wahana";

                        // Checkpoint
                        if (checkp?.[1] && !checkp?.[2]) return "Kapal Melewati Checkpoint 1";
                        if (checkp?.[2] && !checkp?.[3]) return "Kapal Melewati Checkpoint 2";
                        if (checkp?.[3] && !checkp?.[4]) return "Kapal Melewati Checkpoint 3";
                        if (checkp?.[4] && !checkp?.[5]) return "Kapal Melewati Checkpoint 4";                        
                        if (checkp?.[5] && !checkp?.[6]) return "Kapal Melewati Checkpoint 5";
                        if (checkp?.[6] && !checkp?.[7]) return "Kapal Melewati Checkpoint 6";
                        if (checkp?.[7] && !checkp?.[8]) return "Kapal Melewati Checkpoint 7";
                        if (checkp?.[8] && !checkp?.[9]) return "Kapal Melewati Checkpoint 8";
                        if (checkp?.[9] && !checkp?.[10]) return "Kapal Melewati Checkpoint 9";
                        if (checkp?.[10] && !checkp?.[11]) return "Kapal Melewati Checkpoint 10";
                        if (checkp?.[11] && !checkp?.[12]) return "Kapal Melewati Checkpoint 11";
                        if (checkp?.[12] && !checkp?.[13]) return "Kapal Melewati Checkpoint 12";
                        if (checkp?.[13]) return "Kapal Berhasil Finish";
                        
                        return "Status Wahana Aktif";
                      })()}
                    </span>
                </summary>

                <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-inner overflow-y-auto max-h-[70px]">
                  <table className="border-collapse border border-gray-400 w-full text-center text-black text-sm md:text-base">
                    <thead className="pt-0 bg-gray-200">
                      <tr>
                        <th className="border">Checkpoint</th>
                        <th className="border">Timestamp</th>
                        <th className="border">LAT</th>
                        <th className="border">LONG</th>
                        <th className="border">Speed (knot)</th>
                        <th className="border">Heading</th>
                        <th className="border">COG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13].map((i) => (
                      <tr key={i}>
                        <td className="border">{i}</td>
                        <td className="border">{checkp?.[i]?.Time ?? "-"}</td>
                        <td className="border">{checkp?.[i]?.lat ? `${checkp[i].lat.toFixed(6)}`: "-"}</td>
                        <td className="border">{checkp?.[i]?.long ? `${checkp[i].long.toFixed(6)}`: "-"}</td>
                        <td className="border">{checkp?.[i]?.speed ? checkp[i].speed.toFixed(1) : "-"}</td>
                        <td className="border">{checkp?.[i]?.heading ?? "-"}</td>
                        <td className="border">{checkp?.[i]?.cog ?? "-"}</td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* Logo */}
            <div className="hidden lg:flex col-span-1 bg-white text-white rounded-2xl border-4 xl:border-10 border-black items-center justify-center p-2">
              <img src="ROCKET.png" alt="Rocket Logo"/>
            </div>
          </div>

          {/* Grid Bawah Kiri - ROWS JANGAN DIUTAK ATIK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden bg-black rounded-2xl">
            {/* Informasi Wahana */}
            <div className="col-span-1 bg-black rounded-2xl text-white p-3 md:p-4 flex flex-col min-h-[350px] ">
              {dronePos && (
                <div className="flex flex-col h-full pb-3 lg:pb-2">
                  <div className="bg-white rounded-xl px-4 py-1.5 text-black text-center font-bold text-base md:text-lg xl:text-xl mb-3 shrink-0">
                    Informasi Wahana
                  </div>

                  <div className="flex flex-col flex-1 gap-2">
                    <div className="flex flex-col flex-grow">
                      <p className="pl-4 text-xs md:text-sm font-semibold">Deskripsi</p>
                      <div className="bg-gray-800 rounded-2xl px-4 text-xs flex flex-col justify-center flex-grow">
                        <p>NAMA : Sengkuni</p>
                        <p>TEAM : Mavis</p>
                        <p>ASAL : Universitas Negeri Yogyakarta</p>
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow">
                      <p className="pl-4 text-xs md:text-sm font-semibold">Koordinat</p>
                      <div className="bg-gray-800 rounded-2xl px-4 text-xs flex flex-col justify-center flex-grow">
                        <p>LAT : {dronePos.lat.toFixed(6)}</p>
                        <p>LON : {dronePos.lon.toFixed(6)}</p>
                        <p>COG : {dronePos.cog}</p>
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow">
                      <p className="pl-4 text-xs md:text-sm font-semibold">Speed Over Ground</p>
                      <div className="bg-gray-800 rounded-2xl px-4 text-xs flex flex-col justify-center flex-grow">
                        {droneSpd && (
                          <>
                            <p>KMH : {Number(droneSpd.km).toFixed(1)}</p>
                            <p>KNOT : {Number(droneSpd.knot).toFixed(1)}</p>
                            <p>HEADING : {droneSpd.heading}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow">
                      <p className="pl-4 text-xs md:text-sm font-semibold">Timestamp</p>
                      <div className="bg-gray-800 rounded-2xl px-4 text-xs flex flex-col justify-center flex-grow ">
                        {times && (
                          <>
                            <p>DATE : {times.dt}</p>
                            <p>DAY : {times.dy ? times.dy.slice(0, 3) : ""}</p>
                            <p>TIME : {times.tm}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {/* Map */}
            <div className="col-span-1 bg-black rounded-2xl overflow-hidden h-[400px] lg:h-auto p-4">
              {dronePos ? (
                <Map
                  ref={mapRef}
                  {...viewState}
                  onMove={(evt) => setViewState(evt.viewState)}
                  onLoad={updateGrid} 
                  onMoveEnd={updateGrid} 
                  style={{ width: "100%", height: "100%", borderRadius: "1rem" }}
                  mapStyle=" cari API key dulu di maplibre atau pake yang lain "
                >
              
              {/* WAYPOINT BIRU */}
              {waypo && Object.values(waypo).length > 0 && (
                <>
                  <Source
                    id="waypointLine"
                    type="geojson"
                    data={{
                      type: "Feature",
                      geometry: {
                        type: "LineString",
                        coordinates: Object.values(waypo)
                          .filter(wp => wp?.long && wp?.lat)
                          .map(wp => [parseFloat(wp.long), parseFloat(wp.lat)]),
                      },
                    }}
                  >
                  </Source>

                {/* Marker tiap waypoint */}
                {Object.entries(waypo)
                    .filter(([_, wp]) => wp && wp.long && wp.lat)
                    .map(([key, wp], i) => {
                      const wpNum = parseInt(key); 

                      const iconMap = {
                        11: "/obj1.png",
                        12: "/obj2.png",
                        13: "/end.png",
                      };

                      const iconSrc = iconMap[wpNum] || "/Icon.png";

                      let rotation = -25; 

                      if ([1, 2, 3, 8, 9, 10].includes(wpNum)) {
                        rotation += 90;
                      }

                      if (selectedLintasan === "A") {
                        rotation += 180;
                      }

                      return (
                        <Marker
                          key={`wp-${key}`}
                          longitude={parseFloat(wp.long)}
                          latitude={parseFloat(wp.lat)}
                          anchor="bottom"
                        >
                          <div className="flex flex-col items-center">
                            <img 
                              src={iconSrc} 
                              alt={`Waypoint ${key}`}
                              style={{ 
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: 'center' 
                              }} 
                              className={`
                                object-contain drop-shadow-lg cursor-pointer transition-transform duration-300 hover:scale-125
                                ${i === 0 ? "w-10 h-10 z-20" : "w-8 h-8 opacity-90"} 
                              `}
                            />
                          </div>
                        </Marker>
                        );
              })}
              </>
              )}
                  {/* Marker Heading */}
                  {headingGeoJSON && (
                    <Source id="headingLine" type="geojson" data={headingGeoJSON}>
                      <Layer
                        id="headingLineLayer"
                        type="line"
                        paint={{
                          "line-color": "#FFD700", 
                          "line-width": 4,
                          "line-opacity": 0.8
                        }}
                      />
                    </Source>
                  )}

                  {/* Marker Garis Biru Kapal */}
                  <Marker 
                    longitude={dronePos.lon} 
                    latitude={dronePos.lat} 
                    anchor="bottom" 
                    style={{ zIndex: 1 }}                   
                  >
                    <div 
                      style={{
                        height: '60px',           
                        width: '4px',             
                        backgroundColor: '#0044FF', 
                        borderRadius: '4px',
                        transform: `rotate(${droneSpd?.heading ?? 0}deg)`, 
                        transformOrigin: 'bottom center', 
                        transition: 'transform 0.3s ease-out', 
                        boxShadow: '0px 0px 4px rgba(255,255,255,0.5)'
                      }}
                    />
                  </Marker>

                  {/* Marker Icon Kapal */}
                  {droneSpd && (
                  <Marker 
                    longitude={dronePos.lon} 
                    latitude={dronePos.lat} 
                    anchor="center" 
                    style={{ zIndex: 10 }}                   
                  >
                    <img 
                      src="/marker-icon.png" 
                      alt="Drone" 
                      style={{ 
                        width: '40px', 
                        height: 'auto',
                        transform: `rotate(${droneSpd.heading + 180}deg)`,
                        transition: "transform 0.3s ease-out" 
                      }} 
                    />
                  </Marker>
                  )}

                  {/* Jalur Ekor Merah */}
                  {path.length > 1 && (
                    <Source
                      id="dronePath"
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: path },
                      }}
                    >
                      <Layer
                        id="pathLayer"
                        type="line"
                        paint={{ "line-color": "red", "line-width": 3 }}
                      />
                    </Source>
                  )}

                  {grid && (
                    <Source id="grid" type="geojson" data={grid}>
                      <Layer
                        id="grid-layer"
                        type="line"
                        paint={{
                          "line-color": "rgba(0, 0, 0, 0.3)",
                          "line-width": 1,
                        }}
                      />
                    </Source>
                  )}
                </Map>
              ) : (
                <span className="text-gray-500 font-bold flex items-center justify-center h-full">
                  Loading Map...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grid Kanan - ati ati column SENSITIP */}
        <div className="col-span-1 grid grid-rows-8 grid-cols-1 gap-4 rounded-2xl overflow-hidden">
          {/* Livestream */}
          <div className="col-span-1 row-span-3 bg-black text-white rounded-2xl">
            <iframe
              className="w-full h-full rounded-2xl py-4"
              src=" LINK "
              title="Mission Capture Surface"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>

          {/* Capture Pic */}
          <div className="col-span-1 row-span-5 bg-black text-white rounded-2xl flex flex-col p-2 md:p-4 gap-4">
            {/* Gambar Surface */}
            <div className="flex-1 bg-black rounded-2xl text-white flex items-center justify-center overflow-hidden">
              {surpic ? (
                <img src={surpic} className="w-full h-full object-contain rounded-lg" alt="Surface Capture" />
              ) : <p>Menunggu Surface Image</p>}
            </div>
             {/* Gambar Underwater */}
            <div className="flex-1 bg-black rounded-2xl text-white flex items-center justify-center overflow-hidden">
              {undpic ? (
                <img src={undpic} className="w-full h-full object-contain rounded-lg" alt="Underwater Capture" />
              ) : <p>Menunggu Underwater Image</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}