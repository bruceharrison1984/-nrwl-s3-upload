import { BucketNameService } from './services/BucketNameService';
import { BuildExecutorSchema } from './schema';
import { CredentialsService } from './services/CredentialsService';
import { Executor } from '@nrwl/devkit';
import { SyncService } from './services/SyncService';
import { Table } from 'console-table-printer';
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
  const syncService = new SyncService(credentials.credentials, region);

  const detailsTable = new Table({
    title: 'S3 Sync Settings',
  });

  detailsTable.addRows(
    [
      { property: 'Destination S3 Url', value: resolvedBucket.bucketName },
      { property: 'Source directory', value: sourceFiles },
      { property: 'Total files', value: fileList.length },
    ],
    { color: 'green' }
  );
  if (resolvedBucket.requiresLookup)
    detailsTable.addRows(
      [
        { property: 'Lookup Key', value: resolvedBucket.lookupKey },
        { property: 'Lookup Type', value: resolvedBucket.lookupType },
      ],
      { color: 'yellow' }
    );
  detailsTable.addRows(
    [
      { property: 'Batch size', value: batchSize },
      { property: 'Deletion', value: deleteFiles ? 'enabled' : 'disabled' },
      { property: 'AWS profile', value: profile ? profile : 'default' },
      { property: 'AWS region', value: region ? region : 'default' },
    ],
    { color: 'blue' }
  );
  detailsTable.printTable();

  const results = await syncService.sync(
    sourceFiles,
    resolvedBucket.bucketName,
    progress,
    batchSize,
    deleteFiles
  );

  console.log(' ');

  const resultsTable = new Table({
    title: 'S3 Sync Results',
  });
  resultsTable.addRows(
    [{ property: 'Uploads', value: results.uploads.length }],
    { color: 'green' }
  );
  resultsTable.addRows(
    [{ property: 'Deletions', value: results.deletions.length }],
    { color: 'red' }
  );
  resultsTable.printTable();

  return {
    success: true,
  };
};

export default runExecutor;
