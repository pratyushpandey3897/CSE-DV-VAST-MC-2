let globalData;
let lineData;
let groupedData;
let bubbleData;
let selectedMonth = "March";
let selectedDay = "Sunday";
let selectedTimeOfDay = "morning"

document.addEventListener("DOMContentLoaded", (event) => {
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

  d3.json("parsedData/commute_counts_rpe.json").then(function (loadedData) {
    console.log(loadedData);
    create_beeswarm_chart(loadedData);
  });



  // Select menus for comparing lives
  personSelect1 = document.getElementById("personSelect1");
  personSelect1.addEventListener("change", personChange)
  personSelect2 = document.getElementById("personSelect2");
  personSelect2.addEventListener("change", personChange)

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
    });
  });
}

function prepare_beeswarm_data(data) {
  return (bubbleData = data[selectedMonth][selectedDay][selectedTimeOfDay]);
}

function create_beeswarm_chart(data) {
  prepare_beeswarm_data(data);

  var svg = d3.select("#beeswarm-chart");
  let margin = { top: 60, right: 60, bottom: 50, left: 50 };
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
  var x = d3.scaleOrdinal().domain([1, 2, 3]).range([500, 600, 740]);

  var minValue = d3.min(chart_data, d => d.value);
  var maxValue = d3.max(chart_data, d => d.value);

  var radiusScale = d3.scaleSqrt()
    .domain([minValue, maxValue]) // input range
    .range([4, 20]); // output range

  // A color scale
  var color = d3
    .scaleOrdinal()
    .domain([1, 2, 3])
    .range(["#F8766D", "#00BA38", "#619CFF"]);

  // Initialize the circle: all located at the center of the svg area
  var node = svg
    .append("g")
    .selectAll("circle")
    .data(chart_data)
    .enter()
    .append("circle")
    .attr("r", d => radiusScale(d.value))
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .style("fill", function (d) {
      return color(d.group);
    })
    .style("fill-opacity", 0.8)
    .attr("stroke", "black")
    .style("stroke-width", 1)
    .call(
      d3
        .drag() // call specific function when circle is dragged
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  // Features of the forces applied to the nodes:
  var simulation = d3
    .forceSimulation()
    .force(
      "x",
      d3
        .forceX()
        .strength(1)
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
    .force(
      "center",
      d3
        .forceCenter()
        .x(width / 2)
        .y(height / 2)
    ) // Attraction to the center of the svg area
    .force("charge", d3.forceManyBody().strength(-50)) // Nodes are attracted one each other of value is > 0
    .force("collide", d3.forceCollide().strength(0.1).radius(10).iterations(1)); // Force that avoids circle overlapping

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
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

function createLineChart(data, chartName) {
  
  d3.selectAll(`.${chartName}Child`).remove()
  d3.selectAll(".dateLabels").remove()

  data.forEach((item) => {
    let date = Object.keys(item)[0];
    let places = item[date];


    let personsvg = d3.select(`#${chartName}`).append("svg").attr("class", `${chartName}Child`).attr("width", 350).attr("height", 100),
      margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = +personsvg.attr("width") - margin.left - margin.right,
      height = +personsvg.attr("height") - margin.top - margin.bottom,
      g = personsvg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    let x = d3.scaleTime().rangeRound([0, width]).domain([new Date(date + " 00:00"), new Date(date + " 23:59")]);
    let xAxis = d3.axisBottom(x).ticks(d3.timeHour.every(3), "%I %p");

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .select(".domain")
      .remove();

    g.selectAll(".dot")
      .data(places)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", function (d) { return x(new Date(d.startTime)); })
      .attr("cy", height / 2)
      .attr("r", 3.5);


      
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