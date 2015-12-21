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
    var myLegend;
    var cladeToSeq;
    var oneYear = 365.25*24*60*60*1000; // days*hours*minutes*seconds*milliseconds
    var tw = 2.0;
    d3.json("tree.json", function (error, root){
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
        myLegend =  new legend(legendCanvas, myTree.currentColorScale);
    });

    d3.json("sequences.json", function(error, json) {
        if (error) return console.warn(error);
        cladeToSeq=json;
    });

    function stateAtPosition(clade, gene, pos){
        if (typeof cladeToSeq[clade][gene][pos] == "undefined"){
            return cladeToSeq["root"][gene][pos];
        }else{
            return cladeToSeq[clade][gene][pos];
        }
    }

    d3.select("#coloring").on("change", function(){
        var choice = document.getElementById("coloring").value;
        if (choice=="date"){
            myTree.nodes.forEach(function (d){d.coloring = d._numDate;});
        }else if (choice=="ep"){
            myTree.nodes.forEach(function (d){d.coloring = d.ep;});
        }
        myTree.updateStyle();
        myLegend.remove();
        myLegend =  new legend(legendCanvas, myTree.currentColorScale);
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
        var gene='HA1';
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
        myLegend =  new legend(legendCanvas, colorScale);
    }

}

load_tree();

