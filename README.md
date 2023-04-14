# nx-s3-plugin

This is an NX executor that can be used to make changes to remote S3 buckets.

## Installation

Install the plugin in to your already configured NX workspace

```sh
npm i nx-s3-plugin
```

## Executors

| Name | Description                                          |
| ---- | ---------------------------------------------------- |
| sync | Syncronize a local directory with a remote S3 bucket |

### `sync`

The `sync` executor is similar to the `aws s3 sync` command. It will run a diff between local files and files contained in S3, and make S3 reflect the local directory. This can be very performant because only files which have changed will be uploaded.

#### Usage

Add the executor to the `target` section of `project.json`.

```js
  "targets": {
    "upload-site": {
      "executor": "nx-s3-plugin:sync",
      "options": {
        "sourceFiles": "<source-directory>",
        "bucketName": "<target-bucket>",
      }
    }
  }
```

| Name        | Description                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| sourceFiles | The path to the local files that you wish to upload. In the case of a static site, these should already be compiled (ie webpack).  |
| bucketName  | The name of the S3 bucket where the files should be uploaded.                                                                      |
| region      | (Optional) The AWS region where requests will be sent. Will default to the local system default.                                   |
| profile     | (Optional) The AWS credentials profile that will be used to make requests. Default system AWS credentials will be used if omitted. |
| chunkSize   | (Optional) The number of files that will be present in each chunk. Files in chunks are uploaded in parallel. Default is 500.       |
| progress    | (Optional) Display upload progress. True by default.                                                                               |

## Building

Run `npm run build` to build the library.
