export function createRoute (path:string, remote:string|URL) {
  let baseUrl = (remote instanceof URL) ? remote : new URL(remote)
    path = (baseUrl.pathname === '/') ? path : baseUrl.pathname + path
    let href = (new URL(path, baseUrl.href)).href
    return href
  }

  export function getRouteMatches(route) {
        let split = route.split('/')
        split = split.slice(0,split.length-1)

        let matches = [route]
        if (split.length === 0) matches.push(route + '/*')
        matches.push(route + '/**')

        split.forEach((_,i) => {
            let slice = split.slice(0,i+1).join('/')
            if (i === split.length - 1) matches.push(slice + '/*')
            matches.push(slice + '/**')
        })

        return matches
  }