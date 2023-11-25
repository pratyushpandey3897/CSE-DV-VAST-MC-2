const emojis = {
  Pub: "🍺",
  Apartment: "🏠",
  Restaurant: "🍜",
  Workplace: "🏢",
  School: "🎒",
  money: "🤑",
};

function createLineChart(data, chartName) {
  console.log("creating line chart with data: ", data);

  d3.selectAll(`.${chartName}Child`).remove();
  d3.selectAll(".dateLabels").remove();

  // Sort data based on dates
  var sortedDates = Object.keys(data).sort();
  var lopDiv = document.getElementById("lives-of-people");

  // If there are 5 dates then set height to 600px. Else 500px.
  if (sortedDates.length >= 5) {
    lopDiv.style.height = "600px";
  } else {
    lopDiv.style.height = "500px";
  }

  sortedDates.forEach((item) => {
    // console.log("for date: ", item)
    let date = item;
    let places = data[date];

    var inputDate = new Date(date);

    var year = inputDate.getUTCFullYear();
    var month = ("0" + (inputDate.getUTCMonth() + 1)).slice(-2);
    var day = ("0" + inputDate.getUTCDate()).slice(-2);
    var outputDateString = month + "-" + day + "-" + year;

    var margin = { top: 10, right: 20, bottom: 20, left: 20 },
      width = 450 - margin.left - margin.right,
      height = 100 - margin.top - margin.bottom;

    let personsvg = d3
      .select(`#${chartName}`)
      .append("svg")
      .attr("class", `${chartName}Child`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    let g = personsvg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const timeOfDayMap = {
      Morning: [new Date(date + "T00:00:00Z"), new Date(date + "T12:00:00Z")],
      Afternoon: [new Date(date + "T12:00:00Z"), new Date(date + "T16:00:00Z")],
      Evening: [new Date(date + "T16:00:00Z"), new Date(date + "T19:00:00Z")],
      Night: [new Date(date + "T19:00:00Z"), new Date(date + "T23:59:59Z")],
    };

    let x = d3
      .scaleUtc()
      .range([0, width])
      .domain(timeOfDayMap[selectedTimeOfDay]);
    var ticksFrequency = 1;
    if (selectedTimeOfDay == "Morning") {
      ticksFrequency = 2;
    }
    let xAxis = d3
      .axisBottom(x)
      .ticks(d3.utcHour.every(ticksFrequency))
      .tickFormat(d3.utcFormat("%I %p"));

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .attr("stroke-width", 0.5);

    g.selectAll(".symbol")
      .data(places)
      .enter()
      .append("text")
      .attr("class", "symbol")
      .attr("x", function (d) {
        dt = x(new Date(d.endTime)) - 10;
        console.log(dt);
        return dt;
      })
      .attr("y", height / 2)
      .text((d) => emojis[d.place])
      .attr("font-size", 16);

    let dateLabel = d3
      .select("#activityDatePanel")
      .append("div")
      .attr("class", "dateLabels")
      .style("height", "100px")
      .style("padding-top", "65px");
    // Add date next to the chart
    dateLabel
      .append("text")
      .attr("y", 60)
      .attr("class", "dateLabels")
      .text(outputDateString);
  });

  // Create tooltip
  create_tooltip(d3.selectAll(".symbol"), function (d) {
    let startTime = new Date(d.startTime);
    let endTime = new Date(d.endTime);
    let startHour = startTime.getUTCHours();
    let startMins = startTime.getUTCMinutes();
    let endHour = endTime.getUTCHours();
    let endMins = endTime.getUTCMinutes();
    if (startHour < 10) {
      startHour = "0" + startHour;
    }
    if (startMins < 10) {
      startMins = "0" + startMins;
    }
    if (endHour < 10) {
      endHour = "0" + endHour;
    }
    if (endMins < 10) {
      endMins = "0" + endMins;
    }

    let placeText =
      emojis[d.place] +
      " " +
      d.place.charAt(0).toUpperCase() +
      d.place.slice(1);

    var text =
      "Building ID: " +
      d.pointId +
      "</br> Type: " +
      placeText +
      "</br> Start Time: " +
      startHour +
      ":" +
      startMins +
      "</br> End Time: " +
      endHour +
      ":" +
      endMins;
    return text;
  });
}
function populatePersonSelector() {
  //Remove existing options.
  while (personSelect1.options.length > 0) {
    personSelect1.remove(0);
  }
  while (personSelect2.options.length > 0) {
    personSelect2.remove(0);
  }

  //Clear the comparision chart

  d3.selectAll(`.person1Child`).remove();
  d3.selectAll(`.person2Child`).remove();
  d3.selectAll(".dateLabels").remove();

  // Get list of 10 people
  fetch(
    `http://localhost:3000/patternsOfLife/top10Participants/${selectedYear}/${selectedMonth}/${selectedDay}`
  )
    .then((response) => response.json())
    .then((dayData) => {
      console.log("fetched person data ", dayData);

      if (dayData) {
        options = Object.keys(dayData);
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
    })
    .catch((error) => console.log(error));
}

function personChange(event) {
  var id = event.target.id;
  var select = document.getElementById(id);
  selectedPersonValue = select.value;
  var chartName;
  if (id == "personSelect1") {
    selectedPerson1 = select.value;
    chartName = "person1";
  } else {
    selectedPerson2 = select.value;
    chartName = "person2";
  }
  getActivityData(selectedPersonValue)
    .then((result) => {
      createLineChart(result, chartName);
    })
    .catch((error) => {
      console.error(error);
    });
}

function getActivityData(id) {
  return new Promise((resolve, reject) => {
    let visitedPlaces = [];
    fetch(
      `http://localhost:3000/patternsOfLife/top10Participants/${selectedYear}/${selectedMonth}/${selectedDay}`
    )
      .then((response) => response.json())
      .then((dayData) => {
        if (dayData && dayData[id]) {
          for (let date in dayData[id]) {
            if (!visitedPlaces[date]) {
              visitedPlaces[date] = [];
            }
            // TODO: Check if exists
            dayData[id][date][selectedTimeOfDay].forEach((activity) => {
              visitedPlaces[date].push({
                place: activity.end.type,
                startTime: activity.starttime,
                endTime: activity.endtime,
                pointId: activity.end.pointId,
              });
            });
          }
        }

        resolve(visitedPlaces);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function updateComparisonChart() {
  if (typeof selectedPerson1 !== "undefined" && selectedPerson1 !== null) {
    getActivityData(selectedPerson1)
      .then((result) => {
        createLineChart(result, "person1");
      })
      .catch((error) => {
        console.error(error);
      });
  }
  if (typeof selectedPerson2 !== "undefined" && selectedPerson2 !== null) {
    getActivityData(selectedPerson2)
      .then((result) => {
        createLineChart(result, "person2");
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

function drawComparisionChartLegend() {
  // Define the legend data
  const legendData = [
    { label: "Pub", icon: "🍺" },
    { label: "Home", icon: "🏠" },
    { label: "Restaurant", icon: "🍜" },
    { label: "Employer", icon: "🏢" },
    { label: "School", icon: "🎒" },
  ];
  // Set up the SVG container
  const svg = d3.select("#legendArea");

  // Create the legend
  const legend = svg
    .selectAll(".legend")
    .data(legendData)
    .enter()
    .append("div")
    .attr("class", "legend")
    .style("padding", "16px")
    .style("height", "32px");

  // Add the legend icons
  legend.append("text").text((d) => d.icon);

  // Add the legend labels
  legend.append("text").text((d) => d.label);
}
