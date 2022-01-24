export function createRoute (path:string, remote:string|URL) {
    let baseUrl = (remote instanceof URL) ? remote : new URL(remote)
    path = (baseUrl.pathname === '/') ? path : baseUrl.pathname + path
    let href = (new URL(path, baseUrl.href)).href
    return href
  }