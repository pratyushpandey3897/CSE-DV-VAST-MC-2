(function () {

    const height = 500, width = 600;
    const year = 2022, month = "June", day = "Monday", timeOfDay = "Morning";
    let svg, cityMap = {},  commutes = {};

    document.addEventListener("DOMContentLoaded", async () => {

        svg = d3.select('#map-svg-traffic')
            .attr("width", width)
            .attr("height", height);

        cityMap = await fetch("/patternsOfLife/map")
            .then(res => res.json());

        commutes = await fetch(`/patternsOfLife/locations/${year}/${month}/${day}/${timeOfDay}`)
            .then(res => res.json());

        drawBaseMap(cityMap);
        overlapHeatMap(commutes);
    });

    function overlapHeatMap(features) {

        const projection = d3.geoIdentity()
            .fitSize([width - 60, height - 60], { type: "FeatureCollection", features: features })
            .reflectY(true)
            .translate([width / 2 + 30, height - 20]);

        screenCoordinates = [];
        features.forEach(item => {
            screenCoordinates.push([...projection(item.geometry.coordinates), item.properties.totalCommutes]);
        });

        let densityData = d3.contourDensity()
            .x((d) => d[0])
            .y((d) => d[1])
            .weight((d) => d[2])
            .size([width - 60, height - 60])
            .bandwidth(10)(screenCoordinates);

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

    }

    function drawBaseMap(features) {

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
            .style("fill", "none")
            .style("stroke", d => color(d.properties.buildingType));

        features.forEach(item => {
            console.log(item.geometry.coordinates[0][0]);
            item.properties.projectedCoords = projection(item.geometry.coordinates[0][0])
        });

        svg.on("mousemove", function (event, d) {

            const [x, y] = d3.pointer(event);   
            let minDist = Infinity;
            const nearest = d3.least(features, function (d) {
                if (d.properties.buildingType === 'Apartment')
                    return Infinity;
                const dist = Math.sqrt((x - d.properties.projectedCoords[0]) ** 2 + (y - d.properties.projectedCoords[1]) ** 2);
                minDist = Math.min(minDist, dist);
                return dist;
            });

            console.log("minDist: " + minDist);
            if (nearest && minDist < 100) {
                d3.select("#building-tooltip")
                    .style("opacity", 0.8)
                    .style("left", nearest.properties.projectedCoords[0] + 10 + "px")
                    .style("top", nearest.properties.projectedCoords[1] + 10 + "px")
                    .html(`Id: ${nearest.properties.buildingId}<br>Type: ${nearest.properties.buildingType}`);
            } else {
                d3.select("#building-tooltip")
                    .style("opacity", 0);
            }
        });
    }
})();