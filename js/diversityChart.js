function diversityChart(container, parent_div, entropy, callback){
    width = parseInt(container.style("width"), 10);
    height = 250;
    console.log(width, height);

    function generate(){
        var chart_data = {};
        var chart_types = {};
        var chart_xaxis = {};
        var ymin = 0;
        var xmax = 0;
        var anno_count= 0
        for (x in entropy){
            chart_data['x'+x+'anno'] = [entropy[x]['pos'][0], entropy[x]['pos'][entropy[x]['pos'].length-1]];
            chart_data[x+'anno'] = [anno_count%3, anno_count%3].map(function (d) {return -0.1*(d+1);});
            anno_count+=1;
            if (ymin>chart_data[x+'anno'][0]){
                ymin = chart_data[x+'anno'][0];
            }
            chart_types[x+'anno'] = 'line';
            chart_xaxis[x+'anno'] = 'x'+x+'anno';
        }
        for (gene in entropy){
            chart_data[gene]=entropy[gene]['val'];
            xmax = d3.max(chart_data[gene])>xmax?chart_data[gene]:xmax;
            chart_data['x'+gene]=entropy[gene]['pos'];
            chart_types[gene]='bar';
            chart_xaxis[gene]='x'+gene;
        }

        var entropy_chart = c3.generate({
            bindto: parent_div,
            size: {width: width-10, height: height},
            onresize: function() {
                width = parseInt(container.style("width"), 10);
                height = 250;
                entropy_chart.resize({height: height, width: width});
            },
            legend: {show: false},
            color: {pattern: ["#AAA"]},
            axis: {
                y: {
                    label: {
                        text: 'variability',
                        position: 'outer-middle'
                    },
                    tick: {
                        values: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6],
                        outer: false
                    },
                    min:-0.8,
                },
                x: {
                    label: {
                        text: 'position',
                        position: 'outer-center'
                    },
                    tick: {
                        outer: false,
                        values: ([1,2,3,4,5]).map(function (d){
                            var dec = Math.pow(10,Math.floor(Math.log10(xmax/5)))
                            var step = dec*Math.floor(xmax/5/dec);
                            return d*step;
                        })
                    }
                },
            },
            data: {
                xs: chart_xaxis,
                json: chart_data,
                types: chart_types,
                onclick: callback,
                onmouseover: function (d){
                    document.body.style.cursor = "pointer";
                },
                onmouseout: function (d){
                    document.body.style.cursor = "default";
                },
                labels:{
                    format:function (v, id, i, j){
                        if ((typeof id !="undefined")&&(id.substring(id.length-4)=='anno')&&(i==1)) {
                            return id.substring(0,id.length-4);
                        }else{return '';}
                    }
                },
            },
            bar: {width: 2},
            grid: {
                y: {
                    lines: [{value: 0}]
                },
                focus:{
                    show:false
                }
            },
            tooltip: {
                format: {
                    title: function (d) {return d;},
                    value: function (value, ratio, id) {
                        return id.substring(id.length-4)=='anno'?"start/stop":"Variability: "+value;
                    }
                }
            },
        });
    }
    generate();
}

