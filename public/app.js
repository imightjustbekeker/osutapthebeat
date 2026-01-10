// public/app.js

// Ensure React and ReactDOM are available globally if not using a build step
const { useState, useEffect, createElement, lazy, Suspense } = React;
const ReactDOM = window.ReactDOM;

// Function to get "Rank" based on accuracy
function getRank(acc) {
    if (acc >= 98) return { char: 'SS', color: 'text-yellow-400' };
    if (acc >= 95) return { char: 'S', color: 'text-pink-400' };
    if (acc >= 90) return { char: 'A', color: 'text-green-400' };
    if (acc >= 80) return { char: 'B', color: 'text-blue-400' };
    return { char: 'C', color: 'text-slate-400' };
}

// Global state for country stats to pass to the map
let globalCountryStats = {}; // Will be populated by loadLeaderboards

// --- React Root Component ---
const App = () => {
    const [activeTab, setActiveTab] = useState("leaderboard");
    const [playerLeaderboardHtml, setPlayerLeaderboardHtml] = useState('<p class="text-slate-500 italic">Loading...</p>');
    const [countryLeaderboardHtml, setCountryLeaderboardHtml] = useState('<p class="text-slate-500 italic">Loading...</p>');
    const [playerSearchResultHtml, setPlayerSearchResultHtml] = useState('');
    const [showPlayerSearchResult, setShowPlayerSearchResult] = useState(false);

    // Lazy load the MapComponent
    const LazyMapComponent = lazy(() => {
        // This function will fetch the script and return a Promise that resolves with the component
        return new Promise((resolve) => {
            if (window.MapComponent) {
                resolve({ default: window.MapComponent });
                return;
            }
            const script = document.createElement('script');
            script.src = '/MapComponent.js';
            script.onload = () => resolve({ default: window.MapComponent });
            document.body.appendChild(script);
        });
    });

    useEffect(() => {
        loadLeaderboards();
    }, []);

    async function loadLeaderboards() {
        try {
            const response = await fetch('/api/leaderboards');
            const data = await response.json();

            // Populate globalCountryStats for the map
            globalCountryStats = {};
            data.topCountries.forEach(c => {
                // Map ISO A3 code if available, otherwise use full name. This needs manual mapping if your API doesn't provide ISO.
                // For this example, we'll assume country name can be mapped to ISO_A3 or you'd fetch /api/countries
                // For a real solution, enhance /api/countries to return ISO_A3
                const isoMapping = { "USA": "USA", "JPN": "JPN", "KOR": "KOR", "CAN": "CAN", "BRA": "BRA", "GBR": "GBR", "DEU": "DEU", "FRA": "FRA", "AUS": "AUS", "CHN": "CHN", /* ... more mappings */ };
                const iso = isoMapping[c.country] || c.country; // Fallback to country name if no ISO mapping
                globalCountryStats[iso] = c;
            });

            // Render Players
            setPlayerLeaderboardHtml(data.topPlayers.length ? data.topPlayers.map((p, i) => `
                <div class="osu-card glass p-4 flex justify-between items-center neon-border-pink">
                    <div class="flex items-center space-x-4">
                        <span class="osu-rank text-3xl font-black italic text-slate-700">#${i + 1}</span>
                        <span class="text-xl font-bold">${p.player}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-pink-400 font-black text-xl">${p.points.toLocaleString()}</div>
                        <div class="text-xs uppercase text-slate-500 font-bold">Total Score</div>
                    </div>
                </div>
            `).join('') : '<p>No rankings yet.</p>');

            // Render Countries
            setCountryLeaderboardHtml(data.topCountries.length ? data.topCountries.map((c, i) => `
                <div class="osu-card glass p-4 flex justify-between items-center neon-border-cyan">
                    <div class="flex items-center space-x-4">
                        <span class="osu-rank text-3xl font-black italic text-slate-700">#${i + 1}</span>
                        <span class="text-xl font-bold uppercase tracking-widest">${c.country}</span>
                    </div>
                    <div class="text-cyan-400 font-black text-xl">${c.totalPoints.toLocaleString()}</div>
                </div>
            `).join('') : '<p>No country data.</p>');

        } catch (err) {
            console.error("Failed to load leaderboards", err);
            setPlayerLeaderboardHtml('<p class="text-red-400">Failed to load players.</p>');
            setCountryLeaderboardHtml('<p class="text-red-400">Failed to load countries.</p>');
        }
    }

    async function searchPlayer() {
        const name = document.getElementById('playerNameInput').value;
        if (!name) return;

        try {
            const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
            if (!res.ok) throw new Error('Player not found');
            const data = await res.json();
            
            const rank = getRank(data.accuracy);
            
            setPlayerSearchResultHtml(`
                <div class="glass p-8 rounded-3xl border-2 border-pink-500/30 relative overflow-hidden">
                    <div class="absolute top-0 right-0 text-9xl font-black italic opacity-10 select-none">${rank.char}</div>
                    
                    <div class="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div class="text-center md:text-left">
                            <h3 class="text-5xl font-black italic uppercase">${data.player}</h3>
                            <p class="text-pink-500 font-bold tracking-widest uppercase">Region: ${data.country}</p>
                        </div>

                        <div class="flex gap-12 text-center">
                            <div>
                                <div class="text-4xl font-black ${rank.color}">${data.accuracy}%</div>
                                <div class="text-xs uppercase font-bold text-slate-500">Accuracy</div>
                            </div>
                            <div>
                                <div class="text-4xl font-black text-white">${data.points.toLocaleString()}</div>
                                <div class="text-xs uppercase font-bold text-slate-500">Latest Score</div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8">
                        <div class="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest">Recent Performance History</div>
                        <div class="flex flex-wrap gap-2">
                            ${data.recentScores.map(s => `
                                <div class="bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                                    <span class="font-bold text-pink-400">${s.points}</span>
                                    <span class="text-xs text-slate-500 ml-2">${s.accuracy}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `);
            setShowPlayerSearchResult(true);
        } catch (err) {
            setPlayerSearchResultHtml(`<div class="glass p-4 text-center text-red-400 font-bold uppercase">Error: ${err.message}</div>`);
            setShowPlayerSearchResult(true);
        }
    }

    return createElement('div', { className: "max-w-5xl mx-auto px-4 py-12" },
        // Header
        createElement('header', { className: "flex flex-col items-center mb-16 space-y-4" },
            createElement('div', { className: "w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(244,114,182,0.4)] border-8 border-white animate-pulse" },
                createElement('span', { className: "text-6xl font-black italic" }, "!")
            ),
            createElement('h1', { className: "text-5xl font-black italic tracking-tighter" }, "RHYTHM", createElement('span', { className: "text-pink-500" }, "STATS"))
        ),

        // Player Search
        createElement('div', { className: "flex justify-center mb-12" },
            createElement('div', { className: "glass p-2 rounded-full flex w-full max-w-xl border-2 border-slate-700 focus-within:border-pink-500 transition-all" },
                createElement('input', { id: "playerNameInput", type: "text", placeholder: "Search Player...", className: "bg-transparent border-none px-6 py-2 w-full focus:outline-none text-xl" }),
                createElement('button', { onClick: searchPlayer, className: "bg-pink-500 hover:bg-pink-400 px-8 py-2 rounded-full font-bold uppercase tracking-widest transition" }, "GO")
            )
        ),
        showPlayerSearchResult && createElement('div', { id: "playerStatsResult", className: "mb-12", dangerouslySetInnerHTML: { __html: playerSearchResultHtml } }),

        // Tabs
        createElement('div', { className: "flex space-x-4 border-b border-slate-700 mb-8" },
            createElement('button', {
                onClick: () => setActiveTab("leaderboard"),
                className: `pb-3 px-6 text-lg font-bold transition-colors ${activeTab === "leaderboard" ? "border-b-4 border-pink-500 text-pink-400" : "text-slate-400 hover:text-white"}`
            }, "Leaderboard"),
            createElement('button', {
                onClick: () => setActiveTab("world-map"),
                className: `pb-3 px-6 text-lg font-bold transition-colors ${activeTab === "world-map" ? "border-b-4 border-cyan-500 text-cyan-400" : "text-slate-400 hover:text-white"}`
            }, "World Map")
        ),

        // Tab Content
        activeTab === "leaderboard" ? (
            createElement('div', { className: "grid md:grid-cols-2 gap-12" },
                createElement('div', null,
                    createElement('h2', { className: "text-2xl font-black italic mb-6 uppercase tracking-wider flex items-center" },
                        createElement('span', { className: "w-2 h-8 bg-pink-500 mr-3" }), "Global Ranking"
                    ),
                    createElement('div', { id: "playerLeaderboard", className: "space-y-4", dangerouslySetInnerHTML: { __html: playerLeaderboardHtml } })
                ),
                createElement('div', null,
                    createElement('h2', { className: "text-2xl font-black italic mb-6 uppercase tracking-wider flex items-center" },
                        createElement('span', { className: "w-2 h-8 bg-cyan-500 mr-3" }), "Country Standings"
                    ),
                    createElement('div', { id: "countryLeaderboard", className: "space-y-4", dangerouslySetInnerHTML: { __html: countryLeaderboardHtml } })
                )
            )
        ) : (
            createElement('div', { className: "glass p-8 rounded-3xl border-2 border-cyan-500/30 relative overflow-hidden" },
                createElement('h2', { className: "text-3xl font-black
