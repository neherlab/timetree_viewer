function frequencyChart(container, parent_div, pivots, frequencies, callback){
    width = parseInt(container.style("width"), 10);
    height = 250;
    console.log("frequency chart dimensions:", width, height);
    var freq_chart;
    var currentTrajectories = [];
    function generate(){
        var legend_position = "inset";
        freq_chart = c3.generate({
            bindto: parent_div,
            size: {width: width-10, height: height},
            onresize: function() {
                width = parseInt(d3.select(".freqplot-container").style("width"), 10);
                height = 250;
                console.log("frequency chart dimensions:", width, height);
                freq_chart.resize({height: height, width: width});
            },
            legend: {
                position: legend_position,
                inset: {
                    anchor: 'top-right',
                    x: 10,
                    y: -15,
                    step: 1
                }
            },
            axis: {
                y: {
                    label: {
                        text: 'frequency',
                        position: 'outer-middle'
                    },
                    tick: {
                        values: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                        outer: false
                    },
                    min: 0,
                    max: 1
                },
                x: {
                    label: {
                        text: 'time',
                        position: 'outer-center'
                    },
                    tick: {
                        outer: false
                    }
                }
            },
            data: {
                x: 'x',
                columns: [],
            }
        });
   };

   function _addTrajectories(keys, traj_colors) {
        var columns = [['x'].concat(pivots)];
        var tmp_colors = {};
        for (var ii=0; ii<keys.length; ii++){
            if (typeof frequencies[keys[ii]] != "undefined"){
                columns.push([keys[ii]].concat(frequencies[keys[ii]]));
                if (typeof traj_colors != "undefined"){
                    tmp_colors[keys[ii]] = traj_colors[ii];
                }
                console.log('adding '+keys[ii]);
            }else{
                console.log("not found: "+keys[ii]);
            }
        }
        freq_chart.load({
            columns: columns,
            unload: true
        });
        if (typeof traj_colors != "undefined"){
            freq_chart.data.colors(tmp_colors);
        }
    }
    this.addTrajectories = _addTrajectories;

    function _removeTrajectories(keys){
        var to_unload = [];
        if (typeof keys == "undefined"){
            keys = freq_chart.data.columns;
        }
        for (var ii=0; ii<keys.length; ii++){
            to_unload.push(keys[ii]);
            console.log('removing '+keys[ii]);
        }
        freq_chart.unload({ids:to_unload});
    }
    this.removeTrajectories = _removeTrajectories;

    generate();
}

