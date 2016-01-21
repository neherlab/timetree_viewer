var tip_labels = true, branch_labels=false;
function treePlotHeight(width) {return 400 + 0.30*width;}
var containerWidth = parseInt(d3.select(".treeplot-container").style("width"), 10);
var treeWidth = containerWidth;
var treeHeight = treePlotHeight(treeWidth);
var treeplot = d3.select("#treeplot")
    .attr("width", treeWidth)
    .attr("height", treeHeight);

var legendCanvas = d3.select("#legend")
    .attr("width", 280)
    .attr("height", 100);

treeplot.left_margin = 10;
treeplot.bottom_margin = 16;
treeplot.top_margin = 32;
if (branch_labels) {treeplot.top_margin +=15;}
treeplot.right_margin = 10;


function load_tree(){
    var myTree;
    var myTreeSearch;
    var myLegend;
    var cladeToSeq;
    var myDivChart;
    var oneYear = 365.25*24*60*60*1000; // days*hours*minutes*seconds*milliseconds
    var tw = 10.0;


    function legend_mouseover(legend_element){
        var lb = myLegend.lowerBound[legend_element];
        var ub = myLegend.upperBound[legend_element];
        if (typeof lb == "number"){
            myTree.tips.forEach(function (d){d.highlight = (lb<=d.coloring && ub>d.coloring);});
        }else{
            myTree.tips.forEach(function (d){d.highlight = legend_element==d.coloring;});
        }
        myTree.updateStyle();
        console.log("Mousover, updated radius " + legend_element +" "+ lb+" "+ub);
    }
    function legend_mouseout(){
        myTree.tips.forEach(function (d){d.highlight = false;});
        myTree.updateStyle();
    };

    function legend_click(legend_element){
        console.log(legend_element);
    }

    d3.json(file_prefix + "tree.json", function (error, root){
        if (error) return console.warn(error);

        document.getElementById("timetree").checked=false;
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
            myTree.setNodeState(start, end);
            myTree.updateVisibility();
        }

        function draggedEndFunc(start, end){
            myTree.setNodeState(start, end);
            myTree.updateStyle();
            myTree.updateAnnotations();
        }

        function draggedFunc(start, end){
            myTree.setNodeState(start, end);
            myTree.updateVisibility();
        }
        myDateSlider = new dateSlider(draggedFunc, draggedMinFun, draggedEndFunc);
        myDateSlider.date_init(myTree.earliestDate, myTree.latestDate, tw);
        var label_fmt = function(d) {return d.toFixed(2).replace(/([10-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');}
        myLegend =  new legend(legendCanvas, myTree.currentColorScale, label_fmt,
                               legend_mouseover, legend_mouseout);
    });

    function stateAtPosition(clade, gene, pos){
        if (typeof cladeToSeq[clade][gene][pos] == "undefined"){
            return cladeToSeq["root"][gene][pos];
        }else{
            return cladeToSeq[clade][gene][pos];
        }
    }

    d3.json(file_prefix + "sequences.json", function(error, json) {
        if (error) return console.warn(error);
        cladeToSeq=json;
        var searchClades = myTree.tips.map(function (d){return d.clade;});
        myTreeSearch = new TreeSearch(stateAtPosition, myTree.tips.map(function(d){return d.clade;}),
                                        cladeToSeq['root']['nuc'], seqSearchResult);
    });

    d3.select("#coloring").on("change", function(){
        var choice = document.getElementById("coloring").value;
        if (choice=="date"){
            myTree.nodes.forEach(function (d){d.coloring = d._numDate;});
            var label_fmt = function(d) {return d.toFixed(2).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');}
        }else if (choice=="ep"){
            myTree.nodes.forEach(function (d){d.coloring = d.ep;});
            var label_fmt = function(d) {return d.toFixed(0).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');}
        }
        myTree.updateStyle();
        myLegend.remove();
        myLegend =  new legend(legendCanvas, myTree.currentColorScale, label_fmt,
                                legend_mouseover, legend_mouseout, legend_click);
    });

    var genotypeColoringEvent;
    d3.select("#gt-color")
        .on("keyup", function(){
            if (typeof genotypeColoringEvent != "undefined"){clearTimeout(genotypeColoringEvent);}
            genotypeColoringEvent = setTimeout(colorByGenotype, 200);
        });

    var genotypeColors = ["#60AA9E", "#D9AD3D", "#5097BA", "#E67030", "#8EBC66", "#E59637", "#AABD52", "#DF4327", "#C4B945", "#75B681"];
    function colorByGenotype() {
        document.getElementById("coloring").value = 'none';
        var pos = parseInt(document.getElementById("gt-color").value)-1;
        var gene='nuc';
        colorByPosition(pos, gene);
    };

    function colorByPosition(pos, gene){
        var gts = myTree.nodes.map(function (d) {
            d.coloring = stateAtPosition(d.clade, gene, pos);
            return d.coloring;});

        var tmp_categories = d3.set(gts).values();
        var tmp_range = [];
        for (var ii=0; ii<tmp_categories.length; ii++)
            {tmp_range.push(genotypeColors[ii%genotypeColors.length]);}
        var colorScale = d3.scale.ordinal()
            .domain(tmp_categories)
            .range(tmp_range);
        myTree.updateStyle(colorScale);
        myLegend.remove();
        var label_fmt = function(d) {return d.toString().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');}
        myLegend =  new legend(legendCanvas, colorScale, label_fmt,
                                legend_mouseover, legend_mouseout, legend_click);

    }
    // callback to highlight the result of a search by strain name
    var searchEvent;
    function highlightStrainSearch(tip) {
        var strainName = (tip.strain).replace(/\//g, "");
        d3.select("#"+strainName)
            .call(function(d) {
                markInTreeStrainSearch(tip);
                virusTooltip.show(tip, d[0][0]);
            });
    }

    var strainSearchEvent;
    d3.select('#seqinput').on('keyup', function(){
        if (typeof strainSearchEvent != "undefined"){clearTimeout(strainSearchEvent);}
        var lines = document.getElementById('seqinput').value.split('\n');
        strainSearchEvent = setTimeout(function (d) {myTreeSearch.parseSequences(lines);}, 500);
    });

    function seqSearchResult(clades){
        var nodesToHighlight = myTree.nodes.filter(function (d){
        var tmp=0;
        for (var clade in clades){tmp+= (d.clade==clade);}
            return tmp>0;});
        console.log(clades, nodesToHighlight);
        markSearchResult(nodesToHighlight);
    }

    // highlight clades in tree
    function markSearchResult(nodesToHighlight){
        treeplot.selectAll(".searchResult").data(nodesToHighlight)
            .enter()
            .append('text')
            .attr("class", "searchResult")
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style("font-size", "24px")
            .text(function(d) {return '\uf069'; })
            .on('mouseover', function(d) {virusTooltip.show(d, this);})
            .on('mouseout', virusTooltip.hide);
        myTree.updateStyle();
        myTree.updateGeometry(0.0);
    }

    d3.select('#searchinputclear').on('click', function (){
    treeplot.selectAll('.searchResult').data([]).exit().remove();
    document.getElementById('seqinput').value = "";
    virusTooltip.hide();
    });

    function diversityCallback(d){
        console.log(d);
        colorByPosition(d.index, d.name);
    }

    d3.json("entropy.json", function(error, S){
        myDivChart = new diversityChart(d3.select('.entropy-container'), '#entropy',
//                {'p17':S['p17'],'p24':S['p24'], 'p7':S['p7'], 'p6':S['p6']},
                {'PR':S['PR'],'RT':S['RT'], 'p15':S['p15'], 'IN':S['IN']},
                diversityCallback)
    });

}

load_tree();

