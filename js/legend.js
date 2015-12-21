var legendRectSize = 15;
var legendSpacing = 4;
function legend(canvas, cScale){

    function setUp(){
        console.log("setting up legend " + cScale.domain());
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
            });

        tmp_leg.append('text')
            .attr('x', legendRectSize + legendSpacing + 5)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) {
                var label = d.toString().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ', ');
                return label;
            });
        }

    this.remove = function(){
        canvas.selectAll('.legend')
            .remove();
    };

    setUp();
}

