import { Pipe } from "./Pipe";
import { DataChannel } from "../core/DataChannel";
import { RoomInterface } from "../../common/types/Room.types";
import { PipeSettingsType, DataChannelInfoType, DataChannelCallbackType } from '../types/Pipes.types';
import { DataStreamTrack, DataStream } from '../core/index';
import { PeerInfoType } from 'src/common/types/Peer.types';
export declare class PeerPipe extends Pipe {
    config: RTCConfiguration;
    peers: Map<string, RTCPeerConnection>;
    dataChannelQueueLength: number;
    dataChannels: Map<string, any>;
    rooms: Map<string, RoomInterface>;
    sources: Map<string, any>;
    toResolve: {
        [x: string]: any;
    };
    hasResolved: {
        [x: string]: DataChannel;
    };
    get [Symbol.toStringTag](): string;
    constructor(settings: PipeSettingsType);
    onpeerdisconnect: (_: CustomEvent) => void;
    onpeerconnect: (_: CustomEvent) => void;
    ondatachannel: (_: CustomEvent) => void;
    onroom: (_: CustomEvent) => void;
    ontrack: (_: CustomEvent) => void;
    onroomclosed: (_: CustomEvent) => void;
    addDataTracks: (id: string, tracks: DataStreamTrack[]) => Promise<void>;
    onoffer: (peerInfo: PeerInfoType, sdp: RTCSessionDescriptionInit, peerId: string) => Promise<void>;
    handleNegotiationNeededEvent: (localConnection: RTCPeerConnection, id: string) => void;
    handleICECandidateEvent: (event: RTCPeerConnectionIceEvent, id: string) => void;
    handleTrackEvent: (event: RTCTrackEvent, id: string) => true | null;
    handleDataChannelEvent: (ev: RTCDataChannelEvent, _: string) => Promise<void>;
    handleICEConnectionStateChangeEvent: (_: Event, info: PeerInfoType) => void;
    handleICEGatheringStateChangeEvent: (_: Event) => void;
    handleSignalingStateChangeEvent: (_: Event, info: PeerInfoType) => void;
    closeConnection: (info: PeerInfoType, peer?: RTCPeerConnection | undefined) => void;
    createPeerConnection: (peerInfo: PeerInfoType, peerId?: string | undefined) => Promise<RTCPeerConnection>;
    add: (source?: DataStream | undefined) => Promise<void>;
    remove: (id: string) => void;
    getRooms: (auth: string) => Promise<{
        cmd: string;
        data: any;
    }>;
    joinRoom: (room: RoomInterface, info: {
        [x: string]: any;
    }, auth: string) => Promise<unknown>;
    createRoom: (room: RoomInterface) => Promise<unknown>;
    leaveRoom: (room: RoomInterface) => Promise<unknown>;
    send: (data: object) => Promise<unknown>;
    openDataChannel: ({ peer, channel, name, callback, reciprocated }: DataChannelInfoType) => Promise<DataChannel>;
    closeDataChannel: (id: string) => Promise<void>;
    useDataChannel: (dataChannel: RTCDataChannel, onMessage?: DataChannelCallbackType, local?: boolean, reciprocated?: boolean) => Promise<DataChannel>;
    sendMessage: (message: object, id: string, reciprocated: boolean) => void;
}
