import { __awaiter, __extends, __generator, __read, __values } from "tslib";
import { Pipe } from "./Pipe";
import { DataChannel } from "../core/DataChannel";
var PeerPipe = /** @class */ (function (_super) {
    __extends(PeerPipe, _super);
    function PeerPipe(settings) {
        var _this = _super.call(this, 'stream', settings) || this;
        _this.peers = new Map();
        _this.dataChannelQueueLength = 0;
        _this.dataChannels = new Map();
        _this.rooms = new Map();
        _this.sources = new Map();
        _this.toResolve = {}; // for tracking DataChannel callbacks
        _this.hasResolved = {}; // for tracking DataChannel callbacks
        _this.onpeerdisconnect = function (_) { };
        _this.onpeerconnect = function (_) { };
        _this.ondatachannel = function (_) { };
        _this.onroom = function (_) { };
        _this.ontrack = function (_) { };
        // ontrackremoved = (ev:CustomEvent) => {}
        _this.onroomclosed = function (_) { };
        // Add DataStreamTracks from DataStream (in series)
        _this.addDataTracks = function (id, tracks) { return __awaiter(_this, void 0, void 0, function () {
            var _loop_1, this_1, tracks_1, tracks_1_1, track, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _loop_1 = function (track) {
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, this_1.openDataChannel({ name: "DataStreamTrack".concat(this_1.dataChannelQueueLength), peer: id, reciprocated: false }).then(function (o) { return track.subscribe(o.sendMessage); })]; // stream over data channel
                                    case 1:
                                        _c.sent(); // stream over data channel
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        tracks_1 = __values(tracks), tracks_1_1 = tracks_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!tracks_1_1.done) return [3 /*break*/, 5];
                        track = tracks_1_1.value;
                        return [5 /*yield**/, _loop_1(track)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        tracks_1_1 = tracks_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (tracks_1_1 && !tracks_1_1.done && (_a = tracks_1.return)) _a.call(tracks_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        // Note: Will run on initial offer and subsequent renegotiations
        _this.onoffer = function (peerInfo, sdp, peerId) { return __awaiter(_this, void 0, void 0, function () {
            var myPeerConnection, description;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createPeerConnection(peerInfo, peerId)];
                    case 1:
                        myPeerConnection = _a.sent();
                        description = new RTCSessionDescription(sdp);
                        myPeerConnection.setRemoteDescription(description).then(function () { return myPeerConnection.createAnswer(); }).then(function (sdp) { return myPeerConnection.setLocalDescription(sdp); })
                            .then(function () {
                            _this.send({ cmd: 'answer', data: { id: peerInfo.id, msg: myPeerConnection.localDescription } });
                        });
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleNegotiationNeededEvent = function (localConnection, id) {
            localConnection.createOffer()
                .then(function (sdp) { return localConnection.setLocalDescription(sdp); })
                .then(function () {
                _this.send({ cmd: 'offer', data: { id: id, msg: localConnection.localDescription } });
            });
        };
        _this.handleICECandidateEvent = function (event, id) {
            if (event.candidate)
                _this.send({ cmd: 'candidate', data: { id: id, msg: event.candidate } });
        };
        _this.handleTrackEvent = function (event, id) {
            if (event.track) {
                var track = event.track;
                _this.dispatchEvent(new CustomEvent('track', { detail: { track: track, id: id } }));
                return true;
            }
            else
                return null;
        };
        // NOTE: This data channel will always be the one that can send/receive information
        _this.handleDataChannelEvent = function (ev, _) { return __awaiter(_this, void 0, void 0, function () {
            var o, toResolve;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.openDataChannel({ channel: ev.channel, callback: function (msg, channel) { return channel.addData(msg); } })];
                    case 1:
                        o = _a.sent();
                        toResolve = this.toResolve[o.label];
                        if (toResolve) {
                            delete this.toResolve[o.label];
                            toResolve(o);
                        }
                        this.hasResolved[o.label] = o; // keep track of channels already resolved
                        this.dispatchEvent(new CustomEvent('datachannel', { detail: o }));
                        return [2 /*return*/];
                }
            });
        }); };
        // handleRemoveTrackEvent = (ev,id) => {
        //     if (ev.track){
        //         let track = ev.track
        //         this.dispatchEvent(new CustomEvent('trackremoved', {detail: {track, id}}))
        //         return true
        //     }
        // }
        _this.handleICEConnectionStateChangeEvent = function (_, info) {
            var peer = _this.peers.get(info.id);
            switch (peer === null || peer === void 0 ? void 0 : peer.iceConnectionState) {
                case "closed":
                case "failed":
                    _this.closeConnection(info, peer);
                    break;
            }
        };
        _this.handleICEGatheringStateChangeEvent = function (_) { };
        _this.handleSignalingStateChangeEvent = function (_, info) {
            var peer = _this.peers.get(info.id);
            switch (peer === null || peer === void 0 ? void 0 : peer.signalingState) {
                case "closed":
                    _this.closeConnection(info, peer);
                    break;
            }
        };
        _this.closeConnection = function (info, peer) {
            if (peer)
                _this.dispatchEvent(new CustomEvent('peerdisconnect', { detail: Object.assign(info, { peer: peer }) }));
        };
        _this.createPeerConnection = function (peerInfo, peerId) { return __awaiter(_this, void 0, void 0, function () {
            var localConnection;
            var _this = this;
            return __generator(this, function (_a) {
                localConnection = new RTCPeerConnection(this.config);
                // Add Local MediaStreamTracks to Peer Connection (on first offer)
                this.sources.forEach(function (s) {
                    s.getTracks().forEach(function (track) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (track instanceof MediaStreamTrack)
                                localConnection.addTrack(track, s); // ensure connection has track
                            return [2 /*return*/];
                        });
                    }); });
                });
                localConnection.onicecandidate = function (e) { return _this.handleICECandidateEvent(e, peerInfo.id); }; // send candidates to remote
                localConnection.onnegotiationneeded = function () { return _this.handleNegotiationNeededEvent(localConnection, peerInfo.id); }; // offer to remote
                localConnection.ondatachannel = function (e) { return _this.handleDataChannelEvent(e, peerInfo.id); };
                peerInfo.peer = localConnection;
                if (!peerId)
                    this.dispatchEvent(new CustomEvent('peerconnect', { detail: peerInfo }));
                else {
                    // Only respond to tracks from remote peers
                    localConnection.ontrack = function (e) {
                        _this.handleTrackEvent(e, peerId);
                    };
                    // localConnection.onremovetrack = (e) => this.handleRemoveTrackEvent(e, peerId);
                    localConnection.oniceconnectionstatechange = function (e) { return _this.handleICEConnectionStateChangeEvent(e, peerInfo); };
                    localConnection.onicegatheringstatechange = function (e) { return _this.handleICEGatheringStateChangeEvent(e); };
                    localConnection.onsignalingstatechange = function (e) { return _this.handleSignalingStateChangeEvent(e, peerInfo); };
                }
                return [2 /*return*/, localConnection];
            });
        }); };
        _this.add = function (source) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (source) {
                    this.sources.set(source.id, source);
                    source.addEventListener('track', (function (ev) {
                        var e_2, _a;
                        var kind = ev.detail.kind;
                        if (!kind || (kind !== 'video' && kind !== 'audio')) {
                            try {
                                for (var _b = __values(_this.peers), _c = _b.next(); !_c.done; _c = _b.next()) {
                                    var arr = _c.value;
                                    _this.addDataTracks(arr[0], [ev.detail]);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                    }));
                }
                return [2 /*return*/];
            });
        }); };
        _this.remove = function (id) {
            var source = _this.sources.get(id);
            _this.sources.delete(id);
            source.removeEventListener('track', source);
        };
        _this.getRooms = function (auth) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send({ cmd: 'rooms', data: auth })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data];
                }
            });
        }); };
        _this.joinRoom = function (room, info, auth) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send({ cmd: "connect", data: { auth: auth, info: info, room: room } })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        _this.createRoom = function (room) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.send({ cmd: 'createroom', room: room })];
        }); }); };
        _this.leaveRoom = function (room) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.peers.forEach(function (_, key) { return _this.peers.delete(key); });
                return [2 /*return*/, this.send({ cmd: 'disconnect', room: room })];
            });
        }); };
        _this.send = function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.socket) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.socket.send(data, 'webrtc')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        _this.openDataChannel = function (_a) {
            var peer = _a.peer, channel = _a.channel, name = _a.name, callback = _a.callback, reciprocated = _a.reciprocated;
            return __awaiter(_this, void 0, void 0, function () {
                var local, peerConnection;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            local = false;
                            this.dataChannelQueueLength++; // increment name
                            if (!(channel instanceof RTCDataChannel) && peer) {
                                local = true;
                                peerConnection = this.peers.get(peer);
                                console.error('Opening data channel');
                                if (peerConnection)
                                    channel = peerConnection.createDataChannel(name !== null && name !== void 0 ? name : 'my-data-channel');
                            }
                            return [4 /*yield*/, this.useDataChannel(channel, callback, local, reciprocated)];
                        case 1: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        _this.closeDataChannel = function (id) { return __awaiter(_this, void 0, void 0, function () {
            var dC;
            return __generator(this, function (_a) {
                dC = this.dataChannels.get(id);
                if (dC)
                    dC.close();
                this.dataChannels.delete(id);
                return [2 /*return*/];
            });
        }); };
        _this.useDataChannel = function (dataChannel, onMessage, local, reciprocated) {
            if (onMessage === void 0) { onMessage = function () { }; }
            if (local === void 0) { local = false; }
            if (reciprocated === void 0) { reciprocated = true; }
            return new Promise(function (resolve) {
                // Assign Event Listeners on Open
                dataChannel.addEventListener("open", function () {
                    // Track DataChannel Instances
                    var dC = new DataChannel(dataChannel);
                    if (local)
                        _this.dataChannels.set(dC.id, dC); // only save local
                    var toResolve = function (channel) {
                        // Set OnMessage Callback
                        channel.parent.addEventListener("message", function (event) {
                            if (onMessage)
                                onMessage(JSON.parse(event.data), channel); // parse messages from peer
                        });
                        // Resolve to User
                        channel.sendMessage = function (message) { _this.sendMessage(message, channel.id, reciprocated); }; // TODO: Make this internal to the DataChannel?
                        resolve(channel);
                    };
                    // If you know this won't be reciprocated, then resolve immediately
                    if (!local || !reciprocated)
                        toResolve(dC);
                    // Otherwise mark to resolve OR resolve if this channel already has been
                    else {
                        var existingResolve = _this.hasResolved[dC.label];
                        if (existingResolve) {
                            toResolve(existingResolve);
                            delete _this.hasResolved[dC.label];
                        }
                        else
                            _this.toResolve[dC.label] = toResolve;
                    }
                });
                dataChannel.addEventListener("close", function () { console.error('Data channel closed', dataChannel); });
            });
        };
        _this.sendMessage = function (message, id, reciprocated) {
            var data = JSON.stringify(message);
            // Ensure Message Sends to Both Channel Instances
            var check = function () {
                var dC = _this.dataChannels.get(id);
                if (dC) {
                    if (dC.parent.readyState === 'open')
                        dC.send(data); // send on open instead
                    else
                        dC.parent.addEventListener('open', function () { dC.send(data); }); // send on open instead
                }
                else if (reciprocated)
                    setTimeout(check, 500);
            };
            check();
        };
        _this.add(settings.source);
        _this.config = {
            iceServers: [
                {
                    urls: ["stun:stun.l.google.com:19302"]
                }
            ]
        };
        // ---------------------------- Event Listeners ----------------------------
        _this.addEventListener('peerdisconnect', (function (ev) { _this.peers.delete(ev.detail.id); }));
        _this.addEventListener('peerdisconnect', (function (ev) { _this.onpeerdisconnect(ev); }));
        _this.addEventListener('peerconnect', (function (ev) { _this.peers.set(ev.detail.id, ev.detail.peer); }));
        _this.addEventListener('peerconnect', (function (ev) { _this.onpeerconnect(ev); }));
        _this.addEventListener('datachannel', (function (ev) { _this.ondatachannel(ev); }));
        _this.addEventListener('room', (function (ev) { _this.onroom(ev); }));
        _this.addEventListener('track', (function (ev) { _this.ontrack(ev); }));
        // this.addEventListener('trackremoved', ((ev:CustomEvent) => { this.ontrackremoved(ev)}) as EventListener )
        _this.addEventListener('roomclosed', (function (ev) { _this.onroomclosed(ev); }));
        // ---------------------------- Socket Messages ----------------------------
        if (_this.socket) {
            var prevSocketCallback_1 = _this.socket.onmessage;
            _this.socket.onmessage = function (res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, arr, dataTracks, e_3_1, peer, peer, candidate;
                var e_3, _c;
                var _this = this;
                var _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            prevSocketCallback_1(res);
                            if (!(res.cmd === 'rooms')) return [3 /*break*/, 1];
                            res.data.forEach(function (room) { _this.rooms.set(room.uuid, room); });
                            this.dispatchEvent(new CustomEvent('room', { detail: { rooms: res.data } }));
                            return [3 /*break*/, 13];
                        case 1:
                            if (!(res.cmd === 'roomadded')) return [3 /*break*/, 2];
                            this.rooms.set(res.data.uuid, res.data);
                            this.dispatchEvent(new CustomEvent('room', { detail: { room: res.data, rooms: Array.from(this.rooms, function (_a) {
                                        var _b = __read(_a, 2), _ = _b[0], value = _b[1];
                                        return value;
                                    }) } }));
                            return [3 /*break*/, 13];
                        case 2:
                            if (!(res.cmd === 'roomclosed')) return [3 /*break*/, 3];
                            this.dispatchEvent(new CustomEvent('roomclosed'));
                            return [3 /*break*/, 13];
                        case 3:
                            if (!(res.cmd === 'connect')) return [3 /*break*/, 12];
                            this.createPeerConnection(res.data); // connect to peer
                            _e.label = 4;
                        case 4:
                            _e.trys.push([4, 9, 10, 11]);
                            _a = __values(this.sources), _b = _a.next();
                            _e.label = 5;
                        case 5:
                            if (!!_b.done) return [3 /*break*/, 8];
                            arr = _b.value;
                            dataTracks = arr[1].getDataTracks();
                            return [4 /*yield*/, this.addDataTracks((_d = res.data) === null || _d === void 0 ? void 0 : _d.id, dataTracks)]; // add data tracks from all sources
                        case 6:
                            _e.sent(); // add data tracks from all sources
                            _e.label = 7;
                        case 7:
                            _b = _a.next();
                            return [3 /*break*/, 5];
                        case 8: return [3 /*break*/, 11];
                        case 9:
                            e_3_1 = _e.sent();
                            e_3 = { error: e_3_1 };
                            return [3 /*break*/, 11];
                        case 10:
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_3) throw e_3.error; }
                            return [7 /*endfinally*/];
                        case 11: return [3 /*break*/, 13];
                        case 12:
                            if (res.cmd === 'answer') {
                                peer = this.peers.get(res.data.id);
                                if (peer)
                                    peer.setRemoteDescription(res.data.msg);
                            }
                            else if (res.cmd === 'candidate') {
                                peer = this.peers.get(res.data.id);
                                candidate = new RTCIceCandidate(res.data.msg);
                                if (peer)
                                    peer.addIceCandidate(candidate).catch(function (e) { return console.error(e); }); // thrown multiple times since initial candidates aren't usually appropriate
                            }
                            else if (res.cmd === 'disconnectPeer') {
                                this.closeConnection(res.data, this.peers.get(res.data.id));
                            }
                            // ----------------- Remote Initiation Handlers -----------------
                            else if (res.cmd === 'offer')
                                this.onoffer(res.data, res.data.msg, res.id);
                            _e.label = 13;
                        case 13: return [2 /*return*/];
                    }
                });
            }); };
        }
        return _this;
    }
    Object.defineProperty(PeerPipe.prototype, Symbol.toStringTag, {
        get: function () { return 'PeerPipe'; },
        enumerable: false,
        configurable: true
    });
    return PeerPipe;
}(Pipe));
export { PeerPipe };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGVlci5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcGlwZXMvUGVlci5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzlCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQWdCaEQ7SUFBOEIsNEJBQUk7SUFhOUIsa0JBQVksUUFBeUI7UUFBckMsWUFDSSxrQkFBTSxRQUFRLEVBQUUsUUFBUSxDQUFDLFNBb0U1QjtRQS9FRCxXQUFLLEdBQWtDLElBQUksR0FBRyxFQUFFLENBQUE7UUFDaEQsNEJBQXNCLEdBQVcsQ0FBQyxDQUFBO1FBQ2xDLGtCQUFZLEdBQW9CLElBQUksR0FBRyxFQUFFLENBQUE7UUFDekMsV0FBSyxHQUE4QixJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQzVDLGFBQU8sR0FBb0IsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNwQyxlQUFTLEdBQXNCLEVBQUUsQ0FBQSxDQUFDLHFDQUFxQztRQUN2RSxpQkFBVyxHQUE4QixFQUFFLENBQUEsQ0FBQyxxQ0FBcUM7UUEyRWpGLHNCQUFnQixHQUFHLFVBQUMsQ0FBYSxJQUFNLENBQUMsQ0FBQTtRQUN4QyxtQkFBYSxHQUFHLFVBQUMsQ0FBYSxJQUFNLENBQUMsQ0FBQTtRQUNyQyxtQkFBYSxHQUFHLFVBQUMsQ0FBYSxJQUFNLENBQUMsQ0FBQTtRQUNyQyxZQUFNLEdBQUcsVUFBQyxDQUFhLElBQU0sQ0FBQyxDQUFBO1FBQzlCLGFBQU8sR0FBRyxVQUFDLENBQWEsSUFBTSxDQUFDLENBQUE7UUFDL0IsMENBQTBDO1FBQzFDLGtCQUFZLEdBQUcsVUFBQyxDQUFhLElBQU0sQ0FBQyxDQUFBO1FBRXBDLG1EQUFtRDtRQUNuRCxtQkFBYSxHQUFHLFVBQU8sRUFBUyxFQUFFLE1BQXdCOzs7Ozs7NENBQzdDLEtBQUs7Ozs0Q0FDVixxQkFBTSxPQUFLLGVBQWUsQ0FBQyxF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