import { BuildExecutorSchema } from './schema';
import type { ExecutorContext } from '@nrwl/devkit';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as recursive from 'recursive-readdir';
import { createReadStream } from 'graceful-fs';
import * as path from 'path';
import { sync } from 'md5-file';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

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
    credentials: profile ? fromNodeProviderChain({ profile }) : undefined,
  });

  const fileChunks = chunkArray(fileList, 100);

  console.log(
    `Created ${fileChunks.length} chunks of files, with ${100} files per chunk.`
  );

  for (let index = 0; index < fileChunks.length; index++) {
    const files = fileChunks[index];

    const uploads = files.map((file) => {
      if (context.isVerbose) console.log(`Creating upload for ${file}`);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: path.relative(sourceFiles, file),
        Body: createReadStream(file),
        ContentMD5: Buffer.from(sync(file), 'hex').toString('base64'),
      });
      return s3Client.send(command);
    });

    await Promise.all(uploads);

    console.log(`Uploaded chunk ${index + 1} / ${fileChunks.length}`);
  }

  console.log(`S3 Upload complete!`);

  return {
    success: true,
  };
}

function chunkArray(arr: string[], chunkSize) {
  const res: string[][] = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, chunkSize);
    res.push(chunk);
  }
  return res;
}
