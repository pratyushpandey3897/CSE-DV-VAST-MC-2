let data;
let lineData;
let groupedData;
let selectedMonth;
let selectedDay;

document.addEventListener("DOMContentLoaded", (event) => {
  d3.csv("data/line_chart.csv")
    .then(function (lineData) {
      create_line_chart(lineData);
    })
    .catch(function (error) {
      console.log(error);
    });

  d3.csv("data/grouped_chart.csv")
    .then(function (data) {
      get_month_and_day();
      let filteredData = data.filter(function (d) {
        return d["Month"] === selectedMonth && d["Day of Week"] === selectedDay;
      });

      groupedData = Array.from(
        d3.group(filteredData, (d) => d["Portion of Day"]),
        ([key, values]) => ({
          key,
          values: Array.from(
            d3.rollup(
              values,
              (v) => d3.sum(v, (leaf) => leaf["Total Commutes"]),
              (d) => d["End Location Type"]
            )
          ),
        })
      );

      groupedData.forEach(function (d) {
        d["Work"] = d.values.find(function (v) {
          return v[0] === "Work";
        })[1];
        d["Home"] = d.values.find(function (v) {
          return v[0] === "Home";
        })[1];
        d["Pub"] = d.values.find(function (v) {
          return v[0] === "Pub";
        })[1];
        d["Restaurant"] = d.values.find(function (v) {
          return v[0] === "Restaurant";
        })[1];
        d["Unknown"] = d.values.find(function (v) {
          return v[0] === "Unknown";
        })[1];
      });

      create_grouped_bar_chart();
    })
    .catch(function (error) {
      console.log(error);
    });
});

function create_grouped_bar_chart() {
  let svg = d3.select("#grouped-bar-chart");

  let margin = { top: 60, right: 40, bottom: 50, left: 60 };
  let width = +svg.attr("width") - margin.left - margin.right;
  let height = +svg.attr("height") - margin.top - margin.bottom;

  let g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x and y scales
  let x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);

  let x1 = d3.scaleBand().padding(0.1);

  let y = d3.scaleLinear().rangeRound([height, 0]);

  // Define the color scale
  let z = d3.scaleOrdinal(d3.schemeTableau10);

  let keys = ["Work", "Pub", "Restaurant"];
  x0.domain(groupedData.map((d) => d.key));
  x1.domain(keys).rangeRound([0, x0.bandwidth()]);
  y.domain([
    0,
    d3.max(groupedData, (d) => d3.max(keys, (key) => d[key])),
  ]).nice();

  // Draw the bars
  g.append("g")
    .selectAll("bars")
    .data(groupedData)
    .enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", (d) => "translate(" + x0(d.key) + ",0)")
    .on("mouseover", function () {
      // Decrease the opacity of other bars on hover
      d3.selectAll(".bar-group")
        .transition()
        .duration(200)
        .style("opacity", 0.6);
      d3.select(this).transition().duration(300).style("opacity", 1);
    })
    .on("mouseout", function () {
      // Restore the default opacity of all bars on mouseout
      d3.selectAll(".bar-group").transition().duration(200).style("opacity", 1);
    })
    .selectAll("rect")
    .data((d) => keys.map((key) => ({ key: key, value: d[key] }))) // Create a new array of objects with properties 'key' and 'value'
    .enter()
    .append("rect")
    .attr("x", (d) => x1(d.key))
    .attr("y", (d) => y(d.value)) // Use 'd.value' here
    .attr("width", x1.bandwidth())
    .attr("height", (d) => height - y(d.value)) // And here
    .attr("fill", (d) => z(d.key));

  // Add the x-axis
  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x0));

  // Add the y-axis
  g.append("g").call(d3.axisLeft(y));

  // Create a legend
  const legend = g
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 80) + ", -40)"); // Adjust the translation to position the legend

  const legendDotSize = 8; // Size of the colored circles in the legend
  const legendSpacing = 10; // Spacing between legend items

  const legendKeys = legend
    .selectAll(".legend-key")
    .data(keys)
    .enter()
    .append("g")
    .attr("class", "legend-key")
    .attr(
      "transform",
      (d, i) => "translate(0, " + i * 1.5 * legendSpacing + ")"
    ); // Adjust spacing between legend items

  legendKeys
    .append("circle")
    .attr("r", legendDotSize / 2) // Radius of the colored circles
    .attr("fill", (d) => z(d)); // Use the same color scale for legend

  legendKeys
    .append("text")
    .attr("x", legendDotSize + 5) // Adjust the spacing between the circle and the text
    .attr("y", legendDotSize / 2) // Center the text vertically in the circle
    .text((d) => d); // Display the corresponding key next to the colored circle

  // Add the x-axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" +
        (width / 2 + margin.left) +
        " ," +
        (height + margin.top + margin.bottom - 10) +
        ")"
    )
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Portion of Day");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 2 - 30) // Adjust this value as needed
    .attr("x", 0 - (height + margin.top) / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Number of Commutes");
}

function get_month_and_day() {
  // let month = document.getElementById("month").value;
  // let day = document.getElementById("day").value;
  // TODO: Remove hard codes and use selected values
  selectedMonth = "March";
  selectedDay = "Wednesday";
}

function create_line_chart(lineData) {
  let svg = d3.select("#line-chart");

  let months = [
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
  ];
  let margin = { top: 60, right: 40, bottom: 50, left: 60 };
  let width = +svg.attr("width") - margin.left - margin.right;
  let height = +svg.attr("height") - margin.top - margin.bottom;

  let g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x and y scales
  let x = d3.scalePoint().domain(months).range([4, width]);
  let y = d3.scaleLinear().rangeRound([height, 0]);

  // Define the line
  let line = d3
    .line()
    // .curve(d3.curveBasis)
    .x((d) => x(d.Month))
    .y((d) => y(d["Total Commutes"]));

  // Define the color scale
  let z = d3.scaleOrdinal(d3.schemeTableau10);

  x.domain(lineData.map((d) => d.Month)); // Use 'Month' for x domain
  y.domain([0, d3.max(lineData, (d) => d["Total Commutes"])]); // Use 'Total Commutes' for y domain

  // Draw the line
  g.append("path")
    .datum(lineData)
    .attr("fill", "none")
    .attr("stroke", z("value"))
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // Add the x-axis
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add the y-axis
  g.append("g").call(d3.axisLeft(y));

  // Add the x-axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" +
        (width / 2 + margin.left) +
        " ," +
        (height + margin.top + margin.bottom - 10) +
        ")"
    )
    .style("text-anchor", "middle")
    .style("font-size", "11px")
    .text("Month"); // Change x-axis label to 'Month'

    // Add circles at each data point with mouseover and mouseout events
    lineData.forEach(function(d) {
      let circle = g.append('circle')
      .attr('cx', x(d.Month))
      .attr('cy', y(d['Total Commutes']))
      .attr('r', 5) 
      .attr('fill', 'black') 
      .attr('stroke', 'black') 
      .attr('class', 'line-circles');
  
      circle.on('mouseover', function() {
        console.log("triggered");
          // On mouseover, decrease the opacity of all circles to 0.6 with transition
          d3.selectAll('.line-circles').transition().duration(200).style('opacity', 0.3);
          // Increase the opacity of the current circle to 1 with transition
          d3.select(this).transition().duration(200).style('opacity', 1);
      });
  
      circle.on('mouseout', function() {
        console.log("triggered");
          // On mouseout, restore the opacity of all circles to 1 with transition
          d3.selectAll('.line-circles').transition().duration(200).style('opacity', 1);
      });
  });
}
