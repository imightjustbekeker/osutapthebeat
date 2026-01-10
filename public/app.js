// Function to get "Rank" based on accuracy
function getRank(acc) {
    if (acc >= 98) return { char: 'SS', color: 'text-yellow-400' };
    if (acc >= 95) return { char: 'S', color: 'text-pink-400' };
    if (acc >= 90) return { char: 'A', color: 'text-green-400' };
    if (acc >= 80) return { char: 'B', color: 'text-blue-400' };
    return { char: 'C', color: 'text-slate-400' };
}

async function loadLeaderboards() {
    try {
        const response = await fetch('/api/leaderboards');
        const data = await response.json();

        // Render Players
        const playerList = document.getElementById('playerLeaderboard');
        playerList.innerHTML = data.topPlayers.map((p, i) => `
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
        `).join('') || '<p>No rankings yet.</p>';

        // Render Countries
        const countryList = document.getElementById('countryLeaderboard');
        countryList.innerHTML = data.topCountries.map((c, i) => `
            <div class="osu-card glass p-4 flex justify-between items-center neon-border-cyan">
                <div class="flex items-center space-x-4">
                    <span class="osu-rank text-3xl font-black italic text-slate-700">#${i + 1}</span>
                    <span class="text-xl font-bold uppercase tracking-widest">${c.country}</span>
                </div>
                <div class="text-cyan-400 font-black text-xl">${c.totalPoints.toLocaleString()}</div>
            </div>
        `).join('') || '<p>No country data.</p>';

    } catch (err) {
        console.error("Fetch error:", err);
    }
}

async function searchPlayer() {
    const name = document.getElementById('playerNameInput').value;
    const resultDiv = document.getElementById('playerStatsResult');
    if (!name) return;

    try {
        const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error('Player not found');
        const data = await res.json();
        
        const rank = getRank(data.accuracy);
        
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `
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
        `;
    } catch (err) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<div class="glass p-4 text-center text-red-400 font-bold uppercase">${err.message}</div>`;
    }
}

loadLeaderboards();
