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

                fetch("/patternsOfLife/locations/2022/06/1/Evening")
                    .then(response => response.json())
                    .then(features => {

                        const projection = d3.geoIdentity()
                            .fitSize([width - 60, height - 60], { type: "FeatureCollection", features: features })
                            .reflectY(true)
                            .translate([width / 2 + 30, height - 20]);

                        screenCoordinates = []
                        features.forEach(item => {
                            screenCoordinates.push(projection(item.geometry.coordinates));
                        });

                        let densityData = d3.contourDensity()
                            .x(function (d) { return d[0]; })
                            .y(function (d) { return d[1]; })
                            .size([width - 60, height - 60])
                            .bandwidth(10)
                            (screenCoordinates);

                        let densityExtent = d3.extent(densityData, d => d.value);

                        let color = d3.scaleLinear()
                            .domain(densityExtent)
                            .range([`rgba(0, 0, 255, 0.05)`, `rgba(255, 0, 0, 0.3)`, `rgba(255, 0, 0, 0.6)`]);

                        svg.selectAll("path.contour")
                            .data(densityData)
                            .enter().append("path")
                            .attr("class", "contour")
                            .attr("d", d3.geoPath())
                            .attr("fill", function (d) { return color(d.value); });

                    })
                    .catch(error => console.error("Error fetching data:", error));

            })
            .catch(error => console.error("Error fetching data:", error));
    });
})();