# liveserver
This monorepo contains several NPM libraries for live communications.

> **Note:** This project is still in active development at the [brainsatplay](https://github.com/brainsatplay/brainsatplay) repo of the [Brains@Play project](https://github.com/brainsatplay/project).

## Contents
### Core
- **liveserver-router:** A set of generic message handlers written in Universal JavaScript.
- **liveserver-frontend:** Client-side HTTP and Websocket services.
- **liveserver-backend:** Server-side HTTP and Websocket services.

### Microservices
- **liveserver-database:** Store data + router extension for data management (implemented in [MyAlyce](https://github.com/MyAlyce/myalyce)).
- **liveserver-webrtc:** Pass messages to peers over WebRTC.

## Goals
- Clarify the possibilities of **liveserver** as a remote procedure call (RPC) handler and an [inter-process communication (IPC)](https://en.wikipedia.org/wiki/Inter-process_communication) framework.
- WebTorrent integration for creating P2P file servers

## Acknowledgments
Made for [Brains@Play](https://github.com/brainsatplay/liveserver) and [MyAlyce](https://github.com/MyAlyce/myalyce) projects, free for anyone (AGPL v3.0 copyleft).
