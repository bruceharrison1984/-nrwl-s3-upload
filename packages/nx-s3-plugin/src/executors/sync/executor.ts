import { BuildExecutorSchema } from './schema';
import { S3Client } from '@aws-sdk/client-s3';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import S3SyncClient from 's3-sync-client';
import { SingleBar, Presets } from 'cli-progress';
import { lookup } from 'mime-types';
import recursive from 'recursive-readdir';

export default async function runExecutor({
  sourceFiles,
  bucketName,
  region,
  profile,
  batchSize = 500,
  progress = true,
  deleteFiles = true,
}: BuildExecutorSchema) {
  const fileList = await recursive(sourceFiles);
  const bucketUrl = `s3://${bucketName}`;

  if (fileList.length === 0)
    throw new Error(
      'File list contains no files. Please specify a different directory.'
    );

  console.log('-= Running S3 Sync Executor =-');
  console.log(`   - Source directory: ${sourceFiles}`);
  console.log(`   - Total files: ${fileList.length}`);
  console.log(`   - Target: ${bucketUrl}`);
  console.log(`   - Batch size: ${batchSize}`);
  console.log(`   - Deletion: ${deleteFiles ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   - AWS profile: ${profile ? profile : 'DEFAULT'}`);
  console.log(`   - AWS region: ${region ? region : 'DEFAULT'}`);
  console.log(' ');

  const s3Client = new S3Client({
    region,
    credentials: profile ? defaultProvider({ profile }) : undefined,
  });
  const { sync } = new S3SyncClient({ client: s3Client });
  const monitor = new S3SyncClient.TransferMonitor();

  const progressBar = new SingleBar(
    { noTTYOutput: true, stream: process.stdout },
    Presets.shades_classic
  );

  if (progress) {
    let progressStarted = false;
    monitor.on('progress', ({ count }) => {
      if (count.current % Math.ceil(count.total / 100) > 0) return;

      if (!progressStarted) {
        progressBar.start(count.total, 0);
        progressStarted = true;
      }
      progressBar.update(count.current);
    });
  }

  let results;
  try {
    results = await sync(sourceFiles, bucketUrl, {
      del: deleteFiles,
      monitor,
      maxConcurrentTransfers: batchSize,
      commandInput: {
        ContentType: (syncCommandInput) => lookup(syncCommandInput.Key) || '',
      },
    });
  } finally {
    progressBar.stop();
  }

  console.log(' ');
  console.log(`-= S3 Sync Results =-`);
  console.log(`   - Uploads: ${results.uploads.length}`);
  console.log(`   - Deletions: ${results.deletions.length}`);

  return {
    success: true,
  };
}
