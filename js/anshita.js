
function getEmoji(key) {
    let emojis = {
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

    // Sort data based on dates
    var sortedDates = Object.keys(data).sort();

    sortedDates.forEach((item) => {
        let date = item;
        let places = data[date];


        var inputDate = new Date(date);

        var year = inputDate.getUTCFullYear();
        var month = ('0' + (inputDate.getUTCMonth() + 1)).slice(-2);
        var day = ('0' + inputDate.getUTCDate()).slice(-2);
        var outputDateString = month + '-' + day + '-' + year;

        var margin = { top: 10, right: 20, bottom: 20, left: 20 },
            width = 450 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        let personsvg = d3.select(`#${chartName}`)
            .append("svg")
            .attr("class", `${chartName}Child`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        let g = personsvg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const timeOfDayMap = {
            "morning": [new Date(date + "T00:00:00Z"), new Date(date + "T12:00:00Z")],
            "afternoon": [new Date(date + "T12:00:00Z"), new Date(date + "T16:00:00Z")],
            "evening": [new Date(date + "T16:00:00Z"), new Date(date + "T19:00:00Z")],
            "night": [new Date(date + "T19:00:00Z"), new Date(date + "T23:59:59Z")]
        }

        let x = d3.scaleUtc().range([0, width]).domain(timeOfDayMap[selectedTimeOfDay]);
        let xAxis = d3.axisBottom(x).ticks(d3.timeHour.every(1), "%I %p");

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        /*
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
        */
        g.selectAll(".symbol")
            .data(places)
            .enter()
            .append("text")
            .attr("class", "symbol")
            .attr("x", function (d) { dt = x(new Date(d.startTime)); return dt })
            .attr("y", height / 2)
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
            .text(outputDateString);
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
    

    d3.selectAll(`.person1Child`).remove()
    d3.selectAll(`.person2Child`).remove()
    d3.selectAll(".dateLabels").remove()

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
    selectedPersonValue = select.value;
    var chartName;
    if (id == "personSelect1") {
        selectedPerson1 = select.value;
        chartName = "person1";
    } else {

        selectedPerson2 = select.value;
        chartName = "person2"
    }
    getActivityData(selectedPersonValue).then(result => {
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
                            // TODO: Check if exists
                            dayData[id][date][selectedTimeOfDay].forEach(activity => {
                                visitedPlaces[date].push({
                                    place: activity.end.type,
                                    startTime: activity.starttime,
                                    endTime: activity.endtime
                                });
                            });
                        }
                    }
                }

                resolve(visitedPlaces)
            })
            .catch(error => {
                reject(error);
            });
    });
}

function updateComparisionChart() {
    getActivityData(selectedPerson1).then(result => {
        createLineChart(result, "person1");
    }).catch(error => {
        console.error(error);
    });

    getActivityData(selectedPerson2).then(result => {
        createLineChart(result, "person2");
    }).catch(error => {
        console.error(error);
    });
}