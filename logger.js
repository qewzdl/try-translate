export function logger(req, res, next) {
    const message = `[${req.method}] ${req.url}`;

    console.log(message);

    next();
}