export function createRoute (path:string, remote:string|URL) {
  let baseUrl = (remote instanceof URL) ? remote : new URL(remote)
    path = (baseUrl.pathname === '/') ? path : baseUrl.pathname + path
    let href = (new URL(path, baseUrl.href)).href
    return href
  }

  export function getRouteMatches(route) {
    let matches = [route, route + '/*', route + '/**']
        let split = route.split('/')
        split = split.slice(0,split.length-1)
        split.forEach((_,i) => {
            let slice = split.slice(0,i+1).join('/')
            matches.push(slice, slice + '/*', slice + '/**')
        })

        return matches
  }