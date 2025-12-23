const express = require("express");
const router = express.Router();
const axios = require("axios");
const CircuitBreaker = require("../utils/CircuitBreaker");
const logger = require("../utils/logger");

// Wrap the API call
const executeCode = async (config) => {
    return await axios(config);
};

const breaker = new CircuitBreaker(executeCode, { failureThreshold: 3, resetTimeout: 10000 });

router.post("/", async (req, res) => {
    const { code, language, input } = req.body;

    // ... constructs config ...
    // Using simple mapping for now assuming standard JDoodle

    const program = {
        script: code,
        language: language,
        versionIndex: "0",
        clientId: process.env.jDoodle_clientId,
        clientSecret: process.env.jDoodle_clientSecret,
        stdin: input
    };

    const config = {
        method: "post",
        url: "https://api.jdoodle.com/v1/execute",
        headers: { "Content-Type": "application/json" },
        data: program,
    };

    try {
        const response = await breaker.fire(config);
        res.json({ run: response.data });
    } catch (error) {
        logger.error('Error executing code: %s', error.message);
        if (error.message === "Service Unavailable (Circuit Open)") {
            return res.status(503).json({ error: "Service busy, please try again later." });
        }
    }
});

module.exports = router;
