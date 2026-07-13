import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMapFriends } from '../hooks/useMapFriends';
import { useTripShare } from '../hooks/useTripShare';
import { useLocationSettings } from '../hooks/useLocationSettings';
import { LocationSettingsPanel } from './LocationSettings';
import { SOSButton } from './SOSButton';
import { GhostTrail } from './GhostTrail';
import { MapFriendCard } from './MapFriendCard';
import { MapCluster } from './MapCluster';
import { TripShareModal } from './TripShareModal';
import { 
  Compass, Shield, AlertTriangle, Search, Navigation, 
  MapPin, Flame, Star, Zap, Share2, HelpCircle, LayoutList, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CustomPlace {
  id: string;
  name: string;
  type: 'home' | 'work' | 'gym' | 'other';
  lat: number;
  lng: number;
}

interface PublicEvent {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  visitors: number;
  checkedIn: boolean;
}

export function EnclaveMap() {
  const { user } = useAuth();
  const { coords, city, error, loading: geoLoading, refresh } = useGeolocation();
  const { friends, isLoading: friendsLoading, refresh: refreshFriends } = useMapFriends();
  const { activeTrip, sharedTripsWithMe } = useTripShare();
  const { settings } = useLocationSettings();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routeLineRef = useRef<L.Polyline | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'privacy' | 'places' | 'events' | 'sos'>('privacy');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [clusterFriends, setClusterFriends] = useState<any[]>([]);
  const [isTripModalOpen, setIsTripModalOpen] = useState<boolean>(false);

  // Places state
  const [myPlaces, setMyPlaces] = useState<CustomPlace[]>([
    { id: '1', name: 'My Sanctuary (Home)', type: 'home', lat: 37.7749, lng: -122.4194 },
    { id: '2', name: 'The Forge (Work)', type: 'work', lat: 37.7891, lng: -122.4014 }
  ]);
  const [newPlaceName, setNewPlaceName] = useState<string>('');
  const [newPlaceType, setNewPlaceType] = useState<'home' | 'work' | 'gym' | 'other'>('other');

  // Events / Discovery State
  const [optInDiscovery, setOptInDiscovery] = useState<boolean>(true);
  const [events, setEvents] = useState<PublicEvent[]>([
    { id: 'ev1', title: 'Zen Breathing & Tea Ceremony', location: 'Golden Gate Park Conservatory', lat: 37.7694, lng: -122.4862, visitors: 14, checkedIn: false },
    { id: 'ev2', title: 'Crypto Privacy Meetup', location: 'SOMA Hacker Garage', lat: 37.7785, lng: -122.4056, visitors: 28, checkedIn: false },
    { id: 'ev3', title: 'Decentralized Music Jam', location: 'Mission District Plaza', lat: 37.7599, lng: -122.4148, visitors: 9, checkedIn: false }
  ]);

  // Handle Event check-in
  const handleEventCheckIn = (eventId: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const isCheckingIn = !ev.checkedIn;
        // Broadcast check-in system message
        if (isCheckingIn && user) {
          const systemMsgRef = doc(db, 'system_notifications', `checkin_${Date.now()}`);
          setDoc(systemMsgRef, {
            text: `${user.displayName || 'A node'} checked into public event: ${ev.title}! 📍`,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        return { ...ev, checkedIn: isCheckingIn, visitors: isCheckingIn ? ev.visitors + 1 : ev.visitors - 1 };
      }
      return ev;
    }));
  };

  // Recenter map utilities
  const handleRecenter = () => {
    if (mapRef.current && coords) {
      mapRef.current.setView([coords.lat, coords.lng], 14);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  // Add custom private place
  const handleAddPlace = () => {
    if (!newPlaceName || !coords) return;
    const newPlace: CustomPlace = {
      id: `p_${Date.now()}`,
      name: newPlaceName,
      type: newPlaceType,
      lat: coords.lat + (Math.random() - 0.5) * 0.005, // offset slightly
      lng: coords.lng + (Math.random() - 0.5) * 0.005
    };
    setMyPlaces([...myPlaces, newPlace]);
    setNewPlaceName('');
  };

  // Delete private place
  const handleDeletePlace = (id: string) => {
    setMyPlaces(myPlaces.filter(p => p.id !== id));
  };

  // 1. Initialize map container
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default start coords (San Francisco coordinates fallback)
    const initialLat = coords?.lat || 37.7749;
    const initialLng = coords?.lng || -122.4194;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 13);

    // Apply CartoDB Dark Matter tile layers
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Render self location ring and markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old self marker if it exists
    if (markersRef.current['self']) {
      markersRef.current['self'].remove();
      delete markersRef.current['self'];
    }

    if (coords) {
      // Custom self HTML divIcon based on sharing status
      const isGhost = settings.mode === 'ghost';
      const selfHtml = isGhost
        ? `<div class="relative flex items-center justify-center">
             <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-zinc-600 border-2 border-zinc-950 shadow-md"></span>
           </div>`
        : `<div class="relative flex items-center justify-center">
             <span class="absolute inline-flex h-5 w-5 rounded-full bg-blue-500/60 animate-ping"></span>
             <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-zinc-950 shadow-md"></span>
           </div>`;

      const selfIcon = L.divIcon({
        className: 'custom-self-marker-div',
        html: selfHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const selfMarker = L.marker([coords.lat, coords.lng], { icon: selfIcon })
        .addTo(map)
        .bindTooltip("You are here", { permanent: false, direction: "top" });

      markersRef.current['self'] = selfMarker;
    }
  }, [coords, settings.mode]);

  // 3. Render friend markers with clustering
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear previous friend markers
    Object.keys(markersRef.current).forEach((key) => {
      if (key !== 'self') {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    const filteredFriends = friends.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Dynamic simple clustering
    // Group friends who are extremely close (< 300m)
    const grouped: { [key: string]: any[] } = {};
    const processedUids = new Set<string>();

    filteredFriends.forEach((friend) => {
      if (processedUids.has(friend.userId)) return;

      const cluster = [friend];
      processedUids.add(friend.userId);

      filteredFriends.forEach((other) => {
        if (processedUids.has(other.userId)) return;
        const dist = L.latLng(friend.lat, friend.lng).distanceTo(L.latLng(other.lat, other.lng));
        if (dist < 400) { // meters
          cluster.push(other);
          processedUids.add(other.userId);
        }
      });

      grouped[friend.userId] = cluster;
    });

    // Draw cluster/individual markers
    Object.entries(grouped).forEach(([leadUid, cluster]) => {
      const leader = cluster[0];

      if (cluster.length > 1) {
        // Multi-friend Cluster Marker
        const clusterIcon = L.divIcon({
          className: 'custom-cluster-marker-div',
          html: `<div class="relative flex items-center justify-center w-11 h-11 bg-amber-500 text-zinc-950 font-mono font-bold text-xs rounded-full border-2 border-zinc-950 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition-all">
                   +${cluster.length}
                   <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zinc-950 border border-amber-500 rounded-full flex items-center justify-center text-[7px] text-amber-500">★</span>
                 </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const clusterMarker = L.marker([leader.lat, leader.lng], { icon: clusterIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedFriend(null);
            setClusterFriends(cluster);
          });

        markersRef.current[`cluster_${leadUid}`] = clusterMarker;
      } else {
        // Single Friend Marker
        const friendIcon = L.divIcon({
          className: 'custom-friend-marker-div',
          html: `<div class="relative w-10 h-10 cursor-pointer transform hover:scale-105 active:scale-95 transition-all">
                   <img src="${leader.avatar}" class="w-10 h-10 rounded-full border-2 border-amber-500 shadow-xl object-cover" referrerpolicy="no-referrer" />
                   ${leader.storyAvailable ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-zinc-950 flex items-center justify-center text-[7px] font-bold text-zinc-950 animate-pulse">★</span>' : ''}
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const friendMarker = L.marker([leader.lat, leader.lng], { icon: friendIcon })
          .addTo(map)
          .on('click', () => {
            setClusterFriends([]);
            setSelectedFriend(leader);
          });

        markersRef.current[leader.userId] = friendMarker;
      }
    });
  }, [friends, searchQuery]);

  // 4. Render active trip share route polyline
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old polyline if any
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (activeTrip && activeTrip.route && activeTrip.route.length > 1) {
      const pathPoints = activeTrip.route.map((p: any) => [p.lat, p.lng] as L.LatLngExpression);
      
      const polyline = L.polyline(pathPoints, {
        color: '#f59e0b', // amber-500
        weight: 4,
        opacity: 0.8,
        dashArray: '5, 10'
      }).addTo(map);

      routeLineRef.current = polyline;
    }
  }, [activeTrip]);

  return (
    <div id="enclave-map-screen-root" className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative font-sans">
      
      {/* Sidebar (Left / Control Room Panel) */}
      <div id="map-control-sidebar" className="w-80 border-r border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 z-50">
        {/* App Bar Brand Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/10">
              <Compass className="animate-pulse" size={18} />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Enclave Map</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Privacy Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsTripModalOpen(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-850 text-amber-500 hover:text-amber-400 border border-zinc-800 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="Secure Trip Share"
            style={{ borderStyle: 'solid' }}
          >
            <Share2 size={15} />
          </button>
        </div>

        {/* Dynamic Search Bar */}
        <div className="p-3 border-b border-zinc-800/60 bg-zinc-950">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts on map..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800/80 text-xs rounded-xl py-2.5 pl-8.5 pr-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all font-mono"
            />
            <Search size={14} className="text-zinc-600 absolute left-3 top-3.2" />
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-zinc-800/40 text-[9px] font-mono uppercase font-bold tracking-widest">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              activeTab === 'privacy' ? 'text-amber-500 border-b border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={{ borderStyle: 'solid' }}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              activeTab === 'places' ? 'text-amber-500 border-b border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={{ borderStyle: 'solid' }}
          >
            Places
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              activeTab === 'events' ? 'text-amber-500 border-b border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={{ borderStyle: 'solid' }}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              activeTab === 'sos' ? 'text-red-500 border-b border-red-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={{ borderStyle: 'solid' }}
          >
            SOS
          </button>
        </div>

        {/* Tab Body Viewports */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {activeTab === 'privacy' && (
            <>
              <LocationSettingsPanel />
              <GhostTrail />
            </>
          )}

          {activeTab === 'sos' && (
            <SOSButton />
          )}

          {activeTab === 'places' && (
            <div className="space-y-4">
              {/* Private Frequent Places */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3 shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                  My Places (Private to Me)
                </span>
                
                {/* Form to add private place */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New private place name..."
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 text-xs rounded-xl p-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newPlaceType}
                      onChange={(e: any) => setNewPlaceType(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-850 text-xs rounded-xl p-2 font-mono text-zinc-300"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="gym">Gym</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      onClick={handleAddPlace}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-bold uppercase rounded-xl cursor-pointer"
                      style={{ border: 'none' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* List of Private Places */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {myPlaces.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="text-xs font-medium text-zinc-300">{p.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePlace(p.id)}
                        className="text-zinc-600 hover:text-red-400 text-[10px] uppercase font-mono cursor-pointer"
                        style={{ border: 'none' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anonymized Clusters Hotspots */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2">
                  <Flame className="text-amber-500" size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Contact Hotspots (Anonymized)
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Aggregate popularity mapping. No individual user locations are stored or traceable.
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-zinc-300">Mission District Cafés</div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">Popularity: High</span>
                    </div>
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full">
                      8+ friends
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-zinc-300">SOMA Technology District</div>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">Popularity: Moderate</span>
                    </div>
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full">
                      5+ friends
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                    Public Event Discovery
                  </span>
                  <button
                    onClick={() => setOptInDiscovery(!optInDiscovery)}
                    className={`px-2 py-1 rounded text-[9px] font-mono uppercase ${
                      optInDiscovery ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                    style={{ borderStyle: 'solid' }}
                  >
                    {optInDiscovery ? 'Opt-In' : 'Opt-Out'}
                  </button>
                </div>

                {optInDiscovery ? (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                    {events.map(ev => (
                      <div key={ev.id} className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-900 flex flex-col gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{ev.title}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono mt-1 block flex items-center gap-1">
                            <MapPin size={10} /> {ev.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-900">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            🔥 {ev.visitors} attending
                          </span>
                          <button
                            onClick={() => handleEventCheckIn(ev.id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-bold cursor-pointer transition-all duration-150 ${
                              ev.checkedIn
                                ? 'bg-emerald-600 text-zinc-950 hover:bg-emerald-500'
                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 border border-zinc-800'
                            }`}
                            style={{ borderStyle: ev.checkedIn ? 'none' : 'solid' }}
                          >
                            {ev.checkedIn ? "Checked In ✓" : "Check In"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic text-center p-4">
                    Opt-in to event discovery to inspect localized secure gather spots near you.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container Viewport */}
      <div id="map-parent-container" className="flex-1 relative h-full bg-zinc-950">
        
        {/* Actual Leaflet Map Hook */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Loading Overlay */}
        {(geoLoading || friendsLoading) && (
          <div className="absolute top-4 left-4 z-50 bg-zinc-950/90 border border-zinc-800 backdrop-blur-md px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-mono text-[10px] text-amber-500 animate-pulse">
            <Compass className="animate-spin" size={14} />
            RETRIEVING ENCLAVE TELEMETRY...
          </div>
        )}

        {/* Privacy Shield Guard Indicator (Top Banner) */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {settings.mode === 'ghost' ? (
            <div className="bg-zinc-950/90 border border-zinc-800/80 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                Ghost Mode Invisible
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/90 border border-amber-500/30 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="text-[11px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                Live Broadcast Active
              </div>
            </div>
          )}
        </div>

        {/* Floating Custom Map Control Deck (Recenter, Zoom, Trip Share) */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
          
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer font-bold text-lg"
            style={{ borderStyle: 'solid' }}
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer font-bold text-lg"
            style={{ borderStyle: 'solid' }}
          >
            -
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-amber-500 hover:text-amber-400 flex items-center justify-center shadow-lg transition-all cursor-pointer"
            style={{ borderStyle: 'solid' }}
          >
            <Navigation size={18} className="rotate-45" />
          </button>
        </div>

        {/* Tapped Marker Popups */}
        <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-3">
          {selectedFriend && (
            <MapFriendCard
              friend={selectedFriend}
              onClose={() => setSelectedFriend(null)}
            />
          )}

          {clusterFriends.length > 0 && (
            <MapCluster
              friends={clusterFriends}
              onSelectFriend={(friend) => {
                setClusterFriends([]);
                setSelectedFriend(friend);
              }}
              onClose={() => setClusterFriends([])}
            />
          )}
        </div>
      </div>

      {/* Trip Share Launch Modal */}
      <TripShareModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />
    </div>
  );
}
export default EnclaveMap;
