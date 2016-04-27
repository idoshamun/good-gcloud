'use strict';

const gcloud = require('gcloud')({
    projectId: process.env.GAE_LONG_APP_ID,
    credentials: {
        client_email: process.env.GAE_EMAIL,
        private_key: process.env.GAE_KEY
    }
});
const logging = gcloud.logging();
const log = logging.log('my-test');
const resource = {
    type: 'gce_instance',
    labels: {
        zone: 'global',
        instance_id: 'hapijs-server'
    }
};

const entry = log.entry(resource, {
    delegate: 'ido'
});
entry.severity = 'INFO';
const timestamp = new Date().getTime();
entry.timestamp = {
    nanos: (timestamp % 1000) * 1000000,
    seconds: timestamp / 1000
};
entry.labels = {
    tag1: 'true',
    tag2: 'true'
};

log.write(entry, (err) => {

    if (err) {
        console.error(err);
    }
    process.exit();
});
