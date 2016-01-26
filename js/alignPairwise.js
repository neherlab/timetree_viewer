function alignPairwise(seq1, seq2){
    // determine the position where a particular kmer matches a sequence
    function seedMatch(kmer){
        var tmpScore = 0;
        var maxScore = 0;
        var maxShift = -1;
        console.log(kmer);
        for(var shift=0; shift<seq2.length-kmer.length;shift++){
            tmpScore=0;
            for (var pos=0; pos<kmer.length; pos++){
                if (kmer[pos]==seq2[shift+pos]){
                    tmpScore++;
                }
            }
            if (tmpScore>maxScore){
                maxScore=tmpScore;
                maxShift=shift;
            }
        }
        return [maxShift, maxScore];
    }

    // perform a number of seed matches to determine te rough alignment of seq1 rel to seq2
    var nSeeds = 5, seedLength = 12;
    var seedMatches = [];
    var tmp,tmpShift, tmpScore, qPos;
    for (var ni=0; ni<nSeeds; ni++){
        qPos = Math.round(seq1.length/nSeeds)*ni;
        tmp = seedMatch(seq1.substring(qPos, qPos+seedLength));
        tmpShift=tmp[0]; tmpScore=tmp[1];
        if (tmpScore>=0.7*seedLength){
            seedMatches.push([qPos, tmpShift, tmpShift - qPos, tmpScore]);
        }
    }

    // given the seed matches, determine the maximal and minimal shifts
    var minShift = d3.min(seedMatches.map(function (d){return d[2];}))
    var maxShift = d3.max(seedMatches.map(function (d){return d[2];}))
    var bandWidth = 3*(maxShift-minShift) + 9;
    var meanShift = Math.round(0.5*(minShift+maxShift));

    // allocate a matrix to record the matches
    var rowLength = Math.ceil((seq2.length + 1 + bandWidth*2));
    var matchMatrix = []
    for (shift=-bandWidth; shift<bandWidth+1; shift++){
        matchMatrix.push(new Int16Array(rowLength));
    }


    // fill matchMatrix with alignment scores
    var gapExtend = -2, misMatch = -1, match=1;
    var shift, tmpMatch, cmp;
    for (var ri=0; ri<seq2.length; ri++){
        for (shift=-bandWidth; shift<bandWidth+1; shift++){
            qPos = ri - meanShift + shift;
            if (qPos>=0&&qPos<seq1.length){
                tmpMatch = seq2[ri]==seq1[qPos]?match:misMatch;
                cmp = [ matchMatrix[shift+bandWidth][ri] + tmpMatch,
                        (shift+bandWidth>0)?(matchMatrix[shift-1+bandWidth][ri+1] + gapExtend):gapExtend,
                        (shift+bandWidth<2*bandWidth)?(matchMatrix[shift+1+bandWidth][ri] + gapExtend):gapExtend];
                matchMatrix[shift+bandWidth][ri+1] = d3.max(cmp);
            }
        }
    }

    // self made argmax function
    function argmax(d){
        var tmpmax=d[0], tmpii=0;
        d.forEach(function (x,ii){if (x>=tmpmax){tmpmax=x; tmpii=ii;}})
        return [tmpii, tmpmax];
    }
    // Back trace
    var rowMax = matchMatrix.map(function (d){return d3.max(d);});
    var shift = argmax(rowMax)[0]-bandWidth;
    var rPos = argmax(matchMatrix[shift+bandWidth])[0]-1;
    var qPos = rPos - meanShift + shift;
    var aln = [];
    // add right overhand
    if (rPos<seq2.length-1){
        for (var ii=seq2.length-1; ii>rPos; ii--){
            aln.push([seq2[ii], '-']);
        }
    }else if (qPos<seq1.length-1){
        for (var ii=seq1.length-1; ii>qPos; ii--){
            aln.push(['-', seq1[ii]]);
        }
    }
    aln.push([seq2[rPos], seq1[qPos]]);
    // do backtrace for aligned region
    var tmpmax=0;
    while (rPos>0&&qPos>0){
        cmp = [ matchMatrix[shift+bandWidth][rPos-1],
                (shift+bandWidth>0)?(matchMatrix[shift-1+bandWidth][rPos]):-1000000,
                (shift+bandWidth<2*bandWidth)?(matchMatrix[shift+1+bandWidth][rPos-1]):-100000];
        tmpmax=d3.max(cmp);
        if (tmpmax==cmp[0]){
            qPos--;
            rPos--;
            aln.push([seq2[rPos], seq1[qPos]]);
        }else if (tmpmax==cmp[1]){
            qPos--;
            shift--;
            aln.push(['-', seq1[qPos]]);
        }else if (tmpmax==cmp[2]){
            rPos--;
            shift++;
            aln.push([seq2[rPos], '-']);
        }
    }

    // add left overhang
    if (rPos>0){
        for (var ii=rPos-1; ii>=0; ii--){
            aln.push([seq2[ii], '-']);
        }
    }else if (qPos>0){
        for (var ii=qPos-1; qPos>=0; ii--){
            aln.push(['-', seq1[ii]]);
        }
    }

    //reverse and make sequence
    aln.reverse();
    return [aln.map(function (d){return d[1];}), aln.map(function (d){return d[0];})];
}

