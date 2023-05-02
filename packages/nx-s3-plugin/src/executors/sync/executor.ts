import { BucketNameService } from './services/BucketNameService';
import { BuildExecutorSchema } from './schema';
import { CredentialsService } from './services/CredentialsService';
import { Executor } from '@nrwl/devkit';
import { Presets, SingleBar } from 'cli-progress';
import { S3Client } from '@aws-sdk/client-s3';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { lookup } from 'mime-types';
import S3SyncClient from 's3-sync-client';
import recursive from 'recursive-readdir';

const runExecutor: Executor<BuildExecutorSchema> = async ({
  sourceFiles,
  bucketName,
  region,
  profile,
  batchSize = 500,
  progress = true,
  deleteFiles = true,
}) => {
  console.log('-= Running S3 Sync Executor =-');
  if (!bucketName || bucketName.trim() === '')
    throw new Error('bucketName is a required argument');

  const fileList = await recursive(sourceFiles);

  if (fileList.length === 0)
    throw new Error(
      'File list contains no files. Please specify a different directory. '
    );

  const credentials = new CredentialsService(profile);
  const bucketNameService = new BucketNameService(credentials, region);
  const resolvedBucket = await bucketNameService.resolveBucketName(bucketName);

  let headerText = `- Bucket Name: ${bucketName}`;
  if (resolvedBucket.requiresLookup)
    headerText = `- Lookup Key: ${resolvedBucket.lookupKey}
    - Lookup Type: ${resolvedBucket.lookupType}`;

  console.log(`
  ${headerText}
  - Destination S3 Url: ${resolvedBucket.bucketName}
  - Source directory: ${sourceFiles}
    - Total files: ${fileList.length}
  - Batch size: ${batchSize}
  - Deletion: ${deleteFiles ? 'ENABLED' : 'DISABLED'}
  - AWS profile: ${profile ? profile : 'DEFAULT'}
  - AWS region: ${region ? region : 'DEFAULT'}
  `);

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
    results = await sync(sourceFiles, resolvedBucket.bucketName, {
      del: deleteFiles,
      monitor,
      maxConcurrentTransfers: batchSize,
      commandInput: {
        ContentType: (syncCommandInput) => lookup(syncCommandInput.Key) || '',
      },
    });
  } finally {
    progressBar.stop();
    s3Client.destroy();
  }

  console.log(' ');
  console.log(`
-= S3 Sync Results =-
  - Uploads: ${results.uploads.length}
  - Deletions: ${results.deletions.length}
  `);

  return {
    success: true,
  };
};

export default runExecutor;
