## `sync`

<img style="padding: 1em; width: 70%; border: solid 1px grey; border-radius: 1em;" src="./sync_example.png" />

The `sync` executor is similar to the `aws s3 sync` command. It will run a diff between local files and files contained in S3, and make S3 reflect the local directory. This can be very performant because only files which have changed will be uploaded. Bucket name can also be dynamically looked up from existing CloudFormation exports or SSM Parameters.

### Uploaded Bucket Object `content-type`

This plugin uses [mime-types](https://www.npmjs.com/package/mime-types) to make a best guess at file mime types as they are uploaded to S3. This means your files should arrive in S3, ready to be served as a static assets without having to manually define the types.

### AWS Credentials

The standard AWS credential chain of precedence is followed when making AWS calls. [@aws-sdk/credential-provider-node]() is used to to load these values, so that documentation should be used when setting up AWS credentials. In most cases, simply having the proper environment variables or valid credentials in your `~/.aws/credentials` file should be enough to get going. There is an optional `profile` argument that can be used if you wish to use a non-default set of credentials.

### Properties

| Name        | Description                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sourceFiles | The path to the local files that you wish to upload. In the case of a static site, these should already be compiled (ie webpack).                       |
| bucketName  | The name of the S3 bucket where the files should be uploaded. _See notes on setting this value to retrieve a CF exported value or SSM Parameter value._ |
| region      | (Optional) The AWS region where requests will be sent. Will default to the local system default.                                                        |
| profile     | (Optional) The AWS credentials profile that will be used to make requests. Default system AWS credentials will be used if omitted.                      |
| batchSize   | (Optional) The number of files that will be present in each batch. Batched files are uploaded in parallel. Default is 500.                              |
| progress    | (Optional) Display upload progress. True by default.                                                                                                    |
| deleteFiles | (Optional) Should files be deleted in S3 if they are no longer present in the local directory. True by default.                                         |

### Usage

_You do not need to add `s3://` to bucketName, your CloudFormation export value, or your SSM parameter value. This plugin will add it for you._

Add the executor to the `target` section of `project.json`.

```js
  "targets": {
    "upload-site": {
      "executor": "nx-s3-plugin:sync",
      "options": {
        "sourceFiles": "<source-directory>",
        "bucketName": "[cfe|ssm]:<target-bucket>",
      }
    }
  }
```

### Static S3 Bucket Name

If you are directly targetting an S3 bucket, you can simply enter the name of the S3 bucket as the `bucketName` parameter in the NX task definition.

```js
  "targets": {
    "upload-site": {
      "executor": "nx-s3-plugin:sync",
      "options": {
        "sourceFiles": "/my-compiled-website-files",
        "bucketName": "my-s3-bucket",
      }
    }
  }
```

### Dynamic Cloudformation Export Lookup

If you prepend your `bucketName` with `cfe:`, this executor will attempt to locate a CloudFormation export with the same name. Omitting the `cfe:` prefix will simply use the `bucketName` value as is for the S3 url.

- If an export is found with a matching name, the value will be used for the S3 destination bucket.
- If an export is not found, an error will be thrown and no files will be uploaded.
- **Matching is case-sensitive.**
- This export must exist in the same account as the S3 bucket.
  - Cross-account lookup is not supported.

> Example:
>
> `cfe:StaticWebSite` will query CloudFormation for an export named `StaticWebSite` and use the value of that export as the `bucketName`.

```js
  "targets": {
    "upload-site": {
      "executor": "nx-s3-plugin:sync",
      "options": {
        "sourceFiles": "/my-compiled-website-files",
        "bucketName": "cfe:StaticWebSite",
      }
    }
  }
```

### Dynamic SSM Paramter Store Lookup

If you prepend your `bucketName` with `ssm:`, this executor will attempt to locate a SSM Paramter with the same name. Omitting the `ssm:` prefix will simply use the `bucketName` value as is for the S3 url.

- If an SSM Parameter is found with a matching name, the value will be used for the S3 destination bucket.
- If an SSM Parameter is not found, an error will be thrown and no files will be uploaded.
- **Matching is case-sensitive.**
- This SSM Parameter must exist in the same account as the S3 bucket.
  - Cross-account lookup is not supported.

> Example:
>
> `ssm:/myapp/s3bucket` will query for an SSM Parameter named `/myapp/s3bucket` and use the value of that export as the `bucketName`.

```js
  "targets": {
    "upload-site": {
      "executor": "nx-s3-plugin:sync",
      "options": {
        "sourceFiles": "/my-compiled-website-files",
        "bucketName": "ssm:/myapp/s3bucket",
      }
    }
  }
```
