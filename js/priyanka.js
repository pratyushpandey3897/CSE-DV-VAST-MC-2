// let globalDataBarLineChart;
// let groupedDataBLChart;
// let selectedMonthBLChart = "March";
// let selectedDayBLChart = "Tuesday";
// let selectedTimeOfDayBLChart = "Night"
// let selectedCommercialIdBLChart = "894"
// margin = {top: 20, right: 80, bottom: 70, left: 80}, // Increase bottom and left margins to make room for labels

// document.addEventListener("DOMContentLoaded", (event) => {
//     d3.csv("data/commercial_expenditures_occupancy.csv")
//       .then(function (barLineData) {
//         groupAndAggregateData(barLineData);
//         create_bar_line_chart();
//     })
//       .catch(function (error) {
//         console.log(error);
//     });    
// });

// function groupAndAggregateData(barLineData) {
//     globalDataBarLineChart = barLineData;
//     groupedDataBLChart = globalDataBarLineChart.reduce((acc, curr) => {
//         // Filter based on selected variables
//         if (curr.month === selectedMonthBLChart && curr.day_of_week === selectedDayBLChart && curr.portion_of_day === selectedTimeOfDayBLChart && curr.commercialId === selectedCommercialIdBLChart) {
//             // Extract the hour from start_time
//             let hour = new Date(curr.start_time).getHours();
//             // Initialize the hour group if it doesn't exist
//             if (!acc[hour]) {
//                 acc[hour] = {
//                     hour : formatHour(hour),
//                     totalOccupancy: 0,
//                     expenditure: 0
//                 };
//             }
//             // Aggregate the total occupancy and increment the count
//             acc[hour].totalOccupancy += 1;
//             acc[hour].expenditure += parseFloat(curr.expenditures);
//         }

//         return acc;
//     }, {});
//     console.log(groupedDataBLChart);
// }

// function formatHour(hour) {
//     let period = hour < 12 ? 'AM' : 'PM';
//     hour = hour % 12;
//     hour = hour ? hour : 12;
//     return hour + ' ' + period;
// }
// function create_bar_line_chart() {
//     let data = Object.values(groupedDataBLChart);
//     data.sort((a, b) => a.hour - b.hour);
//     let svg = d3.select("#bar_line_chart"),
//     width = +svg.attr("width") - margin.left - margin.right,
//     height = +svg.attr("height") - margin.top - margin.bottom;

//     let x = d3.scaleBand().rangeRound([0, width]).padding(0.4);
//     let y = d3.scaleLinear().rangeRound([height, 0]);
//     let yRight = d3.scaleLinear().rangeRound([height, 0]); // Define a new y-scale for the right axis


//     x.domain(data.map(function(d) { return d.hour; }));
//     y.domain([0, d3.max(data, function(d) { return d.totalOccupancy; })]);
//     yRight.domain([0, d3.max(data, function(d) { return d.expenditure; })]); // Set the domain of the right y-scale

//     let chart = svg.append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Translate the chart area within the margins

//     chart.append("g")
//         .attr("transform", "translate(0," + height + ")")
//         .call(d3.axisBottom(x))
//         .append("text") // Append a text element for the x-axis label
//         .attr("fill", "#000")
//         .attr("y", 35) // Position the label below the x-axis
//         .attr("x", width / 2)
//         .attr("text-anchor", "middle")
//         .text("Time");

//     chart.append("g")
//         .call(d3.axisLeft(y))
//         .append("text") // Append a text element for the y-axis label
//         .attr("fill", "#000")
//         .attr("transform", "rotate(-90)") // Rotate the label to be vertical
//         .attr("y", -50) // Position the label to the left of the y-axis
//         .attr("x", -height / 2)
//         .attr("text-anchor", "middle")
//         .text("Total Occupancy");

//     let rightAxis = chart.append("g")
//         .attr("transform", "translate(" + width + ",0)") // Translate the right y-axis to the right side of the chart
//         .call(d3.axisRight(yRight)); 

//     rightAxis.append("text") // Append a text element for the right y-axis label
//         .attr("fill", "#000")
//         .attr("transform", "rotate(-90)") // Rotate the label to be vertical
//         .attr("y", 50) // Position the label to the right of the y-axis
//         .attr("x", -height / 2)
//         .attr("dy", "1em") // Shift the label down slightly
//         .style("text-anchor", "middle")
//         .text("Total Expenditure");

//         var tooltip = d3.select("body")
//         .append("div")
//         .style("position", "absolute")
//         .style("background-color", "white")
//         .style("border", "solid")
//         .style('font-size', '18px')
//         .style("border-width", "2px")
//         .style("border-radius", "6px")
//         .style("padding", "10px")
//         .style("visibility", "hidden");

//     let legend = svg.append("g")
//         .attr("font-family", "sans-serif")
//         .attr("font-size", 10)
//         .attr("text-anchor", "end")
//         .selectAll("g")
//         .data(["Total Occupancy", "Total Expenditure"])
//         .enter().append("g")
//         .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

//     legend.append("rect")
//         .attr("x", width - 19)
//         .attr("width", 19)
//         .attr("height", 19)
//         .attr("fill", function(d) { return d === "Total Occupancy" ? "lightgreen" : "steelblue"; });

//     legend.append("text")
//         .attr("x", width - 24)
//         .attr("y", 9.5)
//         .attr("dy", "0.32em")
//         .text(function(d) { return d; });

//     chart.selectAll(".bar")
//         .data(data)
//         .enter().append("rect")
//         .attr("class", "bar")
//         .attr("x", function(d) { return x(d.hour); })
//         .attr("y", function(d) { return y(d.totalOccupancy); })
//         .attr("width", x.bandwidth())
//         .attr("height", function(d) { 
//             let barHeight = height - y(d.totalOccupancy);
//             if (isNaN(barHeight)) {
//                 console.error('Invalid bar height', d, barHeight);
//                 return 0;
//             }
//             return barHeight;
//         })
//         .attr("fill", "lightgreen")
//         .on('mouseover', function (_, d) {
//             console.log(d.totalOccupancy);

//             tooltip
//                 .style("visibility", "visible")
//                 .html(
//                 'Time: ' + d.hour 
//                 + '</br>' + 'Total Occupancy: ' + d.totalOccupancy);
//         }).on('mousemove', function (event, d) {
//             tooltip
//                 .style("top", (event.pageY - 70) + "px")
//                 .style("left", (event.pageX + 20) + "px");
//         })
//         .on('mouseout', function () {
//             tooltip.style("visibility", "hidden");
//         })

//     let line = d3.line()
//     .x(function(d) { return x(d.hour) + x.bandwidth() / 2; }) // Center the line in the bars
//     .y(function(d) { return yRight(d.expenditure); }); // Use the right y-scale for the line chart

//     // Add the line chart to the SVG
//     chart.append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "steelblue")
//         .attr("stroke-width", 1.5)
//         .attr("d", line);

//     chart.selectAll(".dot")
//         .data(data)
//         .enter().append("circle") // Append circle elements
//         .attr("class", "dot") // Assign a class for styling
//         .attr("cx", function(d) { return x(d.hour) + x.bandwidth() / 2; })
//         .attr("cy", function(d) { return yRight(d.expenditure); })
//         .attr("r", 4) // Radius of circle
//         .attr("fill", "steelblue")
//         //.attr("stroke", "#fff")
//         .on('mouseover', function (_, d) {
//             console.log(d.expenditure);
//             tooltip
//                 .style("visibility", "visible")
//                 .html(
//                 'Time: ' + d.hour 
//                 + '</br>' + 'Total Expenditure: ' + d.expenditure.toFixed(2));
//         }).on('mousemove', function (event, d) {
//             tooltip
//                 .style("top", (event.pageY - 70) + "px")
//                 .style("left", (event.pageX + 20) + "px");
//         })
//         .on('mouseout', function () {
//             tooltip.style("visibility", "hidden");
//         });
//         //attr("stroke-width", "1.5px"); 
// }

  