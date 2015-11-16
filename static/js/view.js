(function(global) {
  "use strict;"

  function initialize(orders, staticPath) {
    // Retrieve orders
    retrieveOrders();
  }

  function setOrders(orders) {
    this.orders = orders;
  }

  function getCachedOrders() {
    return this.orders;
  }

  function drawGraph(order, lowerBarCount, upperBarCount) {
    // Clear existing graphs
    $("div#view").empty();

    // Margins
    var margin = {
      upper: 20,
      right: 40,
      bottom: 50,
      left: 40,
      center: 40,
      label: 40
    };

    // Add drawing area
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    var chartWidth = 0;
    var chartHeight = 0;
    var positionChartXPos = 0;
    var positionChartYPos = 0;
    if (windowWidth > windowHeight) {
      chartWidth = ((windowWidth - margin.right - margin.left - margin.center - (margin.label * 2)) / 4);
      chartHeight = windowHeight - margin.upper - margin.bottom;
      positionChartXPos = margin.left + (chartWidth * 2) + margin.label + margin.center;
      positionChartYPos = margin.upper;
    } else {
      chartWidth = ((windowWidth - margin.right - margin.left - margin.label) / 2);
      chartHeight = ((windowHeight - margin.upper - margin.bottom - margin.center) / 2);
      positionChartXPos = margin.left;
      positionChartYPos = margin.upper + chartHeight + margin.center;
    }
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
      .attr("transform", "translate(" + (margin.left + chartWidth + margin.label) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderRight);
    svg.append("g")
      .attr("class", "y axis order")
      .attr("transform", "translate(" + (margin.left + chartWidth + margin.label) + ", " + margin.upper + ")")
      .call(yAxis);
    svg.append("g")
      .attr("class", "x axis position left")
      .attr("transform", "translate(" + positionChartXPos + ", " + (positionChartYPos + chartHeight) + ")")
      .call(xAxisPositionLeft);
    svg.append("g")
      .attr("class", "x axis position right")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + margin.label) + ", " + (positionChartYPos + chartHeight) + ")")
      .call(xAxisPositionRight);
    svg.append("g")
      .attr("class", "y axis position")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + margin.label) + ", " + (positionChartYPos) + ")")
      .call(yAxis);
    // Add x-grid
    svg.append("g")
      .attr("class", "x axis order left grid")
      .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderLeft.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis order right grid")
      .attr("transform", "translate(" + (margin.left + chartWidth + margin.label) + ", " + (chartHeight + margin.upper) + ")")
      .call(xAxisOrderRight.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis position left grid")
      .attr("transform", "translate(" + positionChartXPos + ", " + (positionChartYPos + chartHeight) + ")")
      .call(xAxisPositionLeft.tickSize(-chartHeight, 0, 0).tickFormat(''));
    svg.append("g")
      .attr("class", "x axis position right grid")
      .attr("transform", "translate(" + (positionChartXPos + chartWidth + margin.label) + ", " + (positionChartYPos + chartHeight) + ")")
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
          var base = 'bar order short'
          if (d.rate >= order.rate) {
            base += ' high';
          } else {
            base += ' low';
          }
          if (d.os >= 1) {
            base += ' notice';
          }
          return base;
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

    // Draw current rate on left chart
    svg.selectAll('rect.order.left.rate.line')
      .data([order.rate])
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return margin.left;
        },
        width: function(d) {
          return chartWidth;
        },
        y: function(d, i) {
          return (chartHeight / 2) + margin.upper;
        },
        height: 1,
        class: function(d) {
          return 'bar rate';
        }
      });

    // Draw right chart
    svg.selectAll('rect.order.right.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return margin.left + chartWidth + margin.label;
        },
        width: function(d) {
          return xScaleOrderRight(d.ol);
        },
        y: function(d, i) {
          return (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) + margin.upper - yScale.rangeBand();
        },
        height: yScale.rangeBand(),
        class: function(d) {
          var base = 'bar order long'
          if (d.rate >= order.rate) {
            base += ' high';
          } else {
            base += ' low';
          }
          if (d.ol >= 1) {
            base += ' notice';
          }
          return base;
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

    // Draw current rate on right chart
    svg.selectAll('rect.order.right.rate.line')
      .data([order.rate])
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return margin.left + chartWidth + margin.label;
        },
        width: function(d) {
          return chartWidth;
        },
        y: function(d, i) {
          return (chartHeight / 2) + margin.upper;
        },
        height: 1,
        class: function(d) {
          return 'bar rate';
        }
      });

    var rateWidth = 120;
    var rateHeight = 40;
    var options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    var orderRateSvg = svg.selectAll('rect.order.right.rate.line')
      .data([order])
      .enter();
    orderRateSvg.append("rect")
      .attr("class", "current-rate tooltip rect")
      .attr('x', margin.left + chartWidth * 2 + margin.label - rateWidth)
      .attr('y', (chartHeight / 2) + margin.upper - rateHeight)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("width", rateWidth)
      .attr("height", (rateHeight * 4 / 5));
    orderRateSvg.append("text")
      .attr("class", "current-rate tooltip rect arrows")
      .attr('x', margin.left + chartWidth * 2 + margin.label - rateWidth)
      .attr('y', (chartHeight / 2) + margin.upper)
      .text("▼");
    orderRateSvg.append('text')
      .attr('class', 'current-rate tooltip text upper')
      .attr('x', margin.left + chartWidth * 2 + margin.label - (rateWidth / 2))
      .attr('y', (chartHeight / 2) + margin.upper - (rateHeight * 2 / 3))
      .text(function(d, i) {
        return new Date(Number(d.time) * 1000).toLocaleDateString("ja-JP", options);
      })
      .attr("text-anchor", "middle");
    orderRateSvg.append('text')
      .attr('class', 'current-rate tooltip text lower')
      .attr('x', margin.left + chartWidth * 2 + margin.label - (rateWidth / 2))
      .attr('y', (chartHeight / 2) + margin.upper - (rateHeight / 3))
      .text(function(d, i) {
        return d.rate;
      })
      .attr("text-anchor", "middle");

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
          return positionChartYPos + (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) - yScale.rangeBand();
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

    // Draw current rate on left chart
    svg.selectAll('rect.position.left.rate.line')
      .data([order.rate])
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return positionChartXPos;
        },
        width: function(d) {
          return chartWidth;
        },
        y: function(d, i) {
          return positionChartYPos + (chartHeight / 2);
        },
        height: 1,
        class: function(d) {
          return 'bar rate';
        }
      });

    // Draw right chart
    svg.selectAll('rect.position.right.bar')
      .data(rangeOrders)
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return positionChartXPos + chartWidth + margin.label;
        },
        width: function(d) {
          return xScalePositionRight(d.pl);
        },
        y: function(d, i) {
          return positionChartYPos + (chartHeight - ((chartHeight / (rangeOrders.length - 1)) * i)) - yScale.rangeBand();
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

    // Draw current rate on right chart
    svg.selectAll('rect.position.right.rate.line')
      .data([order.rate])
      .enter()
      .append('rect')
      .attr({
        x: function(d) {
          return positionChartXPos + chartWidth + margin.label;
        },
        width: function(d) {
          return chartWidth;
        },
        y: function(d, i) {
          return positionChartYPos + (chartHeight / 2);
        },
        height: 1,
        class: function(d) {
          return 'bar rate';
        }
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
    while (current.lessThanOrEqualTo(end)) {
      range.push(current.toPrecision());
      current = new BigNumber(current).plus(diff);
    }
    return range;
  }

  function addHandlers() {
    addInstrumentListHandler();
    addWindowResizeHandler();
  }

  function addInstrumentListHandler() {
    $('li.mdl-menu__item.instrument_list').on('click', function() {
      var idx = $('li.mdl-menu__item.instrument_list').index(this);
      var title = $('li.mdl-menu__item.instrument_list:nth-child(' + (idx + 1) + ')').text();
      retrieveOrders(title);
    });
  }

  function addWindowResizeHandler() {
    $(window).resize(function() {
      // TODO: Fix this bar count definition logic
      var upperBarCount = 40;
      var lowerBarCount = 40;
      drawGraph(getCachedOrders(), lowerBarCount, upperBarCount);
    })
  }

  function retrieveOrders(instrument) {
    instrument = instrument || getUrlParam("instrument");
    if (!instrument) {
      instrument = "USD_JPY";
    }
    $.ajax({
      type: "POST",
      url: "apis/orders",
      contentType: "application/json",
      data: JSON.stringify({
        "instrument": instrument
      }),
      success: function(orders) {
        var order = $.parseJSON(orders);
        setOrders(order);

        // Calculate max/min values
        var upperBarCount = 40;
        var lowerBarCount = 40;
        drawGraph(order, lowerBarCount, upperBarCount);
      }
    });
  }

  function getUrlParam(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results ? results[1] : null;
  }

  // Exports
  if ("process" in global) {
    module["exports"] = initialize;
    module["addHandlers"] = addHandlers;
  }
  global["initialize"] = initialize;
  global["addHandlers"] = addHandlers;

})((this || 0).self || global);