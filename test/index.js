'use strict';

const Stream = require('stream');

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const GoodGcloud = require('..');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

const internals = {
    readStream() {

        const stream = new Stream.Readable({ objectMode: true });
        stream._read = () => {};

        return stream;
    },

    gcloudStream() {

        return new GoodGcloud({
            gcloud: {
                keyFilename: 'key.json'
            },
            log: {
                name: 'test'
            }
        });
    },

    checkForNoErrors(stream, resolve) {

        const errors = [];

        stream.on('error', (err) => {

            errors.push(err);
        });

        stream.on('finish', () => {

            expect(errors).to.be.empty();
            return resolve();
        });
    }
};

describe('GoodGcloud', () => {

    it('should create stream without configuration', { plan: 1 }, () => {

        const stream = new GoodGcloud();
        expect(stream).to.exist();
    });

    it('should not send log without data', { plan: 1 }, () => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'log',
                timestamp: new Date().getTime(),
                tags: ['api', 'tag', 'debug']
            });
            read.push(null);
        });
    });

    it('should set severity by tag and send log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'log',
                timestamp: new Date().getTime(),
                tags: ['api', 'tag', 'debug'],
                data: { key: 'value' }
            });
            read.push(null);
        });
    });

    it('should set data as message and send log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'log',
                timestamp: new Date().getTime(),
                tags: 'custom',
                data: 'my custom log'
            });
            read.push(null);
        });
    });

    it('should set a custom message and send log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'log',
                timestamp: new Date().getTime(),
                data: { message: 'hello world', key: 'value' }
            });
            read.push(null);
        });
    });

    it('should send an error log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'error',
                timestamp: new Date().getTime(),
                error: new Error('something went wrong!')
            });
            read.push(null);
        });
    });

    it('should send an ops log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'ops',
                timestamp: new Date().getTime(),
                proc: {
                    mem: {
                        rss: 4 * 1024 * 1024
                    },
                    uptime: 5
                },
                os: {
                    load: 40
                }
            });
            read.push(null);
        });
    });

    it('should send a response log', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'response',
                timestamp: new Date().getTime(),
                instance: 'http://localhost:3000',
                method: 'GET',
                path: '/test',
                statusCode: 200,
                responseTime: 100
            });
            read.push(null);
        });
    });

    it('should send a response log with query', { plan: 1 }, (done) => {

        return new Promise((resolve) => {

            const stream = internals.gcloudStream();
            internals.checkForNoErrors(stream, resolve);

            const read = internals.readStream();

            read.pipe(stream);

            read.push({
                event: 'response',
                timestamp: new Date().getTime(),
                instance: 'http://localhost:3000',
                method: 'GET',
                path: '/test',
                query: {
                    var1: 'value1',
                    var2: 'value2'
                },
                statusCode: 200,
                responseTime: 100
            });
            read.push(null);
        });
    });
});

