(function () {
    document.addEventListener("DOMContentLoaded", () => {

        const height = 500, width = 600;

        const svg = d3.select('#map-svg-traffic')
            .attr("width", width)
            .attr("height", height);


        fetch("/patternsOfLife/map")
            .then(response => response.json())
            .then(features => {

                console.log(new Set(features.map(f => f.properties.buildingType)));

                var color = d3.scaleOrdinal()
                    .domain(['Restaurant', 'Pub', 'School', 'Apartment'])
                    .range(['red', 'orange', 'blue', 'green']);

                const projection = d3.geoIdentity()
                    .fitSize([width - 60, height - 40], { type: "FeatureCollection", features: features })
                    .reflectY(true)
                    .translate([width / 2 + 30, height - 20]);

                const path = d3.geoPath().projection(projection);

                svg.selectAll("path")
                    .data(features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("id", d => d.properties.buildingId)
                    .style("fill", "none")
                    .style("stroke", d => color(d.properties.buildingType));
            })
            .catch(error => console.error("Error fetching data:", error));
    });
})();