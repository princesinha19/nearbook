import history from '../Utils/History';

export function get(...paramNames) {
    const params = new URLSearchParams(history.location.search);

    if (paramNames.length === 1) {
        return params.get(paramNames[0])
    }

    return paramNames.reduce(
        (obj, paramName) => ({ ...obj, [paramName]: params.get(paramName) }),
        {}
    )
}

export function set(newParams) {
    const params = new URLSearchParams(history.location.search)
    for (const param in newParams) {
        params.set(param, newParams[param])
    }
    console.log(history.location.pathname)
    window.history.replaceState({}, '', `/nearbook/#/rainbow-bridge/?${params}`);
}

export function clear(...paramNames) {
    if (paramNames.length === 0) {
        window.history.replaceState({}, '', `${history.location.pathname}`)
    } else {
        const params = new URLSearchParams(history.location.search)
        paramNames.forEach(p => params.delete(p))

        window.history.replaceState({}, '', `/nearbook/#/rainbow-bridge/`);
    }
}
