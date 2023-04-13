import { BuildExecutorSchema } from './schema';
import type { ExecutorContext } from '@nrwl/devkit';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as recursive from 'recursive-readdir';
import { createReadStream } from 'fs';
import * as path from 'path';
import { sync } from 'md5-file';
import { fromIni } from '@aws-sdk/credential-providers';

export default async function runExecutor(
  { sourceFiles, bucketName, region, profile }: BuildExecutorSchema,
  context: ExecutorContext
) {
  console.log('Running S3 Upload Executor');

  const fileList = await recursive(sourceFiles);
  console.log(
    `Found ${fileList.length} files in ${sourceFiles} that will be uploaded to ${bucketName}`
  );

  const s3Client = new S3Client({
    region,
    credentials: profile ? fromIni({ profile }) : undefined,
  });

  const uploads = fileList.map((file) => {
    if (context.isVerbose) console.log(`Creating upload for ${file}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path.relative(sourceFiles, file),
      Body: createReadStream(file),
      ContentMD5: sync(file),
    });
    return s3Client.send(command);
  });

  await Promise.all(uploads);

  console.log(`Uploaded ${fileList.length} to ${bucketName}`);

  return {
    success: true,
  };
}
