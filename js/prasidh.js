let data;
let groupedData;
let selectedMonth;
let selectedDay;

document.addEventListener("DOMContentLoaded", (event) => {
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
      // Create the chart with groupedData

      create_grouped_bar_chart();
    })
    .catch(function (error) {
      console.log(error);
    });
});

function create_grouped_bar_chart() {
  console.log(groupedData);
  let svg = d3.select("#grouped-bar-chart");

  let margin = { top: 20, right: 40, bottom: 50, left: 60 };
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

  let keys = ["Work", "Home", "Pub", "Restaurant", "Unknown"];
  x0.domain(groupedData.map((d) => d.key));
  x1.domain(keys).rangeRound([0, x0.bandwidth()]);
  y.domain([
    0,
    d3.max(groupedData, (d) => d3.max(keys, (key) => d[key])),
  ]).nice();

  // Draw the bars
  g
    .append("g")
    .selectAll("bars")
    .data(groupedData)
    .enter()
    .append("g")
    .attr("transform", (d) => "translate(" + x0(d.key) + ",0)")
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
  g
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x0));

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
        (height + margin.top + margin.bottom - 20) +
        ")"
    )
    .style("text-anchor", "middle")
    .style("font-size","10px")
    .text("Portion of Day");

    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 2 - 30) // Adjust this value as needed
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size","10px")
    .text("Total Commutes");
}

function get_month_and_day() {
  // let month = document.getElementById("month").value;
  // let day = document.getElementById("day").value;
  // TODO: Remove hard codes and use selected values
  selectedMonth = "March";
  selectedDay = "Wednesday";
}
