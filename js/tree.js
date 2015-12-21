console.log('Enter tree.js');

function branchLabelText(d) {
    var tmp_str = d.aa_muts.replace(/,/g, ', ');
    if (tmp_str.length>50){
        return tmp_str.substring(0,45)+'...';
    }
    else {
        return tmp_str;
    }
}

function tipLabelText(d) {
    if (d.strain.length>32){
        return d.strain.substring(0,30)+'...';
    }
    else {
        return d.strain;
    }
}

function branchLabelSize(d, n) {
    if (d.fullTipCount>n/15) {
        return "12px";
    }
    else {
        return "0px";
    }
}

function tipLabelSize(d, n) {
    if (d.current){
        if (n<25){
            return 16;
        }else if (n<50){
            return 12;
        }else if (n<75){
            return 8;
        }
        else {
            return 0;
        }
    }else{
        return 0;
    }
}

function tipLabelWidth(d, n){return tipLabelText(d).length * tipLabelSize(d, n) * 0.5;}
function tipFillColor(d)    {return d3.rgb(d.col).brighter([0.65]);}
function tipStrokeColor(d)  {return d.col;}
function tipRadius(d)  {return 4.0;}
function branchStrokeColor(d) {return "#BBBBBB";}
function tipVisibility(d) { return d.current?"visible":"hidden";}
function branchStrokeWidth(d) {return 3;}

function PhyloTree(root, canvas, container) {
    var tree = d3.layout.tree();
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    var tree_legend;
    var timetree=false;
    var xValues, yValues, currentXValues, xScale, yScale;
    var rootNode = nodes[0];
    var nDisplayTips, displayRoot=rootNode;

    var containerWidth = parseInt(container.style("width"), 10);
    var treeWidth = containerWidth;
    var treeHeight = treePlotHeight(treeWidth);
    var genericDomain = [0,0.111,0.222,0.333, 0.444, 0.555, 0.666, 0.777, 0.888, 1.0];
    var colors =    ["#4D92BF", "#5AA5A8", "#6BB18D", "#80B974", "#98BD5E", "#B1BD4E",
                     "#C8B944", "#DAAC3D", "#E59738", "#E67732", "#E14F2A", "#DB2522"];


    displayRoot = rootNode;
    var tips = gatherTips(rootNode, []);
    this.tips = tips;
    this.nodes = nodes;
    this.rootNode = rootNode;

    canvas.call(virusTooltip);
    canvas.call(linkTooltip);

    function _numDate(date){
        var oneYear = 365.25*24*60*60*1000; // days*hours*minutes*seconds*milliseconds
        return 1970 + date.getTime()/oneYear;
    }
    this.numDate = _numDate;
    var dateValues = nodes.filter(function(d) {
        return typeof d.date === 'string';
        }).map(function(d) {
            d._calDate = new Date(d.date);
            d._numDate = _numDate(d._calDate);
            d.coloring = d._numDate;
        return d._calDate;
    });
    tips.forEach(function(d){d._highlight=false; d._selected=false; })

    this.earliestDate = new Date(d3.min(dateValues));
    this.latestDate = new Date(d3.max(dateValues));


    function _setNodeState(start, end){
        var numStart = _numDate(start), numEnd = _numDate(end);
        tips.forEach(function (d) {
            if (d._numDate >= numStart && d._numDate < numEnd){
                d.current  = true;
            } else{
                d.current = false;
            }
        });
    };
    this.setNodeState = _setNodeState;
    this.setNodeState(this.earliestDate, this.latestDate);

    function treeSetUp(start, end){
        calcFullTipCounts(rootNode);
        rootNode.branch_length=0.001;
        rootNode.tbranch_length=0.001;
        calcBranchLength(rootNode);
        nDisplayTips = displayRoot.fullTipCount;

        xValues = nodes.map(function(d) {return +d.xvalue;});
        tValues = nodes.map(function(d) {return +d.tvalue;});
        yValues = nodes.map(function(d) {return +d.yvalue;});
        if (timetree){
            currentXValues = tValues;
        }else{
            currentXValues = xValues;
        }

        xScale = d3.scale.linear()
            .domain([d3.min(currentXValues), d3.max(currentXValues)]);
        yScale = d3.scale.linear()
            .domain([d3.min(yValues), d3.max(yValues)]);
        drawGrid();

        canvas.selectAll(".link")
            .data(links)
            .enter().append("polyline")
            .attr("class", "link");

        canvas.selectAll(".tip")
            .data(tips)
            .enter()
            .append("circle")
            .attr("class", "tip")
            .attr("id", function(d) { return (d.strain).replace(/\//g, ""); });

    }
    function branchPoints(d) {
        var tmp =   d.source.x.toString() + "," + d.target.y.toString() + " "
                  + d.target.x.toString() + "," + d.target.y.toString();
        if (typeof d.target.children != "undefined"){
            var child_ys = d.target.children.map(function (x){return x.y;});
            tmp+= " "+ d.target.x.toString()+","+d3.min(child_ys).toString() + " "
                     + d.target.x.toString()+","+d3.max(child_ys).toString();
        }
        return tmp;
    }

    function addBranchLabels(){
        canvas.selectAll(".branchLabel")
            .data(nodes)
            .enter()
            .append("text")
            .attr("class", "branchLabel")
            .text(branchLabelText);
    }

    function addTipLabels(){
        canvas.selectAll(".tipLabel")
            .data(tips)
            .enter()
            .append("text")
            .attr("class","tipLabel")
            .text(tipLabelText);
    }

    var continuousColorScale = d3.scale.linear().clamp([true])
        .domain(genericDomain)
        .range(colors);
    var _currentColorScale= continuousColorScale;
    this.currentColorScale = _currentColorScale; // holds the color scale last used
    /*
     * _update color and stroke styles of tips and links
    */
    function _updateStyle(colorScale){
        var tmp_col_data = tips.map(function(d){return d.coloring;});
        if (typeof tmp_col_data[0]=="number" && typeof colorScale == "undefined"){
            _currentColorScale = continuousColorScale;
            var cmin = d3.min(tmp_col_data), cmax = d3.max(tmp_col_data);
            _currentColorScale.domain(genericDomain.map(function (d){return cmin + d*(cmax-cmin);}));
        }else if (typeof colorScale != "undefined"){
            _currentColorScale=colorScale;
        }
        tips.forEach(function(d){d.col = _currentColorScale(d.coloring);});

        canvas.selectAll(".tip")
            .attr("r", tipRadius)
            .style("visibility", tipVisibility)
            .style("fill", tipFillColor)
            .style("stroke", tipStrokeColor);

        canvas.selectAll(".link")
            .style("stroke-width", branchStrokeWidth)
            .style("stroke", branchStrokeColor)
            .style("stroke-linejoin", "round")
            .style("cursor", "pointer");
    }
    this.updateStyle = _updateStyle;

    function _updateVisibility(){
        canvas.selectAll(".tip")
            .style("visibility", tipVisibility);
    }
    this.updateVisibility = _updateVisibility;

    /*
     * _update tip labels, branch labels
     */
    function _updateAnnotations(){
        console.log("_update annotations "+nDisplayTips);
        canvas.selectAll(".branchLabel")
            .style("font-size", function (d){branchLabelSize(d, nDisplayTips);})
            .style("text-anchor", "end");

        canvas.selectAll(".tipLabel").data(tips)
            .style("font-size", function(d) {
                return tipLabelSize(d, nDisplayTips)+"px"; });
    }
    this.updateAnnotations = _updateAnnotations;

    /*
     * add tool tips and zoom properties to svg elements
     */
    function _updateBehavior(){
        canvas.selectAll(".link")
            .on('mouseover', function (d){
                linkTooltip.show(d.target, this);})
            .on('mouseout', function(d) {
                linkTooltip.hide(d);})
            .on('click', zoom);

        canvas.selectAll(".tip")
            .on('mouseover', function(d) {
                virusTooltip.show(d, this);
            })
            .on('mouseout', virusTooltip.hide);
    }


    var yearTicks = [], monthTicks=[];
    function gridLine(d) {
        return  d.x1.toString()+","+canvas.top_margin.toString()+" "+d.x2.toString()
                +","+(treeHeight-canvas.bottom_margin).toString();
    }
    function drawGrid(){
        var maxy = yScale.domain[1], miny=yScale.domain[0];
        var maxt = d3.max(tValues), mint = d3.min(tValues);
        var tRoot = tips[0].num_date-tips[0].tvalue;
        console.log("Setting up date grid starting: ",tRoot);
        function DatetoTotValue(x){
            return x-tRoot;
        }
        for (var yi=Math.floor(mint+tRoot); yi<Math.ceil(maxt+tRoot+0.1); yi++){
            yearTicks.push({'year':yi, "T1":DatetoTotValue(yi), "c1":miny, "T2":DatetoTotValue(yi),"c2":maxy});
            for (var mi=1; mi<12; mi++){
                monthTicks.push({'year':yi,"month":mi, "T1":DatetoTotValue(yi+mi/12.0), "c1":miny,
                                "T2":DatetoTotValue(yi+mi/12.0),"c2":maxy});
            }
        }
        console.log(yearTicks);
        var yearGrid = canvas.selectAll(".year")
            .data(yearTicks)
            .enter().append('polyline')
            .attr("class","year")
            .style('visibility', function(){return timetree?"visible":"hidden";})
            .style("stroke-width", 3)
            .style("stroke", "#DDDDDD");

        var yearLabel = canvas.selectAll(".yearLabel")
            .data(yearTicks)
            .enter().append('text')
            .attr("class","yearLabel")
            .text(function(d){return d.year.toString()})
            .style('visibility', function(){return timetree?"visible":"hidden";})
            .style('font-size',14);

        var monthGrid = canvas.selectAll(".month")
            .data(monthTicks)
            .enter().append('polyline')
            .attr("class","month")
            .style("stroke-width", 1)
            .style('visibility', function(){return timetree?"visible":"hidden";})
            .style("stroke", "#EEEEEE");
    }

    /*
     *move all svg items to their new location
     *dt -- the duration of the transition
     */
    function _updateGeometry(dt){
        if (timetree){
            nodes.forEach(function (d) {
                d.x = xScale(d.tvalue);
                d.y = yScale(d.yvalue);
            });
            yearTicks.forEach(function (d){
                d.x1 = xScale(d.T1); d.x2 = xScale(d.T2);
                d.y1 = yScale(d.c1); d.y2 = yScale(d.c2);
            });
            monthTicks.forEach(function (d){
                d.x1 = xScale(d.T1); d.x2 = xScale(d.T2);
                d.y1 = yScale(d.c1); d.y2 = yScale(d.c2);
            });
            canvas.selectAll(".year")
                .transition().duration(dt)
                .attr("points", gridLine);
            canvas.selectAll(".yearLabel")
                .transition().duration(dt)
                .attr("x", function(d){return d.x1;})
                .attr("y", function(d){return treeHeight;});
            canvas.selectAll(".month")
                .transition().duration(dt)
                .attr("points", gridLine);
        }else{
            nodes.forEach(function (d) {
                d.x = xScale(d.xvalue);
                d.y = yScale(d.yvalue);
            });
        }

        canvas.selectAll(".tip")
            .transition().duration(dt)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        canvas.selectAll(".link")
            .transition().duration(dt)
            .attr("points", branchPoints);

        canvas.selectAll(".tipLabel")
            .transition().duration(dt)
            .attr("x", function(d) { return d.x+10; })
            .attr("y", function(d) { return d.y+4; });

        canvas.selectAll(".branchLabel")
            .transition().duration(dt)
            .attr("x", function(d) {  return d.x - 6;})
            .attr("y", function(d) {  return d.y - 3;});
    }

    /*
     * zoom into the tree upon click onto a branch
     */
    function zoom(d){
        var dy = yScale.domain()[1]-yScale.domain()[0];
        displayRoot = d.target;
        var xval_name = timetree?"tvalue":"xvalue";
        var xval = timetree?d.target.tvalue:d.target.xvalue;
        var dMin = 0.5 * (minimumAttribute(d.target, xval_name, xval) + minimumAttribute(d.source, xval_name, xval)),
            dMax = maximumAttribute(d.target, xval_name, xval),
            lMin = minimumAttribute(d.target, "yvalue", d.target.yvalue),
            lMax = maximumAttribute(d.target, "yvalue", d.target.yvalue);
        if (dMax == dMin || lMax == lMin) {
            displayRoot = d.source;
            var xval = timetree?d.source.tvalue:d.source.xvalue;
            dMin = minimumAttribute(d.source, xval_name, xval),
            dMax = maximumAttribute(d.source, xval_name, xval),
            lMin = minimumAttribute(d.source, "yvalue", d.source.yvalue),
            lMax = maximumAttribute(d.source, "yvalue", d.source.yvalue);
        }
        if ((lMax-lMin)>0.999*dy){
            lMin = lMax - dy*0.7
        }
        var visibleXvals = tips.filter(function (d){return (d.yvalue>=lMin)&&(d.yvalue<lMax)}).map(function(d){return +(timetree?d.tvalue:d.xvalue);});
        nDisplayTips = visibleXvals.length;
        dMax = d3.max(visibleXvals);
        console.log("nodes in view: "+nDisplayTips+' max Xval: '+dMax);
        rescale(dMin, dMax, lMin, lMax);
    }

    /*
     * adjust margins such that the tip labels show
     */
    function setMargins(){
        containerWidth = parseInt(container.style("width"), 10);
        treeWidth = containerWidth;
        treeHeight = treePlotHeight(treeWidth);
        var right_margin = canvas.right_margin;
        d3.select("#canvas")
            .attr("width", treeWidth)
            .attr("height", treeHeight);
        if ((typeof tip_labels != "undefined")&&(tip_labels)){
            var maxTextWidth = 0;
            var labels = canvas.selectAll(".tipLabel")
                .data(tips)
                .each(function(d) {
                    var textWidth = tipLabelWidth(d, nDisplayTips);
                    if (textWidth>maxTextWidth) {
                        maxTextWidth = textWidth;
                    }
                });
            right_margin += maxTextWidth;
        }
        xScale.range([canvas.left_margin, treeWidth - right_margin]);
        yScale.range([canvas.top_margin, treeHeight - canvas.bottom_margin]);
    }

    /*
     * rescale the tree to a window defined by the arguments
     * dMin, dMax  -- minimal and maximal horizontal dimensions
     * lMin, lMax  -- minimal and maximal vertical dimensions
     */
    function rescale(dMin, dMax, lMin, lMax) {
        setMargins();
        console.log("rescale xdimensions: ",dMin, dMax);
        xScale.domain([dMin,dMax]);
        yScale.domain([lMin,lMax]);
        _updateGeometry(1500)
        _updateAnnotations();
    }

    d3.select(window).on('resize', resize);

    function resize() {
        console.log("resize tree");
        setMargins();
        _updateGeometry(0);
        _updateAnnotations();
    }

    this.resetLayout = function () {
        displayRoot = rootNode;
        nDisplayTips = displayRoot.fullTipCount;
        var dMin = d3.min(currentXValues),
            dMax = d3.max(currentXValues),
            lMin = d3.min(yValues),
            lMax = d3.max(yValues);
        rescale(dMin, dMax, lMin, lMax);
    }

    this.toggleTimeTree = function (timetree_state) {
        timetree = timetree_state;
        console.log("Switching timetree to:", timetree);
        if (timetree){
            currentXValues = tValues;
        }else{
            currentXValues = xValues;
        }
        canvas.selectAll('.year').style('visibility', function(){return timetree?"visible":"hidden";});
        canvas.selectAll('.month').style('visibility', function(){return timetree?"visible":"hidden";});
        canvas.selectAll('.yearLabel').style('visibility', function(){return timetree?"visible":"hidden";});
        this.resetLayout();
    }

    treeSetUp();
    this.xScale=xScale;
    this.yScale=yScale;
    if (tip_labels){ addTipLabels();}
    if (branch_labels){ addBranchLabels();}
    setMargins();
    _updateBehavior();
    _updateStyle();
    resize();
}
