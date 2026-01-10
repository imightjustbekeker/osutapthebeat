// public/MapComponent.js
// This file will be loaded dynamically
(function() {
    const { ComposableMap, Geographies, Geography } = ReactSimpleMaps;
    const { useState, useEffect } = React;
    const chroma = window.chroma; // Access chroma-js from global scope if not bundled

    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

    // Define a color scale from light blue to dark blue for the heatmap
    // Adjust colors to fit your theme
    const colorScale = chroma.scale(['#1e293b', '#22d3ee']).domain([0, 10000]); // Example: 0 points to 10000 points

    const MapComponent = ({ countryStats }) => {
        // Find the max points to normalize the color scale
        const maxPoints = Math.max(...Object.values(countryStats).map(c => c.totalPoints), 1); // Avoid division by zero
        colorScale.domain([0, maxPoints]);

        return (
            <div className="border border-slate-700 rounded-lg bg-slate-900 overflow-hidden shadow-lg">
                <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const iso = geo.properties.ISO_A3;
                                const countryData = countryStats[iso];
                                const fill = countryData ? colorScale(countryData.totalPoints).hex() : "#1e293b"; // Default dark for no data
                                
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fill}
                                        stroke="#0f172a"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { 
                                                fill: countryData ? chroma(fill).brighten(1).hex() : "#334155", // Brighter on hover
                                                outline: "none", 
                                                cursor: "pointer" 
                                            },
                                            pressed: { outline: "none" },
                                        }}
                                        // Tooltip data can be set here if using a tooltip library
                                        data-tip={countryData ? `${geo.properties.NAME}: ${countryData.totalPoints.toLocaleString()} pts` : `${geo.properties.NAME}: No Data`}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>
            </div>
        );
    };

    // Make it available globally for the main app.js to load
    window.MapComponent = MapComponent;
})();
