function TreeSearch(sequenceLookUp, cladeIds, rootSeq, callBack){

    function addSequence(current_seq, current_seq_name, seqs, all_names){
        if (current_seq_name==""){
            current_seq_name="input sequence";
        }
        var name_count = 0;
        for (var tmpii=0; tmpii<all_names; tmpii++){
            if (all_names[ii]==current_seq_name){
                name_count++;
            }
        }
        if (name_count){
            suffix=" "+(name_count+1);
        }else{suffix="";}
        all_names.push(current_seq_name);
        seqs[current_seq_name+suffix]=current_seq;
    }

    this.parseSequences = function (lines){
        var seqs = {};
        var unmatched = [];
        var closest_nodes = {};
        var current_seq_name = "";
        var current_seq = "";
        var seq_names = [];
        var suffix;
        for (var li=0; li<lines.length; li++){
            if (lines[li][0]=='>'){
                if (current_seq.length){
                    addSequence(current_seq, current_seq_name, seqs, seq_names);
                }
                current_seq_name = lines[li].substring(1,lines[li].length);
                current_seq = "";
            }else{
                current_seq += lines[li].toUpperCase();
            }
        }
        if (current_seq.length){
            addSequence(current_seq, current_seq_name, seqs, seq_names);
        }
        for (current_seq_name in seqs){
            if (seqs[current_seq_name].length>20){
                var tmpclade = locateSequence(current_seq_name, seqs[current_seq_name]);
                if (tmpclade!=null){
                    if (typeof closest_nodes[tmpclade]=="undefined"){closest_nodes[tmpclade]=[current_seq_name];}
                    else{closest_nodes[tmpclade].push(current_seq_name);}
                }else{unmatched.push(current_seq_name);}
            }else{unmatched.push(current_seq_name);}
        }
        console.log("Closest: ", closest_nodes);
        callBack(closest_nodes);
        if (unmatched.length){
            console.log(unmatched);
            var tmp_str = "";
            for (var ii=0; ii<unmatched.length; ii++){ tmp_str+=unmatched[ii].substring(0,30)+"\n";}
            window.alert("No close match was found for \n" + tmp_str + "\nMaybe too short or not recent isolate from current lineage?");
        }
    }

    function locateSequence(name, seq){
        console.log('Provided sequence: '+ name +': ' + seq.substring(0,20)+'....');
        tmp = alignPairwise(seq, rootSeq);
        var gapStripped = tmp[0].filter(function(d,i){return tmp[1][i]!='-';});
        var mutations = {};
        var alignedNucs = 0;
        for (var pos=0; pos<gapStripped.length; pos++){
            if (gapStripped[pos]!='-'){
                alignedNucs++;
                if (gapStripped[pos]!=rootSeq[pos]){
                    mutations[pos]=gapStripped[pos];
                }
            }
        }
        console.log("aligned nucs: "+alignedNucs+ " mutations: ", mutations);
        if (alignedNucs>0.9*rootSeq.length){
            var bestClade = findClosestClade(mutations);
            return bestClade;
        }else{
            return;
        }
    }

    function findClosestClade(mutations){
        var bestClade=-1, bestScore=0;
        var tmpScore=0;

        for (var ci=0; ci<cladeIds.length; ci++){
            clade = cladeIds[ci];
            tmpScore=0;
            for (mut in mutations){
                if (sequenceLookUp(clade, 'nuc', mut)==mutations[mut]){
                    tmpScore++;
                }
            }
            if (clade!="root") {
                tmpScore -= 0.5*Object.keys(mutations).length;
            }
            if (tmpScore>bestScore){
                bestScore=tmpScore;
                bestClade=clade;
            }
        }
        console.log("best match:",bestClade);
        return bestClade;
    }

}