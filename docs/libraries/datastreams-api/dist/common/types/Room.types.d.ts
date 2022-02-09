export interface RoomInterface {
    uuid: string;
    name: string;
    initiator: string;
    restrictions: {
        users: string[];
        max: number;
    };
    peers: string[];
}
