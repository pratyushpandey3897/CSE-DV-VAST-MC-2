(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const height = 500, width = 600;

        const svg = d3.select('#map-svg-traffic')
            .attr("width", width)
            .attr("height", height);


        fetch("/patternsOfLife/map")
            .then(response => response.json())
            .then(features => {

                var color = d3.scaleOrdinal()
                    .domain(['Restaurant', 'Pub', 'School', 'Apartment'])
                    .range(['red', 'orange', 'blue', 'gray']);

                const projection = d3.geoIdentity()
                    .fitSize([width - 60, height - 60], { type: "FeatureCollection", features: features })
                    .reflectY(true)
                    .translate([width / 2 + 30, height - 20]);

                const path = d3.geoPath().projection(projection);

                svg.selectAll("path.map")
                    .data(features)
                    .enter()
                    .append("path")
                    .attr("class", "map")
                    .attr("d", path)
                    .attr("id", d => d.properties.buildingId)
                    .style("fill", "none")
                    .style("stroke", d => color(d.properties.buildingType));
            })
    })
})();