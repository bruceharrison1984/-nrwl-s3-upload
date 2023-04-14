import { BuildExecutorSchema } from './schema';
import type { ExecutorContext } from '@nrwl/devkit';
import { S3Client } from '@aws-sdk/client-s3';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import S3SyncClient from 's3-sync-client';
import { SingleBar, Presets } from 'cli-progress';

export default async function runExecutor(
  { sourceFiles, bucketName, region, profile }: BuildExecutorSchema,
  context: ExecutorContext
) {
  console.log('Running S3 Upload Executor');

  const s3Client = new S3Client({
    region,
    credentials: profile ? fromNodeProviderChain({ profile }) : undefined,
  });
  const { sync } = new S3SyncClient({ client: s3Client });

  const progressBar = new SingleBar(
    { noTTYOutput: true, stream: process.stdout },
    Presets.shades_classic
  );

  const monitor = new S3SyncClient.TransferMonitor();

  let progressStarted = false;
  const timeout = setInterval(() => {
    const { count } = monitor.getStatus();

    if (!progressStarted) {
      progressBar.start(count.total, 0);
      progressStarted = true;
    }

    progressBar.update(count.current);
  }, 2000);

  try {
    await sync(sourceFiles, `s3://${bucketName}`, { del: true, monitor });
  } finally {
    clearInterval(timeout);
    progressBar.stop();
  }

  console.log(`S3 Upload complete!`);

  return {
    success: true,
  };
}
