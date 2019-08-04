# good-gcloud
Google Cloud Platform logging broadcasting for Good process monitor

[![Build status](https://travis-ci.org/elegantmonkeys/good-gcloud.svg?branch=master)](https://travis-ci.org/elegantmonkeys/good-gcloud) [![Greenkeeper badge](https://badges.greenkeeper.io/elegantmonkeys/good-gcloud.svg)](https://greenkeeper.io/)

## Good Gcloud

Extends `Stream.Writable` and send logs to GCP Logging

### `new GoodGcloud (options)`

Creates a new `GoodGcloud` writable stream.

- `[options]` - optional options. Defaults to `{ gcloud: { projectId: process.env.GAE_LONG_APP_ID }, log : { name: "app", resource: { type: "gce_instance", labels: { zone: "global", instance_id: "hapijs-server"}}}}`
    - `gcloud` - object to initialize gcloud api. [Read more](https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.31.0/gcloud)
    - `log` - log options
        - `name` - log name in GCP Logging. [Read more](https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.31.0/logging?method=log)
        - `resource` - GCP monitored resource. [Read more](https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.31.0/logging/entry)