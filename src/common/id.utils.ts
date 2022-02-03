export const randomId = (prefix?) => ((prefix) ? `${prefix}_` : '')  + Math.floor(100000*Math.random())

export const pseudoObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
    s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h))