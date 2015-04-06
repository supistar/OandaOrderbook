(function(global) {
  "use strict;"

  function initialize(orders, staticPath) {
    var order = $.parseJSON(orders);

    // Calculate max/min values
    var upperBarCount = 40;
    var lowerBarCount = 40;

    drawGraph(order, lowerBarCount, upperBarCount);
  }

  function drawGraph(order, lowerBarCount, upperBarCount) {
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
    var centerWidth = 40;
    var labelWidth = 40;
    var chartWidth = ((windowWidth - margin.right - margin.left - centerWidth - (labelWidth * 2)) / 4);
    var chartHeight = windowHeight - margin.upper - margin.bottom;
    var positionChartXPos = (windowWidth + centerWidth) / 2;
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

    // Get target order/position range
    var tick = getRateBaseTick(order.orders);
    var rangeOrders = getOrdersByRange(order.orders, order.rate, tick, lowerBarCount, upperBarCount);
    console.log("length : " + rangeOrders.length);
    var rangeMin = d3.min(rangeOrders, function(d) {
      return d.rate;
    });
    var rangeMax = d3.max(rangeOrders, function(d) {
      return d.rate;
    });

    console.log("Range : " + rangeMin + " / " + rangeMax + " / " + tick);
    // Set x and y axis
    var xScaleOrderLeft = d3.scale.linear()
      .domain([getOrderMaxValue(rangeOrders, "o"), 0])
      .range([0, chartWidth]);
    var xScaleOrderRight = d3.scale.linear()
      .domain([0, getOrderMaxValue(rangeOrders, "o")])
      .range([0, chartWidth]);
    var xScalePositionLeft = d3.scale.linear()
      .domain([getOrderMaxValue(rangeOrders, "p"), 0])
      .range([0, chartWidth]);
    var xScalePositionRight = d3.scale.linear()
      .domain([0, getOrderMaxValue(rangeOrders, "p")])
      .range([0, chartWidth]);
    var yScale = d3.scale.ordinal()
      .domain(getPreciseValueRange(rangeMin, rangeMax, tick))
      .rangeBands([chartHeight, 0], 0.1);

    var padding = new BigNumber(tick).times(4).round(6).toPrecision();
    var paddingMin = new BigNumber(rangeMin).dividedBy(padding).ceil().times(padding).round(6).toPrecision();
    var paddingMax = new BigNumber(rangeMax).dividedBy(padding).floor().times(padding).round(6).toPrecision();
    console.log("Padding : " + paddingMin + " / " + paddingMax + " / " + padding);

    // Draw axis
    var xAxisOrderLeft = d3.svg.axis()
      .scale(xScaleOrderLeft)
      .orient("bottom");
    var xAxisOrderRight = d3.svg.axis()
      .scale(xScaleOrderRight)
      .orient("bottom");
    var xAxisPositionLeft = d3.svg.axis()
      .scale(xScalePositionLeft)
      .orient("bottom");
    var xAxisPositionRight = d3.svg.axis()
      .scale(xScalePositionRight)
      .orient("bottom");
    var yAxis = d3.svg.axis()
      .scale(yScale)
      .tickValues(getPreciseValueRange(paddingMin, paddingMax, padding))
      .orient("left");
    svg.append("g")
      .attr("class", "x axis order left")
      .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderLeft);
    svg.append("g")
      .attr("class", "x axis order right")
      .attr("transform", "translate(" + (margin.left + chartWidth + labelWidth) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderRight);
    svg.append("g")
      .attr("class", "y axis order")
      .attr("transform", "translate(" + (margin.left + chartWidth + labelWidth) + ", " + margin.upper + ")")
      .call(yAxis);
    svg.append("g")
      .attr("class", "x axis position left")
      .attr("transform", "translate(" + positionChartXPos + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisPositionLeft);
    svg.append("g")
      .attr("class", "x axis position right")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + labelWidth) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisPositionRight);
    svg.append("g")
      .attr("class", "y axis position")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + labelWidth) + ", " + margin.upper + ")")
      .call(yAxis);
    // Add x-grid
    svg.append("g")
      .attr("class", "x axis order left grid")
      .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderLeft.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis order right grid")
      .attr("transform", "translate(" + (margin.left + chartWidth + labelWidth) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderRight.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis position left grid")
      .attr("transform", "translate(" + positionChartXPos + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisPositionLeft.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis position right grid")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + labelWidth) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisPositionRight.tickSize(-chartHeight, 0, 0).tickFormat(''));

    // Draw left chart
    svg.selectAll('rect.order.left.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return margin.left + xScaleOrderLeft(d.os);
        },
        width: function(d) {
          return chartWidth - xScaleOrderLeft(d.os);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand(),
        class: function(d) {
          if (d.rate >= order.rate) {
            return 'bar order short high';
          } else {
            return 'bar order short low';
          }
        }
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
    svg.selectAll('rect.order.right.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return margin.left + chartWidth + labelWidth;
        },
        width: function(d) {
          return xScaleOrderRight(d.ol);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand(),
        class: function(d) {
          if (d.rate >= order.rate) {
            return 'bar order long high';
          } else {
            return 'bar order long low';
          }
        }
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

    // Draw left chart
    svg.selectAll('rect.position.left.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return positionChartXPos + xScalePositionLeft(d.ps);
        },
        width: function(d) {
          return chartWidth - xScalePositionLeft(d.ps);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand(),
        class: function(d) {
          if (d.rate >= order.rate) {
            return 'bar position short high';
          } else {
            return 'bar position short low';
          }
        }
      })
      .on("mouseover", function() {
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d) {
        return tooltip
          .style("top", (d3.event.pageY - 10) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html("<table><tbody><tr><td>* Rate:</td><td>" + d.rate + "</td></tr><tr><td>* Amount:</td><td>" + d.ps + "</td></tr></tbody></table>");
      })
      .on("mouseout", function() {
        return tooltip.style("visibility", "hidden");
      });

    // Draw right chart
    svg.selectAll('rect.position.right.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return positionChartXPos + chartWidth + labelWidth;
        },
        width: function(d) {
          return xScalePositionRight(d.pl);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand(),
        class: function(d) {
          if (d.rate >= order.rate) {
            return 'bar position long high';
          } else {
            return 'bar position long low';
          }
        }
      })
      .on("mouseover", function() {
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d) {
        return tooltip
          .style("top", (d3.event.pageY - 10) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html("<table><tbody><tr><td>* Rate:</td><td>" + d.rate + "</td></tr><tr><td>* Amount:</td><td>" + d.pl + "</td></tr></tbody></table>");
      })
      .on("mouseout", function() {
        return tooltip.style("visibility", "hidden");
      });
  }

  function getRateBaseTick(orders) {
    var tick = 5;
    var orderTick = orders[Math.floor(orders.length / 2) + 1].rate - orders[Math.floor(orders.length / 2)].rate;
    console.log("Tick : " + orderTick);

    var product = Math.round(5 / orderTick);
    console.log("Product : " + product)
    var baseTick = Math.round(orderTick * product) / product;
    console.log("BaseTick : " + baseTick);
    return baseTick;
  }

  function getOrdersByRange(orders, rate, baseTick, lowerBarCount, upperBarCount) {
    result = [];
    $.each(orders, function(index, value) {
      if (value.rate < -lowerBarCount * baseTick + rate || value.rate > upperBarCount * baseTick + rate) {
        return;
      }
      result.push(value);
    })
    return result;
  }

  function getOrderMaxValue(orders, element) {
    var long = element + "l";
    var short = element + "s";
    return d3.max(orders, function(d) {
      if (d[short] > d[long]) {
        return d[short];
      } else {
        return d[long];
      }
    });
  }

  function getPreciseValueRange(start, end, diff) {
    var range = [];
    if (diff == 0) {
      return range;
    }
    if (diff > 0 && start > end) {
      return range;
    }
    if (diff < 0 && start < end) {
      return range;
    }
    var current = new BigNumber(start);
    var digits = Math.max(new BigNumber(start).precision(), new BigNumber(end).precision(), new BigNumber(diff).precision());
    while (current.lessThanOrEqualTo(end)) {
      range.push(current.toPrecision());
      current = new BigNumber(current).plus(diff);
    }
    return range;
  }

  // Exports
  if ("process" in global) {
    module["exports"] = initialize;
  }
  global["initialize"] = initialize;

})((this || 0).self || global);