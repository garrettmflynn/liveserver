import { randomUUID } from "../../common/id";
export var DataDeviceInfo = function (constraints) {
    var protocols = new Set();
    if (Array.isArray(constraints.protocols))
        constraints.protocols.forEach(function (str) { return protocols.add(str); });
    else {
        if (constraints.serviceUUID)
            protocols.add('bluetooth');
        if (constraints.usbVendorId)
            protocols.add('serial');
        if (constraints.url) {
            protocols.add('wifi');
            protocols.add('websocket');
        }
    }
    return {
        deviceId: randomUUID(),
        groupId: randomUUID(),
        kind: constraints.kind,
        label: constraints.label,
        protocols: Array.from(protocols),
        modes: constraints === null || constraints === void 0 ? void 0 : constraints.modes
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YURldmljZUluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFEZXZpY2VJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUc1QyxNQUFNLENBQUMsSUFBTSxjQUFjLEdBQUcsVUFBQyxXQUFrQztJQUU3RCxJQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFBO0lBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO1FBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxHQUFVLElBQUssT0FBQSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFsQixDQUFrQixDQUFDLENBQUE7U0FDdEc7UUFDRCxJQUFJLFdBQVcsQ0FBQyxXQUFXO1lBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUN2RCxJQUFJLFdBQVcsQ0FBQyxXQUFXO1lBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNyRCxJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDakIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNyQixTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1NBQzdCO0tBQ0o7SUFFRCxPQUFPO1FBQ0gsUUFBUSxFQUFFLFVBQVUsRUFBRTtRQUN0QixPQUFPLEVBQUUsVUFBVSxFQUFFO1FBQ3JCLElBQUksRUFBRSxXQUFXLENBQUMsSUFBSTtRQUN0QixLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUs7UUFDeEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hDLEtBQUssRUFBRSxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUUsS0FBSztLQUM1QixDQUFBO0FBQ0wsQ0FBQyxDQUFBIn0=