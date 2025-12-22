const logger = require('./logger');

class CircuitBreaker {
    constructor(requestFunction, options = {}) {
        this.requestFunction = requestFunction;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.state = "CLOSED"; // CLOSED, OPEN, HALF-OPEN

        this.failureThreshold = options.failureThreshold || 3;
        this.resetTimeout = options.resetTimeout || 5000; // 5 seconds
    }

    async fire(...args) {
        if (this.state === "OPEN") {
            if (Date.now() <= this.nextAttempt) {
                logger.warn('Circuit Breaker OPEN. Request blocked.');
                throw new Error("Service Unavailable (Circuit Open)");
            }
            this.state = "HALF-OPEN";
        }

        try {
            const result = await this.requestFunction(...args);
            this.success();
            return result;
        } catch (err) {
            this.fail();
            throw err;
        }
    }

    success() {
        this.successCount++;
        this.failureCount = 0;
        if (this.state === "HALF-OPEN") {
            this.state = "CLOSED";
            logger.info('Circuit Breaker reset to CLOSED');
        }
    }

    fail() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = "OPEN";
            this.nextAttempt = Date.now() + this.resetTimeout;
            logger.error(`Circuit Breaker tripped to OPEN. Failures: ${this.failureCount}`);
        }
    }
}

module.exports = CircuitBreaker;
