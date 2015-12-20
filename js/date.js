function dateSlider(draggedFunc, draggedMinFunc, dragEndFunc){
	var ymd_format = d3.time.format("%Y-%m-%d");
	var dateScale, niceDateScale, counterData;
	var sliderStart, sliderEnd, time_window;
	var oneYear = 365.25*24*60*60*1000; // days*hours*minutes*seconds*milliseconds

	var drag = d3.behavior.drag()
		.on("drag", dragged)
		.on("dragstart", function() {
			d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
			d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
			d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
			d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
		})
		.on("dragend", function() {
			d3.selectAll(".date-input-text").style("fill", "#CCC");
			d3.selectAll(".date-input-marker").style("fill", "#CCC");
			d3.selectAll(".date-input-window").style("stroke", "#CCC");
			d3.selectAll(".date-input-edge").style("stroke", "#CCC");
			dragend();
		});

	var dragMin = d3.behavior.drag()
		.on("drag", draggedMin)
		.on("dragstart", function() {
			d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
			d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
			d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
			d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
		})
		.on("dragend", function() {
			d3.selectAll(".date-input-text").style("fill", "#CCC");
			d3.selectAll(".date-input-marker").style("fill", "#CCC");
			d3.selectAll(".date-input-window").style("stroke", "#CCC");
			d3.selectAll(".date-input-edge").style("stroke", "#CCC");
			dragend();
		});



	function dragged(d) {

		d.date = dateScale.invert(d3.event.x);
		d.x = dateScale(d.date);
		sliderStart = new Date(d.date);
		sliderEnd = new Date(d.date);
		sliderStart.setDate(sliderStart.getDate() - (time_window * 365.25));
		d.x2 = dateScale(sliderStart);

		d3.selectAll(".date-input-text")
			.attr("dx", function(d) {return 0.5*d.x})
			.text(function(d) {
				var format = d3.time.format("%Y %b %-d");
				return format(d.date)
			});
		d3.selectAll(".date-input-marker")
			.attr("cx", function(d) {return d.x});
		d3.selectAll(".date-input-window")
			.attr("x1", function(d) {return d.x})
			.attr("x2", function(d) {return d.x2});
		d3.selectAll(".date-input-edge")
			.attr("x1", function(d) {return d.x2;})
			.attr("x2", function(d) {return d.x2});

		draggedFunc(sliderStart, sliderEnd);
	}

	function draggedMin(d) {

		sliderStart = dateScale.invert(d3.event.x);
		if (sliderStart>sliderEnd) {
			sliderStart = dateScale.invert(dateScale(sliderEnd) - 15);
		}
		d.x2 = dateScale(sliderStart);
		time_window = (sliderEnd.getTime() - sliderStart.getTime()) / oneYear;

		d3.selectAll(".date-input-window")
			.attr("x2", function(d) {return d.x2});
		d3.selectAll(".date-input-edge")
			.attr("x1", function(d) {return d.x2;})
			.attr("x2", function(d) {return d.x2});

		draggedMinFunc(sliderStart, sliderEnd);
	}

	function dragend() {
		console.log("date slider now at "+sliderStart + " -- " + sliderEnd);
		dragEndFunc(sliderStart, sliderEnd);
	}


	this.date_init = function (start, end, tw){
		time_window = tw;
		dateScale = d3.time.scale()
			.domain([start, end])
			.range([5, 205])
			.clamp([true]);

		niceDateScale = d3.time.scale()
			.domain([start, end])
			.range([5, 205])
			.clamp([true])
			.nice(d3.time.month);

		counterData = {}
		counterData['date'] = end;
		counterData['x'] = dateScale(end)
		sliderStart = new Date(end);
		sliderEnd = new Date(end);
		sliderStart.setDate(sliderStart.getDate() - (time_window * 365.25));
		counterData['x2'] = dateScale(sliderStart);

		d3.select("#date-input")
			.attr("width", 240)
			.attr("height", 65);

		var counter = d3.select("#date-input").selectAll(".date-input-text")
			.data([counterData])
			.enter()
			.append("text")
			.attr("class", "date-input-text")
			.attr("text-anchor", "left")
			.attr("dx", function(d) {return 0.5*d.x})
			.attr("dy", "1.0em")
			.text(function(d) {
				var format = d3.time.format("%Y %b %-d");
				return format(d.date)
			})
			.style("cursor", "pointer")
			.call(drag);

		var customTimeFormat = d3.time.format.multi([
			[".%L", function(d) { return d.getMilliseconds(); }],
			[":%S", function(d) { return d.getSeconds(); }],
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%I %p", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }],
			["%b", function(d) { return d.getMonth(); }],
			["%Y", function() { return true; }]
			]);

		var dateAxis = d3.svg.axis()
			.scale(niceDateScale)
			.orient('bottom')
			.ticks(5)
			.tickFormat(customTimeFormat)
			.outerTickSize(2)
			.tickPadding(8);

		d3.select("#date-input").selectAll(".date-input-axis")
			.data([counterData])
			.enter()
			.append("g")
			.attr("class", "date-input-axis")
			.attr("transform", "translate(0,35)")
			.call(dateAxis);

		var window = d3.select("#date-input").selectAll(".date-input-window")
			.data([counterData])
			.enter()
			.append("line")
			.attr("class", "date-input-window")
			.attr("x1", function(d) { return d.x; })
			.attr("x2", function(d) { return d.x2; })
			.attr("y1", 35)
			.attr("y2", 35)
			.style("stroke", "#CCC")
			.style("stroke-width", 5);

		var edge = d3.select("#date-input").selectAll(".date-input-edge")
			.data([counterData])
			.enter()
			.append("line")
			.attr("class", "date-input-edge")
			.attr("x1", function(d) { return d.x2; })
			.attr("x2", function(d) { return d.x2; })
			.attr("y1", 30)
			.attr("y2", 40)
			.style("stroke", "#CCC")
			.style("stroke-width", 3)
			.style("cursor", "pointer")
			.call(dragMin);

		var marker = d3.select("#date-input").selectAll(".date-input-marker")
			.data([counterData])
			.enter()
			.append("circle")
			.attr("class", "date-input-marker")
			.attr("cx", function(d) {return d.x})
			.attr("cy", 35)
			.attr("r", 6)
			.style("fill", "#CCC")
			.style("stroke", "#777")
			.style("cursor", "pointer")
			.call(drag);
		dragEndFunc(sliderStart, sliderEnd);
	}
}