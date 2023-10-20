d3.select('body').attr("style", "font-family: arial;");
d3.select('body').append('h1').text(Heading);

// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 40, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 420 - margin.top - margin.bottom;
// set the ranges
var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear().range([height, 0]);

// append the svg object to the body of the page
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('x','-150')
    .attr('y','-30')
    .attr('transform', 'rotate(-90)')
    .text(Y_Axis_Label);
svg.append('text') 
    .attr('x',150)
    .attr('y','410')
    .text(X_Axis_Label);
// Parse the Data

d3.csv(DataFileName, function (data) {
    var subgroup = getSubgroups();
    // ['female_character_percentage', 'male_character_percentage']
    console.log(subgroup);
    // List of subgroups = header of the csv files = soil condition here
    r = 0
    min_year = 2020;
    max_year = 1900;
    xSeries = [];
    // List of groups = species here = value of the first column called group -> I show them on the X axis
    data.forEach(function (d) {
        d.year = d.year;
        d.movie_id = d.movie_id;
        d.word_male = +d[subgroup[1]];
        d.word_female = +d[subgroup[0]];
        if (d.year < min_year) min_year = d.year;
        if (d.year > max_year) max_year = d.year;
        xSeries.push(d.year);
        console.log(r++, d.year, d.movie_id, d.word_male, d[subgroup[1]], d.word_female, d.word_percentage_f);
    });
    var ySeries = data.map(function (d) { return parseFloat(d['word_female']); });
    console.log(xSeries, ySeries);
    var leastSquaresCoeff = leastSquares(xSeries, ySeries);
    var x1 = min_year;
    var y1 = leastSquaresCoeff[0] * x1 + leastSquaresCoeff[1];
    var x2 = max_year;
    var y2 = leastSquaresCoeff[0] * x2 + leastSquaresCoeff[1];
    var girls_avg = leastSquaresCoeff[2].toFixed();
    var boys_avg = 100 - girls_avg;
    var trend_slope = (leastSquaresCoeff[0] * 100).toFixed(2);
    //d3.select("body").append("span").text("GIRLS AVG :" + girls_avg + "% BOYS AVG: " + boys_avg + "%" + " TREND SLOPE : " + trend_slope + "%");

    min_year = (+(min_year / 10).toFixed() - 1) * 10;
    max_year = (+(max_year / 10).toFixed() + 1) * 10;
    x.domain([min_year, max_year]);
    y.domain([0, 100]);
    //console.log(x.bandwidth());
    // Add X axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d3.format("d")));

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(4,"2f"));

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(subgroup)
        .range(['#e41a1c', '#377eb8'])

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
        .keys(subgroup)
        (data)
    //console.log(stackedData);
    // Show the bars
    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
        .attr("fill", function (d) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function (d) { console.log(d); return d; })
        .enter().append("rect")
        .on("mouseover", function (d) {

            var xPos = parseFloat(d3.select(this).attr("x"));
            var yPos = parseFloat(d3.select(this).attr("y"));
            var height = parseFloat(d3.select(this).attr("height"))

            d3.select(this).attr("stroke", "black").attr("stroke-width", 0.8);

            svg.append("text")
                .attr("x", xPos)
                .attr("y", yPos + height / 2)
                .attr("class", "tooltip")
                .text(d.data.year + ": " + ((d[1].toFixed(2) == 100) ? 100 - d[0] : d[1]).toFixed(2) + "%");


        })
        .on("mouseout", function () {
            svg.select(".tooltip").remove();
            d3.select(this).attr("stroke-width", 0);
        })
        .attr("x", function (d) { return x(d.data.year); })
        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return y(d[0]) - y(d[1]); })
        .attr("width", x(2022) - x(2021))

    svg.append("g")
        .append("text")
        .attr("style", "fill: white;")
        .attr("x", x(2000))
        .attr("y", y(50))
        .text(boys_avg + "% Male")

    svg.append("g")
        .append("text")
        .attr("style", "fill: white;")
        .attr("x", x(2000))
        .attr("y", y(15))
        .text(girls_avg + "% Female")

    svg.append("g")
        .attr("style", "fill: black;")
        .append("text")
        .attr("x", x(+x2 - 10))
        .attr("y", y(+y2 + 1))
        .text(trend_slope + "% Slope ")

    r = svg.append("path")
        .data([[[x1, y1], [x2, y2]]])
    console.log(r);
    r.attr("class", "line")
        .style("stroke", "black")
        .attr("d", d3.line()
            .x(function (d) { console.log('x' + d + ' ' + d[0]); return x(d[0]); })
            .y(function (d) { console.log('y' + d); return y(d[1]); }));
})
// returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
    var reduceSumFunc = function (prev, cur) { return (+prev) + (+cur); };

    var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    var ssXX = xSeries.map(function (d) { return Math.pow(d - xBar, 2); })
        .reduce(reduceSumFunc);

    var ssYY = ySeries.map(function (d) { return Math.pow(d - yBar, 2); })
        .reduce(reduceSumFunc);

    var ssXY = xSeries.map(function (d, i) { return (d - xBar) * (ySeries[i] - yBar); })
        .reduce(reduceSumFunc);

    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = 0;// Math.pow(ssXY, 2) / (ssXX * ssYY);
    console.log(slope, intercept, yBar);

    return [slope, intercept, yBar];
}
