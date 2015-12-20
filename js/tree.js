console.log('Enter tree.js');

function adjust_freq_by_date() {
    calcTipCounts(rootNode);
    var tipCount = rootNode.tipCount;
    nDisplayTips = displayRoot.tipCount;
    console.log("Total tipcount: " + tipCount);
    nodes.forEach(function (d) {
        d.frequency = (d.tipCount)/tipCount;
    });
}

function setNodeState(start, end){
    tips.forEach(function (d) {
        var date = new Date(d.date);
        if (date >= start && date < end){
            d.current  = true;
        } else{
            d.current = false;
        }
    });
};

function initColorDomain(attr, tmpCS){
    //var vals = tips.filter(function(d) {return tipVisibility(d)=='visible';}).map(function(d) {return d[attr];});
    var vals = tips.map(function(d) {return d[attr];});
    var minval = d3.min(vals);
    var maxval = d3.max(vals);
    var rangeIndex = Math.min(10, maxval - minval + 1);
    var domain = [];
    if (maxval-minval<20)
    {
        for (var i=maxval - rangeIndex + 1; i<=maxval; i+=1){domain.push(i);}
    }else{
        for (var i=1.0*minval; i<=maxval; i+=(maxval-minval)/9.0){domain.push(i);}
    }
    tmpCS.range(colors[rangeIndex]);
    tmpCS.domain(domain);
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

function yearPoints(d) {
    return  d.x1.toString()+","+top_margin.toString()+" "+d.x2.toString()+","+(treeHeight-bottom_margin).toString();
}

function tipVisibility(d) {
    return d.current?"visible":"hidden";
}


function branchStrokeWidth(d) {
    return 3;
    //return freqScale(d.target.frequency);
}

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

function branchStrokeColor(d) {
    var col;
    col = "#AAA";
    var modCol = d3.interpolateRgb(col, "#BBB")(0.3);
    return d3.rgb(modCol).toString();
}


function tipLabelSize(d, n) {
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
}

function tipLabelWidth(d, n) {
    return tipLabelText(d).length * tipLabelSize(d, n) * 0.5;
}
function tipFillColor(d) {
    var col = '#BBB';   ;
    return d3.rgb(col).brighter([0.65]).toString();
}
function tipStrokeColor(d) {
    var col = '#BBB';
    return d3.rgb(col).toString();
}


function PhyloTree(root, canvas, container) {
    var tree = d3.layout.tree();
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    var tree_legend;
    var timetree=false;
    var xValues, yValues, currentXValues, xScale, yScale;
    var rootNode = nodes[0];
    var nDisplayTips, displayRoot=rootNode;
    displayRoot = rootNode;
    tips = gatherTips(rootNode, []);
    this.tips = tips;
    this.rootNode = this.rootNode;

    var dateValues = nodes.filter(function(d) {
        return typeof d.date === 'string';
        }).map(function(d) {
        return new Date(d.date);
    });
    this.earliestDate = new Date(d3.min(dateValues));
    this.latestDate = new Date(d3.max(dateValues));
    setNodeState(this.earliestDate, this.latestDate);

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

    /*
     * update color and stroke styles of tips and links
    */
    function updateStyle(){
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
    this.UpdateStyle = updateStyle;

    /*
     * update tip labels, branch labels
     */
    function updateAnnotations(){
        console.log("update annotations "+nDisplayTips);
        canvas.selectAll(".branchLabel")
            .style("font-size", function (d){branchLabelSize(d, nDisplayTips);})
            .style("text-anchor", "end");

        canvas.selectAll(".tipLabel").data(tips)
            .style("font-size", function(d) {
                return tipLabelSize(d, nDisplayTips)+"px"; });
    }
    this.UpdateAnnotations = updateAnnotations;

    /*
     * add tool tips and zoom properties to svg elements
     */
    function updateBehavior(){
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
    function updateGeometry(dt){
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
                .attr("points", yearPoints);
            canvas.selectAll(".yearLabel")
                .transition().duration(dt)
                .attr("x", function(d){return d.x1;})
                .attr("y", function(d){return treeHeight;});
            canvas.selectAll(".month")
                .transition().duration(dt)
                .attr("points", yearPoints);
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
            right_margin = maxTextWidth + 10;
        }
        xScale.range([left_margin, treeWidth - right_margin]);
        yScale.range([top_margin, treeHeight - bottom_margin]);
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
        updateGeometry(1500)
        updateAnnotations();
    }

    d3.select(window).on('resize', resize);

    function resize() {
        console.log("resize tree");
        setMargins();
        updateGeometry(0);
        updateAnnotations();
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
    updateBehavior();
    updateStyle();
    resize();
}


//d3.json(path + file_prefix + "sequences.json", function(error, json) {
//  if (error) return console.warn(error);
//  cladeToSeq=json;
//});

d3.select("#treefile")
    .on("change", load_tree);

function load_tree(){
    filename = document.getElementById("treefile").value;
    console.log(filename);
    var myTree;
    var oneYear = 365.25*24*60*60*1000; // days*hours*minutes*seconds*milliseconds
    var tw = 2.0;
    d3.json("tree.json", function (error, root){
        if (error) return console.warn(error);

        document.getElementById("timetree").value=false;
        myTree = new PhyloTree(root, treeplot, d3.select('.treeplot-container'));

        d3.select("#reset").on("click", myTree.resetLayout);
        d3.select("#timetree").on("change", function(){
            var tmp_timetree = document.getElementById("timetree").checked;
            myTree.toggleTimeTree(tmp_timetree);
        });

        var mc = autocomplete(document.getElementById('search'))
            .keys(myTree.tips)
            .dataField("strain")
            .placeHolder("search strains...")
            .width(800)
            .height(500)
            .onSelected(onSelect)
            .render();

        var searchEvent;
        function onSelect(tip) {
            var strainName = (tip.strain).replace(/\//g, "");
            d3.select("#"+strainName)
                .call(function(d) {
                    virusTooltip.show(tip, d[0][0]);
                })
                .attr("r", function(d){return tipRadius*1.7;})
                .style("fill", function (d) {
                  searchEvent = setTimeout(function (){
                    d3.select("#"+strainName)
                     .attr("r", function(d){return tipRadius;})
                     .style("fill", tipFillColor);}, 5000, d);
                  return d3.rgb(tipFillColor(d)).brighter();
                });
        }


        function draggedMinFun(start, end){
            setNodeState(start, end);
            myTree.UpdateStyle();
        }

        function draggedEndFunc(start, end){
            setNodeState(start, end);
            myTree.UpdateStyle();
            myTree.UpdateAnnotations();
        }

        function draggedFunc(start, end){
            setNodeState(start, end);
            myTree.UpdateStyle();
        }
        myDateSlider = new dateSlider(draggedFunc, draggedMinFun, draggedEndFunc);
        myDateSlider.date_init(myTree.earliestDate, globalDate, tw);
    });
}
