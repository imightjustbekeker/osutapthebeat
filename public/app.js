const COUNTRY_COORDS = {
    "USA": [37.09, -95.71], "UK": [55.37, -3.43], "Japan": [36.20, 138.25],
    "Germany": [51.16, 10.45], "Brazil": [-14.23, -51.92], "Canada": [56.13, -106.34],
    "France": [46.22, 2.21], "South Korea": [35.90, 127.76], "Australia": [-25.27, 133.77],
    "China": [35.86, 104.19]
};

let map;

function getRank(acc) {
    if (acc >= 98) return { char: 'SS', color: 'text-yellow-400' };
    if (acc >= 95) return { char: 'S', color: 'text-pink-400' };
    if (acc >= 90) return { char: 'A', color: 'text-green-400' };
    return { char: 'B', color: 'text-blue-400' };
}

function switchTab(tab) {
    const isMap = tab === 'map';
    document.getElementById('view-ranking').classList.toggle('hidden', isMap);
    document.getElementById('view-map').classList.toggle('hidden', !isMap);
    
    document.getElementById('btn-ranking').className = isMap ? "pb-2 text-slate-500" : "pb-2 active-tab";
    document.getElementById('btn-map').className = isMap ? "pb-2 active-tab text-cyan-400" : "pb-2 text-slate-500";

    if (isMap) initMap();
}

async function initMap() {
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
        return;
    }

    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    const res = await fetch('/api/countries');
    const countries = await res.json();

    countries.forEach(data => {
        const coords = COUNTRY_COORDS[data.country];
        if (coords) {
            const radius = Math.min(Math.max(data.totalPoints / 2000, 8), 25);
            L.circleMarker(coords, {
                radius: radius,
                fillColor: "#22d3ee",
                color: "#fff",
                weight: 1,
                fillOpacity: 0.6,
                className: 'pulse-marker'
            }).addTo(map).bindTooltip(`<b class="text-cyan-600">${data.country}</b><br>Score: ${data.totalPoints}`, { direction: 'top' });
        }
    });
}

async function loadData() {
    const res = await fetch('/api/leaderboards');
    const data = await res.json();

    document.getElementById('playerLeaderboard').innerHTML = data.topPlayers.map((p, i) => `
        <div class="osu-card p-4 flex justify-between items-center border-l-4 border-pink-500">
            <div class="flex items-center gap-4">
                <span class="text-2xl font-black italic opacity-20">#${i+1}</span>
                <span class="text-lg font-bold">${p.player}</span>
            </div>
            <span class="text-pink-400 font-black font-mono">${p.points.toLocaleString()}</span>
        </div>
    `).join('') || '<p class="opacity-50">No data</p>';

    document.getElementById('countryLeaderboard').innerHTML = data.topCountries.map((c, i) => `
        <div class="osu-card p-4 flex justify-between items-center border-l-4 border-cyan-500">
            <span class="font-bold uppercase tracking-widest text-sm">${c.country}</span>
            <span class="text-cyan-400 font-black font-mono">${c.totalPoints.toLocaleString()}</span>
        </div>
    `).join('') || '<p class="opacity-50">No data</p>';
}

async function searchPlayer() {
    const name = document.getElementById('playerNameInput').value;
    const resultDiv = document.getElementById('playerStatsResult');
    if (!name) return;

    try {
        const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const rank = getRank(data.accuracy);
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `
            <div class="bg-slate-800 p-6 rounded-2xl border-2 border-pink-500/30 relative overflow-hidden">
                <div class="absolute -right-4 -top-4 text-8xl font-black italic opacity-10">${rank.char}</div>
                <h3 class="text-3xl font-black italic">${data.player}</h3>
                <div class="flex gap-8 mt-4">
                    <div><p class="text-xs uppercase text-slate-500">Accuracy</p><p class="text-2xl font-black ${rank.color}">${data.accuracy}%</p></div>
                    <div><p class="text-xs uppercase text-slate-500">Latest</p><p class="text-2xl font-black">${data.points.toLocaleString()}</p></div>
                </div>
            </div>
        `;
    } catch (err) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<div class="p-4 text-red-400 bg-red-400/10 rounded-lg text-center">${err.message}</div>`;
    }
}

loadData();
