export var safeParse = function (input) {
    if (typeof input === 'string')
        input = JSON.parse(input);
    if (typeof input === 'object') {
        // Convert Stringified Functions to String
        for (var key in input) {
            var value = input[key];
            var regex = new RegExp('(|[a-zA-Z]\w*|\([a-zA-Z]\w*(,\s*[a-zA-Z]\w*)*\))\s*=>');
            var func = (typeof value === 'string') ? value.substring(0, 8) == 'function' : false;
            var arrow = (typeof value === 'string') ? regex.test(value) : false;
            try {
                input[key] = (func || arrow) ? new Function(value) : value;
                // REMOVE EVAL FOR ROLLUP
                // input[key] = (func || arrow) ? eval('(' + value + ')') : value;
            }
            catch (e) {
                console.error(e, value);
                input[key] = value;
            }
            if (typeof input[key] === 'object')
                safeParse(input[key]);
        }
        return input;
    }
    else
        return {};
};
export var safeStringify = function (input) {
    // Stringify Functions
    for (var key in input) {
        if (input[key] instanceof Function)
            input[key] = input[key].toString();
        if (input[key] instanceof Object)
            safeStringify(input[key]);
    }
    // Actually Stringify
    return JSON.stringify(input);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UudXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb21tb24vcGFyc2UudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsTUFBTSxDQUFDLElBQU0sU0FBUyxHQUFHLFVBQUMsS0FFekI7SUFFRyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUV6RCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBQztRQUMxQiwwQ0FBMEM7UUFDMUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUM7WUFDbEIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3RCLElBQUksS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLHVEQUF1RCxDQUFDLENBQUE7WUFDL0UsSUFBSSxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7WUFDcEYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO1lBRW5FLElBQUk7Z0JBQ0EsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUMzRCx5QkFBeUI7Z0JBQ3pCLGtFQUFrRTthQUNyRTtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUN2QixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO2FBQ3JCO1lBRUQsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRO2dCQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtTQUM1RDtRQUVELE9BQU8sS0FBSyxDQUFBO0tBRWY7O1FBQU0sT0FBTyxFQUFFLENBQUE7QUFDcEIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLElBQU0sYUFBYSxHQUFHLFVBQUMsS0FBUztJQUVuQyxzQkFBc0I7SUFDdEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUM7UUFDbEIsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksUUFBUTtZQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDdEUsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksTUFBTTtZQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtLQUM5RDtJQUVELHFCQUFxQjtJQUNyQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7QUFFaEMsQ0FBQyxDQUFBIn0=