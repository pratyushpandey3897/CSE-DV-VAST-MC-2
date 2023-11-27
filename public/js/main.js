let globalData;
let lineData;
let horizontalBarData;
let barLineChartData;
let barLineData;
let groupedData;
let bubbleData;
let commute_counts_rpe_data;
let colorScheme = d3.schemeCategory10;
let personSelect1, personSelect2;

document.addEventListener("DOMContentLoaded", (event) => {
  $(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
  // Select menus for comparing lives
  personSelect1 = document.getElementById("personSelect1");
  personSelect1.addEventListener("change", personChange);
  personSelect2 = document.getElementById("personSelect2");
  personSelect2.addEventListener("change", personChange);

  create_line_chart();
  drawComparisionChartLegend();
  document.dispatchEvent(new Event("DrawBaseMap"));
});

async function create_grouped_bar_chart() {
  d3.select("#grouped-bar-chart").selectAll("*").remove();
  await fetch(
    `/patternsOfLife/totalCommutesByLocationType/${selectedYear}/${selectedMonth}/${selectedDay}`
  )
    .then((res) => res.json())
    .then((data) => {
      groupedData = Array.from(
        d3.group(data, (d) => d["Portion of Day"]),
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
          return v[0] === "Workplace";
        });
        d["Workplace"] = work ? work[1] : 0;

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

      const order = {
        Morning: 1,
        Afternoon: 2,
        Evening: 3,
        Night: 4,
      };

      groupedData.sort(function (a, b) {
        return order[a.key] - order[b.key];
      });
    })
    .then(() => {
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
      let z = d3.scaleOrdinal(colorScheme);

      let keys = ["Workplace", "Pub", "Restaurant"];
      x0.domain(groupedData.map((d) => d.key));
      x1.domain(keys).rangeRound([0, x0.bandwidth()]);
      y.domain([
        0,
        d3.max(groupedData, (d) => d3.max(keys, (key) => d[key])),
      ]).nice();

      // Draw the bars
      let barGroups = g
        .append("g")
        .selectAll("bars")
        .data(groupedData)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d) => "translate(" + x0(d.key) + ",0)")
        .on("click", function () {
          selectedTimeOfDay = d3.select(this).data()[0].key;
          document.querySelector(
            "#commutes-to-buildings"
          ).textContent = `Commutes to buildings on a ${selectedDay} ${selectedTimeOfDay} in ${selectedMonth}`;

          create_beeswarm_chart();
          document.dispatchEvent(new Event("OverlapHeatMap"));

          d3.select("#bar-line-chart").selectAll("*").remove();
          // Add style changes
          d3.selectAll(".bar-group").style("opacity", 0.5); // Reduce opacity for all bars
          d3.select(this).style("opacity", 1); // Increase opacity for the selected bar
          updateComparisonChart();
        });

      let randomIndex = Math.floor(Math.random() * groupedData.length);

      // After the bars are created
      barGroups.each(function (d, i) {
        // If current index is the random index
        if (i === randomIndex) {
          // Trigger the click event
          this.dispatchEvent(new Event("click"));
        }
      });
      let bars = barGroups
        .selectAll("rect")
        .data((d) => keys.map((key) => ({ key: key, value: d[key] }))) // Create a new array of objects with properties 'key' and 'value'
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key))
        .attr("y", (d) => y(d.value)) // Use 'd.value' here
        .attr("width", x1.bandwidth())
        .attr("height", (d) => height - y(d.value)) // And here
        .attr("fill", (d) => z(d.key));

      create_tooltip(barGroups, function (d) {
        // Format the tooltip text for the entire group
        let tooltipText = "Time of Day: " + d.key + "</br>";
        d.values.forEach(function (value) {
          tooltipText += value[0] + " : " + value[1] + "</br>";
        });
        return tooltipText;
      });

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

      const legendRectSize = 19;

      const legendKeys = legend
        .selectAll(".legend-key")
        .data(keys)
        .enter()
        .append("g")
        .attr("class", "legend-key")
        .attr("transform", function (d, i) {
          return "translate(0," + i * 30 + ")";
        }); // Adjust spacing between legend items

      legendKeys
        .append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .attr("fill", (d) => z(d));

      legendKeys
        .append("text")
        .attr("x", legendRectSize + 10)
        .attr("y", legendRectSize / 2)
        .attr("font-size", "12px")
        .attr("dy", "0.31em")
        .text((d) => d);

      legend.each(function (d) {
        if (d === "Total Occupancy") {
          d3.select(this)
            .append("rect")
            .attr("x", width + margin.left)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z(selectedBubbleCategory));
        } else {
          d3.select(this)
            .append("line")
            .attr("x1", width + margin.left)
            .attr("y1", 10)
            .attr("x2", width + margin.left + 19)
            .attr("y2", 10)
            .attr("stroke-width", 2)
            .attr("stroke", "black");
        }
      });

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
    });
}

async function create_line_chart() {
  await fetch("/patternsOfLife/totalCommutesByMonth")
    .then((res) => res.json())
    .then((lineData) => {
      let svg = d3.select("#line-chart");
      d3.s;

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
      // let z = d3.scaleOrdinal(colorScheme);

      x.domain(lineData.map((d) => d.Month)); // Use 'Month' for x domain
      y.domain([40000, d3.max(lineData, (d) => d["Total Commutes"])]); // Use 'Total Commutes' for y domain

      // Draw the line
      g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "red")
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
        .text("Total Number of Commutes");

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
          console.log(selectedMonth);
          if (selectedMonth === "January" || selectedMonth === "February") {
            console.log("setting the year..");
            selectedYear = 2023;
          } else {
            selectedYear = 2022;
          }
          console.log("selecting month: ", d.Month);
          d3.select("#bar-line-chart").selectAll("*").remove();
          document.querySelector(
            "#monthly-commutes"
          ).textContent = `Commutes by Month`;
          initialize_horizontal_bar_chart();
          // create_grouped_bar_chart();
          // create_beeswarm_chart();
          populatePersonSelector();
          document.dispatchEvent(new Event("RenderHeatmap"));
        });
        // After the circles are created

        create_tooltip(circle, function () {
          return (
            "Month: " + d.Month + "</br>" + "Commutes: " + d["Total Commutes"]
          );
        });
      });

      let randomIndex = Math.floor(Math.random() * lineData.length);

      svg.selectAll(".line-circles").each(function (d, i) {
        // Only trigger click on a random circle once
        if (i === randomIndex) {
          console.log("circle selected..,");
          // Trigger the click event
          this.dispatchEvent(new Event("click"));
        }
      });
    });
}

let horizontal_bar_svg, g, x, y, color;

async function initialize_horizontal_bar_chart() {
  await fetch(
    `/patternsOfLife/totalCommutesByWeekDay/${selectedYear}/${selectedMonth}`
  )
    .then((res) => res.json())
    .then((data) => {
      d3.select("#horizontal-bar-chart").selectAll("*").remove();
      horizontal_bar_svg = d3.select("#horizontal-bar-chart");
      let days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      data = Object.fromEntries(
        Object.entries(data).sort(
          (a, b) => days.indexOf(b[0]) - days.indexOf(a[0])
        )
      );
      
      let margin = { top: 60, right: 20, bottom: 50, left: 70 };
      let width =
        +horizontal_bar_svg.attr("width") - margin.left - margin.right;
      let height =
        +horizontal_bar_svg.attr("height") - margin.top - margin.bottom;

      g = horizontal_bar_svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      let maxVal = d3.max(Object.values(data));

      color = d3
        .scaleSequential()
        .domain([0, maxVal])
        .interpolator(d3.interpolateReds);

      x = d3
        .scaleLinear()
        .domain([0, maxVal + 2000])
        .range([0, width]);

      y = d3.scaleBand().domain(days).range([0, height]).padding(0.1);

      g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

      g.append("text")
        .attr(
          "transform",
          "translate(" +
            width / 2 +
            " ," +
            (height + margin.top + margin.bottom - 70) +
            ")"
        )
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Number of Commutes");
      g.append("g").attr("class", "y axis").call(d3.axisLeft(y));

      create_horizontal_bar_chart(data);
    });
}

function create_horizontal_bar_chart(data) {
  document.querySelector(
    "#weekday-commutes"
  ).textContent = `Commutes by Weekday in ${selectedMonth}`;
  let bars = g.selectAll(".bar").data(Object.entries(data));

  let maxVal = d3.max(Object.values(data));

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
      // create_beeswarm_chart();
      document.querySelector(
        "#portion-of-day-commutes"
      ).textContent = `Commutes on a ${selectedDay} in ${selectedMonth} by Portion of Day`;
      create_grouped_bar_chart();
      d3.select("#bar-line-chart").selectAll("*").remove();
      populatePersonSelector();
      document.dispatchEvent(new Event("OverlayHeatMap"));
    })
    .attr("fill", function (d) {
      return color(d[1]);
    });

  // Add tooltip to existing bars
  create_tooltip(bars, function (d) {
    return "Day: " + d[0] + "</br>" + "Commutes: " + d[1];
  });

  // Enter new bars, if any
  let newBars = bars
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
      // create_beeswarm_chart();
      document.querySelector(
        "#portion-of-day-commutes"
      ).textContent = `Commutes Grouped by Building Type on a ${selectedDay} in ${selectedMonth} by Portion of Day`;
      create_grouped_bar_chart();
      populatePersonSelector();
      document.dispatchEvent(new Event("RenderHeatmap"));
      d3.select("#bar-line-chart").selectAll("*").remove();
    })
    .attr("fill", function (d) {
      return color(d[1]);
    });

  create_tooltip(newBars, function (d) {
    return "Day: " + d[0] + "</br>" + "Commutes: " + d[1];
  });

  let randomIndex = Math.floor(Math.random() * Object.entries(data).length);
  newBars.each(function (d, i) {
    if (i === randomIndex) {
      console.log("bar clicked");
      // Trigger the click event
      this.dispatchEvent(new Event("click"));
    }
  });

  // Remove old bars, if any
  bars.exit().remove();
}

let simulation;

async function create_beeswarm_chart() {
  await fetch(
    `/patternsOfLife/totalCommutesByLocationId/${selectedYear}/${selectedMonth}/${selectedDay}/${selectedTimeOfDay}`
  )
    .then((res) => res.json())
    .then((data) => {
      var svg = d3.select("#beeswarm-chart");
      svg.selectAll("*").remove();
      bubbleData = data;
      let margin = { top: 60, right: 30, bottom: 20, left: 30 };
      let width = +svg.attr("width") - margin.left - margin.right;
      let height = +svg.attr("height") - margin.top - margin.bottom;

      // create dummy data -> just one element per circle
      var chart_data = [];
      Object.entries(bubbleData).forEach(([group, groupData]) => {
        Object.entries(groupData).forEach(([name, value]) => {
          chart_data.push({ name, value, group });
        });
      });

      // A scale that gives a X target position for each group
      var x = d3
        .scaleOrdinal()
        .domain(["Workplace", "Pub", "Restaurant"])
        .range([3 * (width / 10), width / 2, 7 * (width / 10)]);

      var minValue = d3.min(chart_data, (d) => d.value);
      var maxValue = d3.max(chart_data, (d) => d.value);

      var radiusScale = d3
        .scaleSqrt()
        .domain([minValue, maxValue]) // input range
        .range([4, 25]); // output range

      let z = d3.scaleOrdinal(colorScheme);
      let keys = ["Workplace", "Pub", "Restaurant"];

      // Map the keys to the color scale
      z.domain(keys);

      const legendRectSize = 11;
      // Define the legend
      let legend = svg
        .selectAll(".legend")
        .data(keys)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
          return "translate(" + (width - 80) + "," + (i * 30 + 20) + ")";
        });

      // Draw legend rectangles
      legend.append("circle").attr("r", legendRectSize).attr("fill", z);

      // Draw legend text
      legend
        .append("text")
        .attr("x", legendRectSize + 10) // Position the text to the right of the rectangle
        .attr("y", legendRectSize / 2 - 5) // Vertically align the text with the rectangle
        .attr("font-size", "12px") // Use the same font size as in your code
        .attr("dy", "0.31em") // Vertically align the text with the rectangle
        .text(function (d) {
          return d;
        });

      // Initialize the circle: all located at the center of the svg area
      var node = svg
        .append("g")
        .selectAll("circle")
        .attr("class", "circles")
        .data(chart_data)
        .join(
          (enter) =>
            enter
              .append("circle")
              .attr("r", 3) // Start with 0 radius
              .attr("cx", width / 2)
              .attr("cy", height / 2)
              .style("fill", function (d) {
                return z(d.group);
              })
              .style("fill-opacity", 1)
              .call(
                d3
                  .drag() // call specific function when circle is dragged
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended)
              )
              .transition()
              .duration(1000)
              .attr("r", (d) => radiusScale(d.value)), // Grow to actual radius
          (update) =>
            update
              .transition()
              .duration(1000)
              .attr("r", (d) => radiusScale(d.value)), // Update radius
          (exit) =>
            exit
              .transition()
              .duration(1000)
              .attr("r", 0) // Shrink to 0 radius
              .remove()
        );

      create_tooltip(node, function (d) {
        return (
          "Building ID: " +
          d.name +
          "</br>" +
          "Footfall: " +
          d.value +
          "</br>" +
          "Group: " +
          d.group
        );
      });

      node.on("click", function (d) {
        node.style("opacity", 0.8);
        node.style("stroke", "none");

        // Add border stroke to clicked bar
        d3.select(this).style("stroke", "black").style("stroke-width", 1);
        d3.select(this).style("opacity", 1);

        // Get clicked element value
        selectedBubble = d3.select(this).data()[0]["name"];
        selectedBubbleCategory = d3.select(this).data()[0]["group"];
        console.log("selected bubble  is " + selectedBubbleCategory);

        create_bar_line_chart();
        console.log("dispatching event...");
        document.dispatchEvent(new Event("BubbleSelected"));
      });

      // Features of the forces applied to the nodes:
      simulation = d3
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
        .force(
          "collide",
          d3
            .forceCollide()
            .strength(0.5)
            .radius((d) => radiusScale(d.value) + 1)
            .iterations(1)
        );

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
      // Generate a random index
      let randomIndex = Math.floor(Math.random() * chart_data.length);

      // After the nodes are created
      node.each(function (d, i) {
        // If current index is the random index
        if (i === randomIndex) {
          // Trigger the click event
          this.dispatchEvent(new Event("click"));
        }
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

function groupAndAggregateData(d) {
  // Access the data for the selected month, day, portion of day, and commercial id

  // Initialize an empty object for the aggregated data
  barLineChartData = {};

  // Iterate over the filtered data
  for (let i = 0; i < d.length; i++) {
    let data = d[i];

    // Extract the hour from the timestamp
    let hour = new Date(data.time).getUTCHours();

    // Initialize the hour group if it doesn't exist
    if (!barLineChartData[hour]) {
      barLineChartData[hour] = {
        hour: formatHour(hour), // Format the hour
        totalOccupancy: 0,
        expenditure: 0,
      };
    }

    // Aggregate the total occupancy and expenditure
    barLineChartData[hour].totalOccupancy += 1;
    barLineChartData[hour].expenditure += data.total_expenditure;
  }
}

function formatHour(hour) {
  let period = hour < 12 ? "AM" : "PM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return hour + " " + period;
}

async function create_bar_line_chart() {
  await fetch(
    `/patternsOfLife/totalExpendituresByLocationId/${selectedYear}/${selectedMonth}/${selectedDay}/${selectedTimeOfDay}/${selectedBubble}`
  )
    .then((res) => res.json())
    .then((d) => {
      document.querySelector(
        "#bar-line-chart-title"
      ).textContent = `Occupancy and ${
        selectedBubbleCategory === "Workplace" ? "Salary" : "Expenditure"
      } at ${selectedBubbleCategory} ${selectedBubble} on a ${selectedDay} ${selectedTimeOfDay} in ${selectedMonth}`; // document.getElementById(
      //   "bar-line-chart-title"
      // ).textContent = `Bar+Line Chart for ${selectedBubbleCategory} ${selectedBubble} on ${selectedDay} ${selectedTimeOfDay} in ${selectedMonth}`;
      groupAndAggregateData(d);

      d3.select("#bar-line-chart").selectAll("*").remove();
      let margin = { top: 100, right: 80, bottom: 70, left: 80 };
      let data = Object.values(barLineChartData);
      data.sort((a, b) => a.hour - b.hour);
      let svg = d3.select("#bar-line-chart"),
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

      let z = d3.scaleOrdinal(colorScheme);
      let keys = ["Workplace", "Pub", "Restaurant"];
      z.domain(keys);

      let x = d3.scaleBand().rangeRound([0, width]).padding(0.4);
      let y = d3.scaleLinear().rangeRound([height, 0]);
      let bandwidth = Math.min(x.bandwidth(), maxBarWidth);
      let yRight = d3.scaleLinear().rangeRound([height, 0]); // Define a new y-scale for the right axis

      x.domain(
        data.map(function (d) {
          return d.hour;
        })
      );
      y.domain([
        0,
        d3.max(data, function (d) {
          return d.totalOccupancy;
        }),
      ]);
      yRight.domain([
        0,
        d3.max(data, function (d) {
          return d.expenditure;
        }),
      ]); // Set the domain of the right y-scale

      let chart = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Translate the chart area within the margins

      chart
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .append("text") // Append a text element for the x-axis label
        .attr("fill", "#000")
        .attr("y", 35) // Position the label below the x-axis
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .text("Time");

      chart
        .append("g")
        .call(d3.axisLeft(y))
        .append("text") // Append a text element for the y-axis label
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)") // Rotate the label to be vertical
        .attr("y", -50) // Position the label to the left of the y-axis
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Total Occupancy");

      let rightAxis = chart
        .append("g")
        .attr("transform", "translate(" + width + ",0)") // Translate the right y-axis to the right side of the chart
        .call(d3.axisRight(yRight));

      rightAxis
        .append("text") // Append a text element for the right y-axis label
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)") // Rotate the label to be vertical
        .attr("y", 50) // Position the label to the right of the y-axis
        .attr("x", -height / 2)
        .attr("dy", "1em") // Shift the label down slightly
        .style("text-anchor", "middle")
        .text(
          selectedBubbleCategory === "Workplace"
            ? "Total Salary"
            : "Total Expenditure"
        );

      let legendData =
        selectedBubbleCategory === "Workplace"
          ? ["Total Occupancy", "Total Salary"]
          : ["Total Occupancy", "Total Expenditure"];
      let legend = svg
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(legendData)
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
          return "translate(0," + i * 20 + ")";
        });

      legend.each(function (d) {
        if (d === "Total Occupancy") {
          d3.select(this)
            .append("rect")
            .attr("x", width + margin.left)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z(selectedBubbleCategory));
        } else {
          d3.select(this)
            .append("line")
            .attr("x1", width + margin.left)
            .attr("y1", 10)
            .attr("x2", width + margin.left + 19)
            .attr("y2", 10)
            .attr("stroke-width", 2)
            .attr("stroke", "black");
        }
      });

      legend
        .append("text")
        .attr("x", width + margin.left - 10)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function (d) {
          return d;
        });

      chart
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "line-bar")
        .attr("x", function (d) {
          return x(d.hour) + (x.bandwidth() - bandwidth) / 2;
        })
        .attr("y", function (d) {
          return y(d.totalOccupancy);
        })
        .attr("width", bandwidth)
        .attr("height", function (d) {
          let barHeight = height - y(d.totalOccupancy);
          if (isNaN(barHeight)) {
            console.error("Invalid bar height", d, barHeight);
            return 0;
          }
          return barHeight;
        })
        .attr("fill", function (d) {
          return z(selectedBubbleCategory);
        });

      create_tooltip(chart.selectAll(".line-bar"), function (d) {
        return (
          "Time: " +
          d.hour +
          "</br>" +
          "Total Occupancy: " +
          d.totalOccupancy +
          "</br>" +
          (selectedBubbleCategory === "Workplace"
            ? "Total Salary: $"
            : "Total Expenditure: $") +
          d.expenditure.toFixed(2)
        );
      });

      let line = d3
        .line()
        .x(function (d) {
          return x(d.hour) + (x.bandwidth() - bandwidth) / 2 + maxBarWidth / 2;
        }) // Center the line in the bars
        .y(function (d) {
          return yRight(d.expenditure);
        }); // Use the right y-scale for the line chart

      // Add the line chart to the SVG
      chart
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("opacity", "0.8")
        .attr("stroke-width", 1)
        .attr("d", line);

      chart
        .selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d) {
          return x(d.hour) + (x.bandwidth() - bandwidth) / 2 + maxBarWidth / 2;
        })
        .attr("cy", function (d) {
          return yRight(d.expenditure);
        })
        .attr("r", 5) // Radius of circle
        .attr("fill", "black");

      create_tooltip(chart.selectAll(".dot"), function (d) {
        return (
          "Time: " +
          d.hour +
          "</br>" +
          "Total Occupancy: " +
          d.totalOccupancy +
          "</br>" +
          (selectedBubbleCategory === "Work"
            ? "Total Salary: "
            : "Total Expenditure: ") +
          d.expenditure.toFixed(2)
        );
      });
    });
}

function create_tooltip(selection, formatTooltip) {
  var tooltip = d3.select("body").append("div").attr("class", "hovertooltip");
  selection
    .on("mouseover", function (event, d) {
      if (
        selection.node() !== d3.selectAll(".symbol").node() &&
        selection.node() !== d3.selectAll(".line-bar").node()
      ) {
        d3.select(this).style("cursor", "pointer");
      }
      tooltip.style("visibility", "visible").html(formatTooltip(d));
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", event.pageY - 70 + "px")
        .style("left", event.pageX + 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("cursor", "default");
      tooltip.style("visibility", "hidden");
    });
}

function getEmoji(key) {
  let emojis = {
    pub: "🍻",
    home: "🏠",
    restaurant: "🍔",
    workplace: "🏢",
    money: "🤑",
  };
  return emojis[key];
}
