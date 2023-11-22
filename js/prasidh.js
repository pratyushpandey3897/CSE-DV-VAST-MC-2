let globalData;
let lineData;
let horizontalBarData;
let barLineChartData;
let barLineData;
let groupedData;
let bubbleData;
let selectedMonth = "March";
let selectedDay = "Monday";
let selectedTimeOfDay = "morning"
let selectedBubble = "894";
let selectedBubbleCategory = "Pub"
let commute_counts_rpe_data;

document.addEventListener("DOMContentLoaded", async (event) => {

    // Select menus for comparing lives
    personSelect1 = document.getElementById("personSelect1");
    personSelect1.addEventListener("change", personChange)
    personSelect2 = document.getElementById("personSelect2");
    personSelect2.addEventListener("change", personChange)

  d3.csv("data/line_chart.csv")
    .then(function (lineData) {
      create_line_chart(lineData);
    })
    .catch(function (error) {
      console.log(error);
    });

  d3.csv("data/grouped_chart.csv")
    .then(function (loadedData) {
      globalData = loadedData;
      create_grouped_bar_chart(globalData);
    })
    .catch(function (error) {
      console.log(error);
    });

  d3.json("parsedData/weekday_commutes.json").then(function (loadedData) {
    //console.log(loadedData);
    horizontalBarData = loadedData;
    initialize_horizontal_bar_chart(loadedData, "March");
  });


  // d3.json("parsedData/commute_counts_rpe.json").then(function (loadedData) {
  //   //console.log(loadedData);
  //   commute_counts_rpe_data = loadedData;
  //   selectedTimeOfDay = "morning";
  //   create_beeswarm_chart(commute_counts_rpe_data);
  // });

  // d3.csv("data/commercial_expenditures_occupancy.csv")
  // .then(function (barLineData) {
  //   console.log(barLineData)
  //   groupAndAggregateData(barLineData);
  //   create_bar_line_chart();
  // })
  // .catch(function (error) {
  //   console.log(error);
  // });

  let loadedData = await d3.json("parsedData/commute_counts_rpe.json");
  commute_counts_rpe_data = loadedData;
  selectedTimeOfDay = "morning";
  create_beeswarm_chart(commute_counts_rpe_data);

  await new Promise(resolve => setTimeout(resolve, 3000)); // Adjust the delay as needed

  d3.csv("data/commercial_expenditures_occupancy.csv")
    .then(function (data) {
      console.log(data)
      barLineData = data;
      create_bar_line_chart();
    })
    .catch(function (error) {
      console.log(error);
    });





});

function prepare_grouped_data(data) {
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
    let work = d.values.find(function (v) {
      return v[0] === "Work";
    });
    d["Work"] = work ? work[1] : 0;

    let home = d.values.find(function (v) {
      return v[0] === "Home";
    });
    d["Home"] = home ? home[1] : 0;

    let pub = d.values.find(function (v) {
      return v[0] === "Pub";
    });
    d["Pub"] = pub ? pub[1] : 0;

    let restaurant = d.values.find(function (v) {
      return v[0] === "Restaurant";
    });
    d["Restaurant"] = restaurant ? restaurant[1] : 0;

    let unknown = d.values.find(function (v) {
      return v[0] === "Unknown";
    });
    d["Unknown"] = unknown ? unknown[1] : 0;
  });
}

function create_grouped_bar_chart(data) {
  d3.select("#grouped-bar-chart").select("g").remove();
  prepare_grouped_data(data);
  console.log(groupedData);
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
    .on("click", function () {
      console.log("Bar clicked");
      selectedTimeOfDay = d3.select(this).data()[0].key;
      create_beeswarm_chart(commute_counts_rpe_data);
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
  let margin = { top: 60, right: 60, bottom: 50, left: 75 };
  let width = +svg.attr("width") - margin.left - margin.right;
  let height = +svg.attr("height") - margin.top - margin.bottom;

  let g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x and y scales
  let x = d3
    .scalePoint()
    .domain(months)
    .range([4, width - margin.left - margin.right]);
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
  y.domain([40000, d3.max(lineData, (d) => d["Total Commutes"])]); // Use 'Total Commutes' for y domain

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
      width / 2 +
      " ," +
      (height + margin.top + margin.bottom - 10) +
      ")"
    )
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Month");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 2 - 35)
    .attr("x", 0 - (height + margin.top + margin.bottom) / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Total number of Commutes");

  let clicked = false;
  // Add circles at each data point with mouseover and mouseout events
  lineData.forEach(function (d) {
    let circle = g
      .append("circle")
      .attr("cx", x(d.Month))
      .attr("cy", y(d["Total Commutes"]))
      .attr("r", 5)
      .attr("fill", "black")
      .attr("stroke", "black")
      .attr("class", "line-circles");

    circle.on("mouseover", function () {
      if (!clicked) {
        d3.selectAll(".line-circles")
          .transition()
          .duration(200)
          .style("opacity", 0.3);

        d3.select(this).transition().duration(200).style("opacity", 1);
      }
    });

    circle.on("mouseout", function () {
      if (!clicked) {
        d3.selectAll(".line-circles")
          .transition()
          .duration(200)
          .style("opacity", 1);
      }
    });
    circle.on("click", function () {
      // On click, set the opacity of all circles to 0.5 with transition
      d3.selectAll(".line-circles")
        .transition()
        .duration(200)
        .style("opacity", 0.3);
      // Set the opacity of the current circle to 1 with transition
      d3.select(this).transition().duration(200).style("opacity", 1);
      clicked = true;
      selectedMonth = d.Month;
      create_grouped_bar_chart(globalData);
      create_beeswarm_chart(commute_counts_rpe_data);
      create_horizontal_bar_chart(horizontalBarData, selectedMonth);
    });
  });
}


let horizontal_bar_svg, g, x, y, color;

function initialize_horizontal_bar_chart(data, selectedMonth) {
  horizontal_bar_svg = d3.select("#horizontal-bar-chart");
  let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  let margin = { top: 60, right: 20, bottom: 50, left: 70 };
  let width = +horizontal_bar_svg.attr("width") - margin.left - margin.right;
  let height = +horizontal_bar_svg.attr("height") - margin.top - margin.bottom;

  g = horizontal_bar_svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let maxVal = d3.max(Object.values(data).flatMap(Object.values));

  color = d3
    .scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateReds);

  x = d3
    .scaleLinear()
    .domain([0, maxVal + 2000])
    .range([0, width - margin.left - margin.right]);

  y = d3.scaleBand().domain(days).range([height, 0]).padding(0.1);

  g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5));

  g.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(y));

  create_horizontal_bar_chart(data, selectedMonth);
}

function create_horizontal_bar_chart(data, selectedMonth) {
  let bars = g.selectAll(".bar")
    .data(Object.entries(data[selectedMonth]));

  let maxVal = d3.max(Object.values(data[selectedMonth]));

  color = d3
    .scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateReds);
  // Update existing bars
  bars
  .attr("fill", function (d) {
    return color(d[1]);
  })
    .transition()
    .duration(1000)
    .attr("y", function (d) {
      return y(d[0]);
    })
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", function (d) {
      return x(d[1]);
    })
    .on("click", function (d) {
      g.selectAll(".bar").style("opacity", 0.8);
      g.selectAll(".bar").style("stroke", "none");

      // Add border stroke to clicked bar
      d3.select(this).style("stroke", "black").style("stroke-width", 2);


      // Highlight clicked bar
      d3.select(this).style("opacity", 1);

      // Get clicked element value
      selectedDay = d3.select(this).data()[0][0];
      create_beeswarm_chart(commute_counts_rpe_data);
      create_grouped_bar_chart(globalData);
    });

  // Enter new bars, if any
  bars
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", function (d) {
      return y(d[0]);
    })
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", function (d) {
      return x(d[1]);
    })
    .on("click", function (d) {
      g.selectAll(".bar").style("opacity", 0.8);
      g.selectAll(".bar").style("stroke", "none");

      // Add border stroke to clicked bar
      d3.select(this).style("stroke", "black").style("stroke-width", 2);

      // Highlight clicked bar
      d3.select(this).style("opacity", 1);

      // Get clicked element value
      selectedDay = d3.select(this).data()[0][0];
      create_beeswarm_chart(commute_counts_rpe_data);
      create_grouped_bar_chart(globalData);
    })
    .attr("fill", function (d) {
      return color(d[1]);
    });

  // Remove old bars, if any
  bars.exit().remove();
}

function prepare_beeswarm_data(data) {
  selectedTimeOfDay = selectedTimeOfDay.toLowerCase();
  return (bubbleData = data[selectedMonth][selectedDay][selectedTimeOfDay]);
}

function create_beeswarm_chart(data) {
  var svg = d3.select("#beeswarm-chart");
  svg.selectAll("*").remove();
  prepare_beeswarm_data(data);
  let margin = { top: 60, right: 70, bottom: 20, left: 30 };
  let width = +svg.attr("width") - margin.left - margin.right;
  let height = +svg.attr("height") - margin.top - margin.bottom;

  // create dummy data -> just one element per circle
  var chart_data = [];
  Object.entries(bubbleData).forEach(([group, groupData]) => {
    Object.entries(groupData).forEach(([name, value]) => {
      chart_data.push({ name, value, group });
    });
  });
  console.log(chart_data)

  // A scale that gives a X target position for each group
  var x = d3.scaleOrdinal().domain(["Work", "Pub", "Restaurant"]).range([2*(width / 5), (width) / 2, (3 * width) / 4]);

  var minValue = d3.min(chart_data, d => d.value);
  var maxValue = d3.max(chart_data, d => d.value);

  var radiusScale = d3.scaleSqrt()
    .domain([minValue, maxValue]) // input range
    .range([4, 25]); // output range


  let z = d3.scaleOrdinal(d3.schemeTableau10);
  let keys = ["Work", "Pub", "Restaurant"];

  // Map the keys to the color scale
  z.domain(keys);

  // Initialize the circle: all located at the center of the svg area
  var node = svg
    .append("g")
    .selectAll("circle")
    .attr("class", "circles")
    .data(chart_data)
    .join(
      enter => enter
        .append("circle")
        .attr("r", 3) // Start with 0 radius
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .style("fill", function (d) {
          return z(d.group);
        })
        .style("fill-opacity", 0.9)
        .call(
          d3
            .drag() // call specific function when circle is dragged
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d.value)), // Grow to actual radius
      update => update
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d.value)), // Update radius
      exit => exit
        .transition()
        .duration(1000)
        .attr("r", 0) // Shrink to 0 radius
        .remove()
    )
    .on("click", function (d) {
      node.style("opacity", 0.8);
      node.style("stroke", "none");

      // Add border stroke to clicked bar
      d3.select(this).style("stroke", "black").style("stroke-width", 1);
      d3.select(this).style("opacity", 1);

      // Get clicked element value
      selectedBubble = d3.select(this).data()[0]['name'];
      selectedBubbleCategory = d3.select(this).data()[0]['group'];
      console.log("selected bubble  is " + selectedBubbleCategory);
      create_bar_line_chart();
    });

  // Features of the forces applied to the nodes:
  var simulation = d3
    .forceSimulation()
    .force(
      "x",
      d3
        .forceX()
        .strength(0.9)
        .x(function (d) {
          return x(d.group);
        })
    )
    .force(
      "y",
      d3
        .forceY()
        .strength(0.5)
        .y(height / 2)
    )
    .force("charge", d3.forceManyBody().strength(-50)) // Nodes are attracted one each other of value is > 0
    .force("collide", d3.forceCollide().strength(0.5).radius(d => radiusScale(d.value) + 1).iterations(1))

  // Apply these forces to the nodes and update their positions.
  // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
  simulation.nodes(chart_data).on("tick", function (d) {
    node
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.03).restart(); // Increase alphaTarget
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.03);
    d.fx = null;
    d.fy = null;
  }
}


function groupAndAggregateData() {
  barLineChartData = barLineData.reduce((acc, curr) => {
    // Filter based on selected variables
    if (curr.month === selectedMonth && curr.day_of_week === selectedDay && curr.portion_of_day === selectedTimeOfDay && curr.commercialId === selectedBubble) {
      // Extract the hour from start_time
      let hour = new Date(curr.start_time).getHours();
      // Initialize the hour group if it doesn't exist
      if (!acc[hour]) {
        acc[hour] = {
          hour: formatHour(hour),
          totalOccupancy: 0,
          expenditure: 0
        };
      }
      // Aggregate the total occupancy and increment the count
      acc[hour].totalOccupancy += 1;
      acc[hour].expenditure += parseFloat(curr.expenditures);
    }

    return acc;
  }, {});
  console.log("bar line chart data is " + barLineChartData);
}

function formatHour(hour) {
  let period = hour < 12 ? 'AM' : 'PM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return hour + ' ' + period;
}

function create_bar_line_chart(barLineData) {

  groupAndAggregateData(barLineData);
  d3.select("#bar_line_chart").selectAll("*").remove();
  let margin = { top: 20, right: 80, bottom: 70, left: 80 };
  let data = Object.values(barLineChartData);
  data.sort((a, b) => a.hour - b.hour);
  let svg = d3.select("#bar_line_chart"),
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  let z = d3.scaleOrdinal(d3.schemeTableau10);
  let keys = ["Work", "Pub", "Restaurant"];
  z.domain(keys);

  let x = d3.scaleBand().rangeRound([0, width]).padding(0.4);
  let y = d3.scaleLinear().rangeRound([height, 0]);
  let yRight = d3.scaleLinear().rangeRound([height, 0]); // Define a new y-scale for the right axis

  x.domain(data.map(function (d) { return d.hour; }));
  y.domain([0, d3.max(data, function (d) { return d.totalOccupancy; })]);
  yRight.domain([0, d3.max(data, function (d) { return d.expenditure; })]); // Set the domain of the right y-scale

  let chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Translate the chart area within the margins

  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .append("text") // Append a text element for the x-axis label
    .attr("fill", "#000")
    .attr("y", 35) // Position the label below the x-axis
    .attr("x", width / 2)
    .attr("text-anchor", "middle")
    .text("Time");

  chart.append("g")
    .call(d3.axisLeft(y))
    .append("text") // Append a text element for the y-axis label
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)") // Rotate the label to be vertical
    .attr("y", -50) // Position the label to the left of the y-axis
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Total Occupancy");

  let rightAxis = chart.append("g")
    .attr("transform", "translate(" + width + ",0)") // Translate the right y-axis to the right side of the chart
    .call(d3.axisRight(yRight));

  rightAxis.append("text") // Append a text element for the right y-axis label
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)") // Rotate the label to be vertical
    .attr("y", 50) // Position the label to the right of the y-axis
    .attr("x", -height / 2)
    .attr("dy", "1em") // Shift the label down slightly
    .style("text-anchor", "middle")
    .text("Total Expenditure");

  let legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Total Occupancy", "Total Expenditure"])
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", function (d) { return d === "Total Occupancy" ? z(selectedBubbleCategory) : "green"; });

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function (d) { return d; });

  chart.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) { return x(d.hour); })
    .attr("y", function (d) { return y(d.totalOccupancy); })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      let barHeight = height - y(d.totalOccupancy);
      if (isNaN(barHeight)) {
        console.error('Invalid bar height', d, barHeight);
        return 0;
      }
      return barHeight;
    })
    .attr("fill", function (d) {
      return z(selectedBubbleCategory);
    })

  create_tooltip(chart.selectAll(".bar"), function (d) {
    return 'Time: ' + d.hour
      + '</br>' + 'Total Occupancy: ' + d.totalOccupancy;
  });

  let line = d3.line()
    .x(function (d) { return x(d.hour) + x.bandwidth() / 2; }) // Center the line in the bars
    .y(function (d) { return yRight(d.expenditure); }); // Use the right y-scale for the line chart

  // Add the line chart to the SVG
  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  chart.selectAll(".dot")
    .data(data)
    .enter().append("circle") // Append circle elements
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function (d) { return x(d.hour) + x.bandwidth() / 2; })
    .attr("cy", function (d) { return yRight(d.expenditure); })
    .attr("r", 3) // Radius of circle
    .attr("fill", "green");

  create_tooltip(chart.selectAll(".dot"), function (d) {
    return 'Time: ' + d.hour
      + '</br>' + 'Total Expenditure: ' + d.expenditure.toFixed(2);
  });

}

function create_tooltip(selection, formatTooltip) {
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "hovertooltip");
  selection
    .on('mouseover', function (event, d) {
      tooltip
        .style("visibility", "visible")
        .html(formatTooltip(d));
    })
    .on('mousemove', function (event) {
      tooltip
        .style("top", (event.pageY - 70) + "px")
        .style("left", (event.pageX + 20) + "px");
    })
    .on('mouseout', function () {
      tooltip.style("visibility", "hidden");
    });
}




function groupAndAggregateData() {
  barLineChartData = barLineData.reduce((acc, curr) => {
    // Filter based on selected variables
    if (curr.month === selectedMonth && curr.day_of_week === selectedDay && curr.portion_of_day === selectedTimeOfDay && curr.commercialId === selectedBubble) {
      // Extract the hour from start_time
      let hour = new Date(curr.start_time).getHours();
      // Initialize the hour group if it doesn't exist
      if (!acc[hour]) {
        acc[hour] = {
          hour: formatHour(hour),
          totalOccupancy: 0,
          expenditure: 0
        };
      }
      // Aggregate the total occupancy and increment the count
      acc[hour].totalOccupancy += 1;
      acc[hour].expenditure += parseFloat(curr.expenditures);
    }

    return acc;
  }, {});
  console.log("bar line chart data is " + barLineChartData);
}

function formatHour(hour) {
  let period = hour < 12 ? 'AM' : 'PM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return hour + ' ' + period;
}

function create_bar_line_chart(barLineData) {

  groupAndAggregateData(barLineData);
  d3.select("#bar_line_chart").selectAll("*").remove();
  let margin = { top: 20, right: 80, bottom: 70, left: 80 };
  let data = Object.values(barLineChartData);
  data.sort((a, b) => a.hour - b.hour);
  let svg = d3.select("#bar_line_chart"),
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  let z = d3.scaleOrdinal(d3.schemeTableau10);
  let keys = ["Work", "Pub", "Restaurant"];
  z.domain(keys);

  let x = d3.scaleBand().rangeRound([0, width]).padding(0.4);
  let y = d3.scaleLinear().rangeRound([height, 0]);
  let yRight = d3.scaleLinear().rangeRound([height, 0]); // Define a new y-scale for the right axis

  x.domain(data.map(function (d) { return d.hour; }));
  y.domain([0, d3.max(data, function (d) { return d.totalOccupancy; })]);
  yRight.domain([0, d3.max(data, function (d) { return d.expenditure; })]); // Set the domain of the right y-scale

  let chart = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Translate the chart area within the margins

  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .append("text") // Append a text element for the x-axis label
    .attr("fill", "#000")
    .attr("y", 35) // Position the label below the x-axis
    .attr("x", width / 2)
    .attr("text-anchor", "middle")
    .text("Time");

  chart.append("g")
    .call(d3.axisLeft(y))
    .append("text") // Append a text element for the y-axis label
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)") // Rotate the label to be vertical
    .attr("y", -50) // Position the label to the left of the y-axis
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Total Occupancy");

  let rightAxis = chart.append("g")
    .attr("transform", "translate(" + width + ",0)") // Translate the right y-axis to the right side of the chart
    .call(d3.axisRight(yRight));

  rightAxis.append("text") // Append a text element for the right y-axis label
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)") // Rotate the label to be vertical
    .attr("y", 50) // Position the label to the right of the y-axis
    .attr("x", -height / 2)
    .attr("dy", "1em") // Shift the label down slightly
    .style("text-anchor", "middle")
    .text("Total Expenditure");

  let legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Total Occupancy", "Total Expenditure"])
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", function (d) { return d === "Total Occupancy" ? z(selectedBubbleCategory) : "green"; });

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function (d) { return d; });

  chart.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) { return x(d.hour); })
    .attr("y", function (d) { return y(d.totalOccupancy); })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      let barHeight = height - y(d.totalOccupancy);
      if (isNaN(barHeight)) {
        console.error('Invalid bar height', d, barHeight);
        return 0;
      }
      return barHeight;
    })
    .attr("fill", function (d) {
      return z(selectedBubbleCategory);
    })

  create_tooltip(chart.selectAll(".bar"), function (d) {
    return 'Time: ' + d.hour
      + '</br>' + 'Total Occupancy: ' + d.totalOccupancy;
  });

  let line = d3.line()
    .x(function (d) { return x(d.hour) + x.bandwidth() / 2; }) // Center the line in the bars
    .y(function (d) { return yRight(d.expenditure); }); // Use the right y-scale for the line chart

  // Add the line chart to the SVG
  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  chart.selectAll(".dot")
    .data(data)
    .enter().append("circle") // Append circle elements
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function (d) { return x(d.hour) + x.bandwidth() / 2; })
    .attr("cy", function (d) { return yRight(d.expenditure); })
    .attr("r", 3) // Radius of circle
    .attr("fill", "green");

  create_tooltip(chart.selectAll(".dot"), function (d) {
    return 'Time: ' + d.hour
      + '</br>' + 'Total Expenditure: ' + d.expenditure.toFixed(2);
  });

}

function create_tooltip(selection, formatTooltip) {
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "hovertooltip");
  selection
    .on('mouseover', function (event, d) {
      tooltip
        .style("visibility", "visible")
        .html(formatTooltip(d));
    })
    .on('mousemove', function (event) {
      tooltip
        .style("top", (event.pageY - 70) + "px")
        .style("left", (event.pageX + 20) + "px");
    })
    .on('mouseout', function () {
      tooltip.style("visibility", "hidden");
    });
}



function getEmoji(key){ let emojis = {
  "pub": "🍻",
  "home": "🏠",
  "restaurant": "🍔",
  "workplace": "🏢"
};
  return emojis[key]
}

function createLineChart(data, chartName) {
  
  d3.selectAll(`.${chartName}Child`).remove()
  d3.selectAll(".dateLabels").remove()

  data.forEach((item) => {
    let date = Object.keys(item)[0];
    let places = item[date];


    let personsvg = d3.select(`#${chartName}`).append("svg").attr("class", `${chartName}Child`).attr("width", "450").attr("height", 100),
      margin = { top: 10, right: 10 , bottom: 20, left: 20 },
      width = +personsvg.attr("width") - margin.left - margin.right,
      height = +personsvg.attr("height") - margin.top - margin.bottom,
      g = personsvg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    let x = d3.scaleUtc().range([0, width]).domain([new Date(date + "T00:00:00Z"), new Date(date + "T23:59:59Z")]);
    let xAxis = d3.axisBottom(x).ticks(d3.timeHour.every(3), "%I %p");

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .select(".domain")
      .remove();

      /*
    g.selectAll(".dot")
      .data(places)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", function (d) { return x(new Date(d.startTime)); })
      .attr("cy", height / 2)
      .attr("r", 3.5);
      */
      g.selectAll(".symbol")
      .data(places)
      .enter()
      .append("text")
      .attr("class", "symbol")
      .attr("x", function (d) { dt = x(new Date(d.startTime)); return dt}) 
      .attr("y", height / 2 ) 
      .text(d => getEmoji(d.place)); 
     /*

      g.selectAll(".symbol")
      .data(places)
      .enter()
      .append("text")
      .attr("class", "symbol material-icon")
      .attr("x", d =>{dt= x(new Date(new Date(d.startTime).toISOString())); console.log(d); console.log(dt); return dt})
      .attr("y", height / 2)
      .text("lunch-dining")
      .attr("font-size", 15)

*/

      
    let dateLabel = d3.select("#activityDatePanel").append("svg").attr("height", 100).attr("class", "dateLabels")
    // Add date next to the chart
    dateLabel.append("text")
    .attr("y", 55)
      .attr("class", "dateLabels")
      .text(date);
  });
}

// This needs to be called when in the onChange of month/date selector 
populatePersonSelector(selectedDay, selectedDay) // remove when month/date selector added
function populatePersonSelector() {

  // Get list of 10 people
  fetch('/parsedData/particpiantDayActivity.json')
    .then(response => response.json())
    .then(data => {
      let monthData = data[selectedMonth];
      if (monthData) {
        let dayData = monthData[selectedDay];
        // Fetch keys here
        if (dayData) {
          options = Object.keys(dayData)
          for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt;
            el.value = opt;
            personSelect1.appendChild(el);
            opt = options[i];
            el = document.createElement("option");
            el.textContent = opt;
            el.value = opt;
            personSelect2.appendChild(el);
          }
        }
      }
    })
    .catch(error => console.log(error));

}

function personChange(event) {
  var id = event.target.id;
  var select = document.getElementById(id)
  var value = select.value;
  var chartName;
  if (id == "personSelect1") {
    chartName = "person1";
  } else {
    chartName = "person2"
  }
  getActivityData(value).then(result => {
    createLineChart(result, chartName);
  }).catch(error => {
    console.error(error);
  });

}


function getActivityData(id) {
  return new Promise((resolve, reject) => {
    let visitedPlaces = [];
    fetch('/parsedData/particpiantDayActivity.json')
      .then(response => response.json())
      .then(data => {
        let monthData = data[selectedMonth];
        if (monthData) {
          let dayData = monthData[selectedDay];
          if (dayData && dayData[id]) {
            for (let date in dayData[id]) {
              if (!visitedPlaces[date]) {
                visitedPlaces[date] = [];
              }
              dayData[id][date].forEach(activity => {
                visitedPlaces[date].push({
                  place: activity.end.type,
                  startTime: activity.starttime,
                  endTime: activity.endtime
                });
              });
            }
          }
        }

        let result = Object.keys(visitedPlaces).map(date => {
          return { [date]: visitedPlaces[date] };
        });
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
}