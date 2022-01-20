export class ServiceManager {

    constructor({
        expressRouter,
        wsServer,
        eventSourceServer
    }) {

        this.expressRouter = expressRouter
        this.wsServer = wsServer

    }

    set = (config) => {

        if (this.wsServer) this.wsServer.add

        if (this.expressRouter) this.router[config.type](config.route, config.callback)
    }
}