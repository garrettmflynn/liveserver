var times = [];
var refuS;
export var onconnect = function (arg1, arg2) {
    console.log(arg1, arg2);
};
export var ondata = function (newline) {
    var latest = {
        // times: [],
        red: [],
        ir: [],
        ratio: [],
        ambient: [],
        temp: []
    };
    if (newline.indexOf("|") > -1) {
        var data = newline.split("|");
        //console.log(data);
        if (data.length > 3) {
            // count++;
            // if(count === 1) { startTime = Date.now(); }
            if (times.length === 0) {
                times.push(Date.now());
                refuS = parseFloat(data[0]);
            } //Microseconds = parseFloat(data[0]). We are using date.now() in ms to keep the UI usage normalized
            else {
                var t = parseFloat(data[0]);
                times.push(Math.floor(times[times.length - 1] + (t - refuS) * 0.001));
                refuS = t; //keep times synchronous
            }
            latest.red.push(parseFloat(data[1]));
            latest.ir.push(parseFloat(data[2]));
            latest.ratio.push(parseFloat(data[3]));
            latest.ambient.push(parseFloat(data[4]));
            latest.temp.push(parseFloat(data[5])); // temp is on new firmware
        }
        // latest.push(parseFloat(data[3])) // stream latest ratio
    }
    else {
        console.log("HEGDUINO: ", newline);
    }
    return latest;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9kZXZpY2VzL2hlZ2R1aW5vL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksS0FBSyxHQUFhLEVBQUUsQ0FBQTtBQUN4QixJQUFJLEtBQWEsQ0FBQTtBQUVqQixNQUFNLENBQUMsSUFBTSxTQUFTLEdBQUcsVUFBQyxJQUFRLEVBQUUsSUFBUztJQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUMzQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBQyxPQUFjO0lBRWpDLElBQUksTUFBTSxHQUF5QjtRQUMvQixhQUFhO1FBQ2IsR0FBRyxFQUFFLEVBQUU7UUFDTixFQUFFLEVBQUcsRUFBRTtRQUNQLEtBQUssRUFBRSxFQUFFO1FBQ1QsT0FBTyxFQUFFLEVBQUU7UUFDWCxJQUFJLEVBQUUsRUFBRTtLQUNaLENBQUE7SUFFRCxJQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7UUFDMUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixvQkFBb0I7UUFDcEIsSUFBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNoQixXQUFXO1lBQ1gsOENBQThDO1lBQzlDLElBQUcsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQUMsQ0FBQyxtR0FBbUc7aUJBQzVLO2dCQUNELElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Z0JBQzdELEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7YUFDdEM7WUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtTQUNwRTtRQUNELDBEQUEwRDtLQUU3RDtTQUFNO1FBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FBRTtJQUU3QyxPQUFPLE1BQU0sQ0FBQTtBQUNqQixDQUFDLENBQUEifQ==