/**
 * RHYTHM! DASHBOARD - COMPLETE FRONTEND LOGIC
 * Handles: Tabs, Player Search, Leaderboards, and Leaflet GeoJSON Map
 */

let map;

// --- 1. CORE UTILITIES ---

// Assigns Osu-style letter ranks based on accuracy
function getRank(acc) {
    if (acc >= 98) return { char: 'SS', color: 'text-yellow-400' };
    if (acc >= 95) return { char: 'S', color: 'text-pink-400' };
    if (acc >= 90) return { char: 'A', color: 'text-green-400' };
    return { char: 'B', color: 'text-blue-400' };
}

// --- 2. TAB SYSTEM ---

function switchTab(tab) {
    const isMap = tab === 'map';
    
    // Toggle Visibility
    document.getElementById('view-ranking').classList.toggle('hidden', isMap);
    document.getElementById('view-map').classList.toggle('hidden', !isMap);
    
    // Update Button Styling
    document.getElementById('btn-ranking').className = isMap ? "pb-2 text-slate-500" : "pb-2 active-tab";
    document.getElementById('btn-map').className = isMap ? "pb-2 active-tab text-cyan-400" : "pb-2 text-slate-500";

    // Initialize map only when needed
    if (isMap) initMap();
}

// --- 3. LEADERBOARDS & SEARCH ---

async function loadLeaderboards() {
    try {
        const res = await fetch('/api/leaderboards');
        const data = await res.json();

        // Render Top Players
        const playerList = document.getElementById('playerLeaderboard');
        playerList.innerHTML = data.topPlayers.map((p, i) => `
            <div class="osu-card p-4 flex justify-between items-center border-l-4 border-pink-500">
                <div class="flex items-center gap-4">
                    <span class="text-2xl font-black italic opacity-20">#${i+1}</span>
                    <span class="text-lg font-bold">${p.player}</span>
                </div>
                <span class="text-pink-400 font-black font-mono">${p.points.toLocaleString()}</span>
            </div>
        `).join('') || '<p class="opacity-50">No scores recorded yet.</p>';

        // Render Top Countries
        const countryList = document.getElementById('countryLeaderboard');
        countryList.innerHTML = data.topCountries.map((c, i) => `
            <div class="osu-card p-4 flex justify-between items-center border-l-4 border-cyan-500">
                <span class="font-bold uppercase tracking-widest text-sm">${c.country}</span>
                <span class="text-cyan-400 font-black font-mono">${c.totalPoints.toLocaleString()}</span>
            </div>
        `).join('') || '<p class="opacity-50">No country data.</p>';

    } catch (err) {
        console.error("Leaderboard load failed:", err);
    }
}

async function searchPlayer() {
    const name = document.getElementById('playerNameInput').value;
    const resultDiv = document.getElementById('playerStatsResult');
    if (!name) return;

    try {
        const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Player not found');

        const rank = getRank(data.accuracy);
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `
            <div class="bg-slate-800 p-6 rounded-2xl border-2 border-pink-500/30 relative overflow-hidden">
                <div class="absolute -right-4 -top-4 text-8xl font-black italic opacity-10 select-none">${rank.char}</div>
                <h3 class="text-3xl font-black italic uppercase">${data.player}</h3>
                <p class="text-pink-500 font-bold text-xs tracking-widest uppercase mb-4">${data.country}</p>
                <div class="flex gap-8">
                    <div>
                        <p class="text-xs uppercase text-slate-500 font-bold">Accuracy</p>
                        <p class="text-2xl font-black ${rank.color}">${data.accuracy}%</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-slate-500 font-bold">Latest Score</p>
                        <p class="text-2xl font-black">${data.points.toLocaleString()}</p>
                    </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                    ${data.recentScores.map(s => `
                        <div class="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-700 font-mono">
                            ${s.points} | ${s.accuracy}%
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (err) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<div class="p-4 text-red-400 bg-red-400/10 rounded-lg text-center font-bold uppercase">${err.message}</div>`;
    }
}

// --- 4. MAP VISUALIZATION ---

async function initMap() {
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
        return;
    }

    // Standard Leaflet Setup
    map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        minZoom: 2 
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    try {
        const statsRes = await fetch('/api/countries');
        const countryStats = await statsRes.json();
        const statsLookup = {};
        countryStats.forEach(c => statsLookup[c.country] = c);

        const geoRes = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        const geoData = await geoRes.json();

        L.geoJson(geoData, {
            style: (feature) => {
                const name = feature.properties.ADMIN;
                const iso = feature.properties.ISO_A3;
                const hasData = statsLookup[name] || statsLookup[iso];
                return {
                    fillColor: hasData ? "#f472b6" : "#1e293b",
                    weight: 1,
                    opacity: 1,
                    color: '#0f172a',
                    fillOpacity: hasData ? 0.7 : 0.2
                };
            },
            onEachFeature: (feature, layer) => {
                const name = feature.properties.ADMIN;
                const iso = feature.properties.ISO_A3;
                const data = statsLookup[name] || statsLookup[iso];
                if (data) {
                    layer.bindTooltip(`
                        <div class="bg-slate-900 text-white p-2 rounded border border-pink-500">
                            <b class="text-pink-500">${name}</b><br>
                            Points: ${data.totalPoints.toLocaleString()}
                        </div>
                    `, { sticky: true });
                }
            }
        }).addTo(map);
    } catch (err) {
        console.error("Map initialization failed:", err);
    }
}

// Start app
loadLeaderboards();
