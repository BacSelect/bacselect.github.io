# BacSelect download counter

This Worker stores aggregate BacSelect panel-download event counts.

The stored dimensions are only:

- panel identity;
- exact panel size N;
- download format;
- aggregate count;
- last update timestamp.

No user identifier, IP address, browser identifier, referrer, or other
person-level field is stored in D1.

## Counter semantics

A count represents a download action initiated from the BacSelect website.

Counts are not unique users and are not a scientific release artefact.

## Deployment

Create the D1 database in Oceania:

    npx wrangler@latest d1 create bacselect-download-counter --location oc

Copy `wrangler.toml.example` to `wrangler.toml` and insert the returned
database ID.

Apply the schema remotely:

    npx wrangler@latest d1 execute bacselect-download-counter --remote --file=schema.sql

Deploy:

    npx wrangler@latest deploy

Then put the deployed HTTPS endpoint into `data/site.json` under
`download_metrics.endpoint` and set `download_metrics.enabled` to `true`.
