(function () {

    const height = 500, width = 600;
    let svg, cityMap = {}, commutes = {};

    document.addEventListener("RenderHeatmap", async () => {

        cityMap = await fetch("/patternsOfLife/map")
            .then(res => res.json());

        commutes = await fetch(`/patternsOfLife/locations/2022/${selectedMonth}/${selectedDay}/${selectedTimeOfDay}`)
            .then(res => res.json());

        svg = d3.select('#map-svg-traffic')
            .attr("width", width)
            .attr("height", height);


        svg.selectAll("*").remove();

        drawBaseMap(cityMap);

        overlapHeatMap(commutes);
    });

    async function drawBaseMap(features) {

        var color = d3.scaleOrdinal()
            .domain(['Restaurant', 'Pub', 'School', 'Apartment'])
            .range(['red', 'orange', 'blue', 'gray']);

        const projection = d3.geoIdentity()
            .fitSize([width - 60, height - 60], { type: "FeatureCollection", features: features })
            .reflectY(true)
            .translate([width / 2 + 30, height - 20]);

        const path = d3.geoPath().projection(projection);

        svg.selectAll("path.building")
            .data(features)
            .enter()
            .append("path")
            .attr("id", d => "building-" + d.properties.buildingId)
            .attr("class", "building")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", d => color(d.properties.buildingType));

        features.map(item => {
            const [x, y] = projection(item.geometry.coordinates[0][0]);
            item.properties.x = x;
            item.properties.y = y;
        });

        const commercialLocations = features.filter(item => item.properties.buildingType !== 'Apartment');
        const delaunay = d3.Delaunay.from(commercialLocations, d => d.properties.x, d => d.properties.y);
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // add a mouseover action on the voronoi triangles to fill the building hovered over
        svg.selectAll("path.voronoi")
            .data(commercialLocations)
            .enter().append("path")
            .attr("class", "voronoi")
            .attr("d", (d, i) => voronoi.renderCell(i))
            .attr("fill", "none");

        // add a gradient to use for the arrow strokes
        svg.append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll("stop")
            .data([
                { offset: "0%", color: "black" },
                { offset: "50%", color: "red" },
                { offset: "100%", color: "yellow" },
            ])
            .enter().append("stop")
            .attr("offset", function (d) { return d.offset; })
            .attr("stop-color", function (d) { return d.color; });

        svg.on("mouseover", function (e) {

            svg.selectAll("path.building")
                .style("fill", "none");

            d3.select("#building-tooltip")
                .style("visibility", "hidden");

            const [x, y] = d3.pointer(e);
            const index = delaunay.find(x, y);
            const location = commercialLocations[index];

            if (location) {

                svg.select("path#building-" + location.properties.buildingId)
                    .style("fill", color(location.properties.buildingType));

                d3.select("#building-tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px")
                    .style("visibility", "visible")
                    .html(location.properties.buildingType + " (" + location.properties.buildingId + ")");
            }
        });

        svg.on("click", function (e) {

            d3.select("#building-tooltip").style("visibility", "hidden");
            svg.selectAll("path.building").style("fill", "none");
            svg.selectAll("g.arrow").remove();
            svg.selectAll(".drop-pin").remove();

            const [x, y] = d3.pointer(e);
            const index = delaunay.find(x, y);
            const endLocation = commercialLocations[index];

            fetch(`/patternsOfLife/startLocationsByEndLocationId/2022/${selectedMonth}/${selectedDay}/${selectedTimeOfDay}/${endLocation.properties.buildingId}`)
                .then(res => res.json())
                .then(data => {
                    data.forEach(startLocation => {

                        const startCoords = projection(startLocation.geometry.coordinates);
                        const endCoords = projection(endLocation.geometry.coordinates[0][0]);
                        const [x1, y1] = startCoords;
                        const [x2, y2] = endCoords;

                        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

                        const arrow = svg.append("g")
                            .attr("class", "arrow")
                            .attr("transform", `translate(${x1}, ${y1}) rotate(${angle})`);

                        const curve = d3.line().curve(d3.curveNatural);
                        arrow.append('path')
                            .attr('d', curve([[0, 0], [length / 2, (Math.abs(angle) < 90 ? -length / 6 : length / 6)], [length, 0]]))
                            .attr('stroke', 'url(#gradient)') // Apply the gradient here
                            .attr('stroke-width', 2)
                            .attr('fill', 'none');
                    });

                    // add a dropped pin bootstrap on the building when clicked
                    svg.append("svg:image")
                        .attr('x', projection(endLocation.geometry.coordinates[0][0])[0] - 12)
                        .attr('y', projection(endLocation.geometry.coordinates[0][0])[1] - 24)
                        .attr('z-index', 100)
                        .attr("class", "drop-pin")
                        .attr('width', 24)
                        .attr('height', 24)
                        .attr("xlink:href", "images/drop-pin.svg");
                });
        });
    }

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
            .attr("opacity", 0.5)
            .attr("fill", function (d) { return color(d.value); });

    }
})();