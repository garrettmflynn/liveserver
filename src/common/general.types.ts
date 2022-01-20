export type RouteConfig = {
    id?: boolean | string,
    method?: 'GET' | 'POST',
    route: string,
    callback: (...args:any[]) => any
}

export type ClientObject = {
    id: string,
    routes: Map<string, RouteConfig>
}