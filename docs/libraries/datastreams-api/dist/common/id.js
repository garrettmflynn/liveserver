import { v4 as uuid } from 'uuid';
export var randomUUID = function () {
    // // Use Crypto API
    if (globalThis.crypto)
        return globalThis.crypto.randomUUID();
    // // Or Generate our UUID
    else
        return uuid();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb21tb24vaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFRbEMsTUFBTSxDQUFDLElBQU0sVUFBVSxHQUFHO0lBRXRCLG9CQUFvQjtJQUNwQixJQUFJLFVBQVUsQ0FBQyxNQUFNO1FBQUUsT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBRTVELDBCQUEwQjs7UUFDckIsT0FBTyxJQUFJLEVBQUUsQ0FBQTtBQUN0QixDQUFDLENBQUEifQ==