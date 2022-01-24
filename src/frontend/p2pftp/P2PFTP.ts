//import * from 'brainsatplay-storage'

//Uses a BrowserFS instance of IndexedDB to create a file transfer protocol, e.g. through WebRTC (like Webtorrent)
export class P2PFTP {

    constructor() {

    }

}


/*
Abstract:

with a Dataset in memory

Encode as CSV text (or preferred format) into IndexedDB (becoming byte buffers) via BrowserFS
If dataset exceeds a certain size after enough written (e.g. over time), 
    split the file into chunks in IndexedDB

Now a peer connects for your saved data:

If a peer is only looking for a piece of an indexed dataset: stream that chunk or that part of that chunk to them

If a peer wants to seed, stream the chunks to them and they become a seeder. Can toggle if a dataset should be distributed fully or if chunks should be divided between seeders
    if fully copying datasets to each seeder, then anyone can go offline at anytime and the dataset is still fully accessible
    if distributing chunks of the dataset, some chunks may go offline but the data will be more widely distributable

We can use the Session service to organize rooms with access and customizable controls

*/