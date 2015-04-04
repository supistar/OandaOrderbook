(function(global) {
  "use strict;"

  function initialize(orders, staticPath) {
    var order = $.parseJSON(orders);

    // Calculate max/min values
    var rateMax = order.rate + 2;
    var rateMin = order.rate - 2;

    drawGraph(order, rateMin, rateMax);
  }

  function drawGraph(order, rateMin, rateMax) {
    // Margins
    var margin = {
      upper: 20,
      right: 40,
      bottom: 50,
      left: 40
    };

    // Add drawing area
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var labelWidth = 40;
    var chartWidth = ((windowWidth - margin.right - margin.left - labelWidth) / 2);
    var chartHeight = windowHeight - margin.upper - margin.bottom;
    var svg = d3.select("#view")
      .append("svg")
      .attr("width", windowWidth)
      .attr("height", windowHeight);

    // Set tooltip
    var tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .text("");

    // Set x and y axis
    var rangeOrders = getOrdersByRange(order.orders, rateMin, rateMax);
    console.log("length : " + rangeOrders.length);
    var rangeMin = d3.min(rangeOrders, function(d) {
      return d.rate;
    });
    var rangeMax = d3.max(rangeOrders, function(d) {
      return d.rate;
    });
    var xScaleLeft = d3.scale.linear()
      .domain([d3.max(rangeOrders, function(d) {
        if (d.os > d.ol) {
          return d.os;
        } else {
          return d.ol;
        }
      }), 0])
      .range([0, chartWidth]);
    var xScaleRight = d3.scale.linear()
      .domain([0, d3.max(rangeOrders, function(d) {
        if (d.os > d.ol) {
          return d.os;
        } else {
          return d.ol;
        }
      })])
      .range([0, chartWidth]);
    var yScale = d3.scale.ordinal()
      .domain(d3.range(rangeMin, rangeMax, 0.05))
      .rangeBands([chartHeight, 0], 0.1);

    // Draw axis
    var xAxisLeft = d3.svg.axis()
      .scale(xScaleLeft)
      .orient("bottom");
    var xAxisRight = d3.svg.axis()
      .scale(xScaleRight)
      .orient("bottom");
    var yAxis = d3.svg.axis()
      .scale(yScale)
      .tickValues(d3.range(d3.round(rangeMin, 0), d3.round(rangeMax, 0), 0.2))
      .orient("left");
    svg.append("g")
      .attr("class", "x axis left")
      .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisLeft);
    svg.append("g")
      .attr("class", "x axis right")
      .attr("transform", "translate(" + (margin.left + chartWidth + labelWidth) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisRight);
    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + (margin.left + chartWidth + (labelWidth)) + ", " + margin.upper + ")")
      .call(yAxis);

    // Draw left chart
    svg.selectAll('rect.left.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr({
        x: function(d) {
          return margin.left + xScaleLeft(d.os);
        },
        width: function(d) {
          return chartWidth - xScaleLeft(d.os);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand()
      })
      .on("mouseover", function() {
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d) {
        return tooltip
          .style("top", (d3.event.pageY - 10) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html("<table><tbody><tr><td>* Rate:</td><td>" + d.rate + "</td></tr><tr><td>* Amount:</td><td>" + d.os + "</td></tr></tbody></table>");
      })
      .on("mouseout", function() {
        return tooltip.style("visibility", "hidden");
      });

    // Draw right chart
    svg.selectAll('rect.right.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr("class", "bar")
      .attr({
        x: function(d) {
          return margin.left + chartWidth + labelWidth;
        },
        width: function(d) {
          return xScaleRight(d.ol);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand()
      })
      .on("mouseover", function() {
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d) {
        return tooltip
          .style("top", (d3.event.pageY - 10) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html("<table><tbody><tr><td>* Rate:</td><td>" + d.rate + "</td></tr><tr><td>* Amount:</td><td>" + d.ol + "</td></tr></tbody></table>");
      })
      .on("mouseout", function() {
        return tooltip.style("visibility", "hidden");
      });
  }

  function getOrdersByRange(orders, rateMin, rateMax) {
    result = [];
    $.each(orders, function(index, value) {
      if (value.rate < rateMin || value.rate > rateMax) {
        return;
      }
      result.push(value);
    })
    return result;
  }

  // Exports
  if ("process" in global) {
    module["exports"] = initialize;
  }
  global["initialize"] = initialize;

})((this || 0).self || global);
