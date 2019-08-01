'use strict';

const Stream = require('stream');
const Hoek = require('@hapi/hoek');
const SafeStringify = require('json-stringify-safe');

const internals = {
    defaults: {
        gcloud: {
            projectId: process.env.GAE_LONG_APP_ID
        },
        log: {
            name: 'app',
            resource: {
                type: 'gce_instance',
                labels: {
                    zone: 'global',
                    instance_id: 'hapijs-server'
                }
            }
        }
    }
};

internals.utility = {
    formatOutput(event, log, resource) {

        const severity =
            ['DEFAULT', 'DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'];

        const timestamp = parseInt(event.timestamp, 10);

        for (let i = 0; i < severity.length; ++i) {
            const index = event.tags.indexOf(severity[i].toLowerCase());
            if (index >= 0) {
                event.severity = severity[i];
                event.tags.splice(index, 1);
                break;
            }
        }

        if (!event.severity) {
            event.severity = severity[0];
        }

        return log.entry({
            severity: event.severity,
            timestamp: {
                nanos: (timestamp % 1000) * 1000000,
                seconds: timestamp / 1000
            },
            labels: event.tags.reduce((res, tag) => {

                res[tag] = 'true';
                return res;
            }, {}),
            resource
        }, event.data);
    },

    formatResponse(event, tags, log, resource) {

        event.query = event.query ? JSON.stringify(event.query) : '';

        const response = {
            timestamp: event.timestamp,
            tags,
            severity: 'INFO',
            event: 'response',
            data: {
                message: `${event.instance}: ${event.method} ${event.path} ${event.query} ${event.statusCode} (${event.responseTime}ms)`,
                instance: event.instance,
                method: event.method,
                path: event.path,
                query: event.query,
                statusCode: event.statusCode,
                responseTime: event.responseTime
            }
        };

        return internals.utility.formatOutput(response, log, resource);
    },

    formatOps(event, tags, log, resource) {

        const memory = Math.round(event.proc.mem.rss / (1024 * 1024));

        const ops = {
            timestamp: event.timestamp,
            tags,
            severity: 'INFO',
            event: 'ops',
            data: {
                message: `memory: ${memory}Mb, uptime (seconds): ${event.proc.uptime}, load: [${event.os.load}]`,
                memory,
                uptime: event.proc.uptime,
                load: event.os.load
            }
        };

        return internals.utility.formatOutput(ops, log, resource);
    },

    formatError(event, tags, log, resource) {

        const error = {
            timestamp: event.timestamp,
            tags,
            severity: 'ERROR',
            event: 'error',
            data: {
                message: `message: ${event.error.message} stack: ${event.error.stack}`,
                error: event.error.message,
                stack: event.error.stack
            }
        };

        return internals.utility.formatOutput(error, log, resource);
    },

    formatDefault(event, tags, log, resource) {

        if (!event.data.message) {
            if (typeof event.data === 'object') {
                event.data.message = SafeStringify(event.data);
            }
            else {
                event.data = {
                    message: event.data
                };
            }
        }

        const defaults = {
            timestamp: event.timestamp,
            tags,
            event: 'log',
            data: event.data
        };

        return internals.utility.formatOutput(defaults, log, resource);
    },

    formatEvent(event, tags, log, resource) {

        const eventName = event.event;

        if (eventName === 'error') {
            return internals.utility.formatError(event, tags, log, resource);
        }

        if (eventName === 'ops') {
            return internals.utility.formatOps(event, tags, log, resource);
        }

        if (eventName === 'response') {
            return internals.utility.formatResponse(event, tags, log, resource);
        }

        if (!event.data) {
            return;
        }

        return internals.utility.formatDefault(event, tags, log, resource);
    }
};

class GoodGcloud extends Stream.Writable {
    constructor(config) {

        super({ objectMode: true });

        config = config || {};
        this._settings = Hoek.applyToDefaults(internals.defaults, config);

        this.logging = new (require('@google-cloud/logging').Logging)(this._settings.gcloud);
        this.log = this.logging.log(this._settings.log.name);
    }

    _write(data, enc, next) {

        let tags = [];

        if (data.tags) {
            if (!Array.isArray(data.tags)) {
                tags = [data.tags];
            }
            else {
                tags = data.tags;
            }
        }

        tags.unshift(data.event);

        const entry = internals.utility.formatEvent(data, tags, this.log, this._settings.log.resource);
        if (!entry) {
            return next();
        }

        this.log.write(entry, (err) => next(err));
    }
}

module.exports = GoodGcloud;
