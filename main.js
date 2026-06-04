//Global variables
const topMargin = 30;
const sideMargin = 250;
const width = 1200; 
const height = 500;
const parseTime = d3.timeParse("%Y"); //time parser for years
            
//Load WSDOT datasets and GeoJSON file
Promise.all([
    d3.csv("WSDOT Crash Causes 2015-2025.csv"),
    d3.json("wa-counties.geo.json"),
    d3.csv("WSDOT County Crashes 2025.csv"),
    d3.csv("WSDOT Fatalities and Injuries 2025.csv")
]).then(function(files) {
const data = {
    "line": files[0].map(d => ({
        year: parseTime(d.Year), //parse Year as time data
        distracted: +d.Distracted,
        speeding: +d.Speeding,
        alcohol: +d.Alcohol,
        drugs: +d.Drugs,
        drowsy: +d.Drowsy
    })),
    "map": files[2].map(d => ({
        county: d.County,
        crashes: +d.Crashes
    })),
    "bar": files[3].map(d => ({
        users: d["Road User Groups"],
        fatalities: +d.Fatalities,
        injuries: +d["Serious Injuries"]
    }))
};
// World map data
const waCounties = files[1];
const waMap = new Map();
data.map.forEach(d => {
    waMap.set(d.county, d.crashes);
});

console.log("datasets", data)


//Chart 1 - Line chart
//Scales
//Time uses Year and Linear uses a 0-100 percentage of the population
const xScaleLine = d3.scaleTime()
    .domain(d3.extent(data.line, d => d.year))
    .range([sideMargin, width-sideMargin]); 

const yScaleLine = d3.scaleLinear()
    .domain([0, 35])
    .range([height-topMargin, topMargin]); 

//Axes
//bottom axis with tick time formatting
const bottomAxisLine = d3.axisBottom()
    .scale(xScaleLine)
    .tickFormat(d3.timeFormat("%Y"));

//left axis with tick percentage formatting
const leftAxisLine = d3.axisLeft()
    .scale(yScaleLine)
    .tickFormat(d => d + "%");

//Select SVG 1  
const svg1 = d3.select("#svg1")//to call an id be sure to use #
        .append("svg")
        .attr("width", width)
        .attr("height", height + 50);

//Line generators
const lineAlone = d3.line()
    .x(d=>xScaleLine(d.year))
    .y(d=>yScaleLine(d.distracted));

const lineCarpool = d3.line()
    .x(d=>xScaleLine(d.year))
    .y(d=>yScaleLine(d.speeding))

const linePublic = d3.line()
    .x(d=>xScaleLine(d.year))
    .y(d=>yScaleLine(d.alcohol))

const lineWalk = d3.line()
    .x(d=>xScaleLine(d.year))
    .y(d=>yScaleLine(d.drugs))

const lineBike = d3.line()
    .x(d=>xScaleLine(d.year))
    .y(d=>yScaleLine(d.drowsy))

//Line rendering and styling
svg1.append("path")
    .data([data.line])
    .attr("d", lineAlone)
    .attr("class", "lineDistracted")

svg1.append("path")
    .data([data.line])
    .attr("d", lineCarpool)
    .attr("class", "lineSpeeding")

svg1.append("path")
    .data([data.line])
    .attr("d", linePublic)
    .attr("class", "lineAlcohol")

svg1.append("path")
    .data([data.line])
    .attr("d", lineWalk)
    .attr("class", "lineDrugs")

svg1.append("path")
    .data([data.line])
    .attr("d", lineBike)
    .attr("class", "lineDrowsy")

//Axes rendering and styling
svg1.append("g")
    .attr("class", "axis") 
    .attr("transform", "translate(0," + (height - topMargin) + ")") 
    .call(bottomAxisLine);    

svg1.append("g")
    .attr("class", "axis") 
    .attr("transform", "translate(" + sideMargin + ",0)")
    .call(leftAxisLine);   

//Axes labels
//bottomAxis
svg1.append("text")
    .attr("class", "label")
    .attr("x", sideMargin + 335)
    .attr("y", height + 10)
    .text("Year")

//leftAxis
svg1.append("text")
    .attr("class", "label")
    .attr("x", sideMargin - 75)
    .attr("y", topMargin - 15)
    .text("% of Total Crashes")

//Line labels
//positioned to right side of lines and matching colors
svg1.append("text")
    .attr("class", "labelDistracted")
    .attr("x", width - sideMargin + 5)
    .attr("y", topMargin + 222)
    .text("Distracted")
    .style("fill", "#e33719");

svg1.append("text")
    .attr("class", "labelSpeeding")
    .attr("x", width - sideMargin + 5)
    .attr("y", topMargin + 180)
    .text("Speeding")
    .style("fill", "#f5a031");

svg1.append("text")
    .attr("class", "labelAlcohol")
    .attr("x", width - sideMargin + 5)
    .attr("y", topMargin + 208)
    .text("Alcohol")
    .style("fill", "#569ae8");

svg1.append("text")
    .attr("class", "labelDrugs")
    .attr("x", width - sideMargin + 5)
    .attr("y", topMargin + 290)
    .text("Drugs")
    .style("fill", "#70bf52");

svg1.append("text")
    .attr("class", "labelDrowsy")
    .attr("x", width - sideMargin + 5)
    .attr("y", topMargin + 412)
    .text("Drowsy")
    .style("fill", "#ba6ded");

//Source
svg1.append("text")
    .attr("class", "source")
    .attr("x", sideMargin - 60)
    .attr("y", height + 40)
    .text("Source: Washington State Department of Transportation - WSDOT Crash Data")


//Chart 2 - Map
//Map SVG element
const mapWidth = 800;
const mapHeight = 550;
const svg2 = d3.select("#svg2")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight + 50);

//Map and projection
const projection = d3.geoMercator()
    .fitSize([mapWidth, mapHeight], waCounties);
const path = d3.geoPath()
    .projection(projection);

//Color scale using dataset
const values = Array.from(waMap.values());
const colorScale = d3.scaleThreshold()
    .domain([100, 500, 1000, 2500, 5000, 10000, 20000])
    .range(d3.schemeYlOrRd[7]);

//Mouse functions for hover effect and tooltip
const mouseOver = function(event, d) {
    const county = d.properties.NAME;
    const value = waMap.get(county) || 0;
    d3.select(this)
        .style("stroke", "white")
        .style("opacity", 1);
    
    tooltip
        .style("opacity", 1)
        .html(`<strong>${county}</strong><br>Crashes: ${value}`);
};

const mouseMove = function(event, d) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
};

const mouseLeave = function(event, d) {
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 0.9);
    
    tooltip.style("opacity", 0);
};

//Tooltip creation and styling
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px 10px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

//Draw map, colorScale uses data to make higher crash counts darker red and lower lighter yellow
svg2.append("g")
    .selectAll("path")
    .data(waCounties.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
        const county = d.properties.NAME;
        const value = waMap.get(county) || 0;
        return colorScale(value);
    })
    .attr("class", "County")
    .style("opacity", 0.9)
    .style("stroke", "black")
    .on("mouseover", mouseOver)
    .on("mousemove", mouseMove)
    .on("mouseleave", mouseLeave);

//Source
svg2.append("text")
    .attr("class", "source")
    .attr("x", sideMargin - 250)
    .attr("y", mapHeight + 30)
    .text("Source: Washington State Department of Transportation - WSDOT Crash Data")


//Chart 3 - Bar
//Scales
//Categories for grouped bars
const subGroups = ["fatalities", "injuries"];

//Band is for road users and Linear is for number of people
const xScaleBar1 = d3.scaleBand()
    .domain(data.bar.map(d => d.users))
    .range([sideMargin, width-sideMargin])
    .padding(0.2);

//Subgroup scale
const xScaleBar2 = d3.scaleBand()
    .domain(subGroups)
    .range([0, xScaleBar1.bandwidth()])
    .padding(0.1);

const yScaleBar = d3.scaleLinear()
    .domain([0, 1200])
    .range([height-topMargin, topMargin]);

//Select SVG 3
const svg3 = d3.select("#svg3")
    .append("svg")
    .attr("width", width)
    .attr("height", height + 90);

//Group for each road user type
const groups = svg3.selectAll(".group")
    .data(data.bar)
    .enter()
    .append("g")
    .attr("class", "group")
    .attr("transform", d => "translate(" + xScaleBar1(d.users) + ",0)");

//Bars
//Two bars for each group, red for fatalities and orange for injuries
groups.selectAll("rect")
    .data(d => subGroups.map(key => ({
        key: key,
        value: d[key]
    })))
    .enter()
    .append("rect")
    .attr("x", d => xScaleBar2(d.key))
    .attr("y", d => yScaleBar(d.value))
    .attr("width", xScaleBar2.bandwidth())
    .attr("height", d => height - topMargin - yScaleBar(d.value))
    .attr("fill", d => d.key === "fatalities" ? "#b81839" : "#fc974d");

//X axis, tilted labels to fit long group names
svg3.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - topMargin})`)
    .call(d3.axisBottom(xScaleBar1))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-20)");

//Y axis
svg3.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + sideMargin + ",0)")
    .call(d3.axisLeft(yScaleBar));

//Axes labels
//bottomAxis
svg3.append("text")
    .attr("class", "label")
    .attr("x", sideMargin + 270)
    .attr("y", height + 40)
    .text("Road User Groups")

//leftAxis
svg3.append("text")
    .attr("class", "label")
    .attr("x", sideMargin - 75)
    .attr("y", topMargin - 15)
    .text("Number of People")

//Fatalities
svg3.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("x", sideMargin + 580)
    .attr("y", topMargin)
    .attr("fill", "#b81839");

svg3.append("text")
    .attr("x", sideMargin + 600)
    .attr("y", topMargin + 12)
    .text("Fatalities");

//Serious Injuries
svg3.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("x", sideMargin + 580)
    .attr("y", topMargin + 20)
    .attr("fill", "#fc974d");

svg3.append("text")
    .attr("x", sideMargin + 600)
    .attr("y", topMargin + 32)
    .text("Serious Injuries");

//Source
svg3.append("text")
    .attr("class", "source")
    .attr("x", sideMargin - 60)
    .attr("y", mapHeight + 25)
    .text("Source: Washington State Department of Transportation - WSDOT Crash Data")

});