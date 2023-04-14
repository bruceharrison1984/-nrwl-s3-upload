# nx-s3-plugin

This is an NX executor that can be used to sync local files into an S3 buckets. The primary use-case is for uploading static site files, but could be used for any number of tasks that require putting files in S3.

## Installation

```sh
npm i nx-s3-plugin
```

## Executors

## Usage

Add the executor to the `project.json` of the project you wish to allow access to uploading items to S3.

```js
...
    "upload": {
      "executor": "nx-s3-plugin:upload",
      "options": {
        "sourceFiles": "<source-directory>",
        "bucketName": "<target-bucket>",
      }
    }
...
```

## Building

Run `npm run build` to build the library.
