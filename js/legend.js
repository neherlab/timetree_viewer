var legendRectSize = 15;
var legendSpacing = 4;
function legend(canvas, cScale, mouseover_func, mouseout_func, click_func){

    var _lowerBound = {}; _upperBound = {};
    function setUp(){
        console.log("setting up legend " + cScale.domain());

        // construct a dictionary that maps a legend entry to the preceding interval
        _lowerBound[cScale.domain()[0]] = cScale.domain()[0];
        _upperBound[cScale.domain()[0]] = cScale.domain()[0];
        for (var i=1; i<cScale.domain().length; i++){
            _lowerBound[cScale.domain()[i]]=cScale.domain()[i-1];
            _upperBound[cScale.domain()[i]]=cScale.domain()[i];
        }

        //if (typeof click_func == "undefined"){console.log("Click function undefined"); var click_func = function(){};}
        //if (typeof mouseover_func == "undefined"){console.log("Mouse over function undefined"); var mouseover_func = function(){};}

        var tmp_leg = canvas.selectAll(".legend")
            .data(cScale.domain())
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
                var stack = 5;
                var height = legendRectSize + legendSpacing;
                var fromRight = Math.floor(i / stack);
                var fromTop = i % stack;
                var horz = fromRight * 145 + 5;
                var vert = fromTop * height + 5;
                return 'translate(' + horz + ',' + vert + ')';
             });
        tmp_leg.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function (d) {
                var col = cScale(d);
                return d3.rgb(col).brighter([0.35]).toString();
             })
            .style('stroke', function (d) {
                var col = cScale(d);
                return d3.rgb(col).toString();
            })
            .on('mouseover', mouseover_func)
            .on('mouseout', mouseout_func)
            .on('click', click_func);

        tmp_leg.append('text')
            .attr('x', legendRectSize + legendSpacing + 5)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) {
                var label = d.toString().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');
                return label;
            })
            .on('mouseover', mouseover_func)
            .on('mouseout', mouseout_func)
            .on('click', click_func);
        }

    this.remove = function(){
        canvas.selectAll('.legend')
            .remove();
    };

    setUp();
    this.upperBound=_upperBound;
    this.lowerBound=_lowerBound;
}
