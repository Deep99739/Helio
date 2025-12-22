const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        console.error("Auth Header:", req.header('Authorization'));
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

module.exports = auth;
