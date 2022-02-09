export var boyerMoore = function (patternBuffer) {
    // Implementation of Boyer-Moore substring search ported from page 772 of
    // Algorithms Fourth Edition (Sedgewick, Wayne)
    // http://algs4.cs.princeton.edu/53substring/BoyerMoore.java.html
    /*
    USAGE:
        // needle should be ASCII string, ArrayBuffer, or Uint8Array
        // haystack should be an ArrayBuffer or Uint8Array
        var search = boyerMoore(needle);
        var skip = search.byteLength;
        var indices = [];
        for (var i = search(haystack); i !== -1; i = search(haystack, i + skip)) {
            indices.push(i);
        }
    */
    var pattern = asUint8Array(patternBuffer);
    var M = pattern.length;
    if (M === 0) {
        throw new TypeError("patternBuffer must be at least 1 byte long");
    }
    // radix
    var R = 256;
    var rightmost_positions = new Int32Array(R);
    // position of the rightmost occurrence of the byte c in the pattern
    for (var c = 0; c < R; c++) {
        // -1 for bytes not in pattern
        rightmost_positions[c] = -1;
    }
    for (var j = 0; j < M; j++) {
        // rightmost position for bytes in pattern
        rightmost_positions[pattern[j]] = j;
    }
    var boyerMooreSearch = function (txtBuffer, start, end) {
        // Return offset of first match, -1 if no match.
        var txt = asUint8Array(txtBuffer);
        if (start === undefined)
            start = 0;
        if (end === undefined)
            end = txt.length;
        var pat = pattern;
        var right = rightmost_positions;
        var lastIndex = end - pat.length;
        var lastPatIndex = pat.length - 1;
        var skip;
        for (var i = start; i <= lastIndex; i += skip) {
            skip = 0;
            for (var j = lastPatIndex; j >= 0; j--) {
                var c = txt[i + j];
                if (pat[j] !== c) {
                    skip = Math.max(1, j - right[c]);
                    break;
                }
            }
            if (skip === 0) {
                return i;
            }
        }
        return -1;
    };
    return { search: boyerMooreSearch, byteLength: pattern.byteLength };
};
//Boyer Moore fast byte search method copied from https://codereview.stackexchange.com/questions/20136/uint8array-indexof-method-that-allows-to-search-for-byte-sequences
var asUint8Array = function (input) {
    if (input instanceof Uint8Array) {
        return input;
    }
    else if (typeof (input) === 'string') {
        // This naive transform only supports ASCII patterns. UTF-8 support
        // not necessary for the intended use case here.
        var arr = new Uint8Array(input.length);
        for (var i = 0; i < input.length; i++) {
            var c = input.charCodeAt(i);
            if (c > 127) {
                throw new TypeError("Only ASCII patterns are supported");
            }
            arr[i] = c;
        }
        return arr;
    }
    else {
        // Assume that it's already something that can be coerced.
        return new Uint8Array(input);
    }
};
export var bytesToInt24 = function (x0, x1, x2) {
    return x0 * 65536 + x1 * 256 + x2;
};
export var bytesToInt16 = function (x0, x1) {
    return x0 * 256 + x1;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9kZXZpY2VzL2ZyZWVlZWcvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLElBQU0sVUFBVSxHQUFHLFVBQUMsYUFBa0M7SUFDekQseUVBQXlFO0lBQ3pFLCtDQUErQztJQUMvQyxpRUFBaUU7SUFDakU7Ozs7Ozs7Ozs7TUFVRTtJQUNGLElBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMxQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNULE1BQU0sSUFBSSxTQUFTLENBQUMsNENBQTRDLENBQUMsQ0FBQztLQUNyRTtJQUNELFFBQVE7SUFDUixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDWixJQUFJLG1CQUFtQixHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLG9FQUFvRTtJQUNwRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hCLDhCQUE4QjtRQUM5QixtQkFBbUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUMvQjtJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEIsMENBQTBDO1FBQzFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN2QztJQUNELElBQUksZ0JBQWdCLEdBQUcsVUFBQyxTQUEyQixFQUFFLEtBQWEsRUFBRSxHQUFXO1FBQzNFLGdEQUFnRDtRQUNoRCxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEMsSUFBSSxL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