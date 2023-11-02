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
                    .range(['red', 'orange', 'blue', 'green']);

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
                    .style("fill", d => color(d.properties.buildingType))
                    .style("stroke", d => color(d.properties.buildingType));

                
            })
            .catch(error => console.error("Error fetching data:", error));

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
                    .x(function(d) { return d[0]; })
                    .y(function(d) { return d[1]; })
                    .size([width - 60, height - 60])
                    .bandwidth(20)
                    (screenCoordinates);

                let densityExtent = d3.extent(densityData, d => d.value);

                let color = d3.scaleLinear()
                .domain(densityExtent)
                .range([`rgba(255, 0, 0, 0)`, `rgba(255, 0, 0, 0.2)`]);

                svg.selectAll("path.contour")
                    .data(densityData)
                    .enter().append("path")
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())
                    .attr("fill", function(d) { return color(d.value);});
                
            })
            .catch(error => console.error("Error fetching data:", error));
    });
})();