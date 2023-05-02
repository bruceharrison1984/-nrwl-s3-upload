import { AwsCredentialIdentity, Provider } from '@aws-sdk/types';
import { Presets, SingleBar } from 'cli-progress';
import { S3Client } from '@aws-sdk/client-s3';
import { lookup } from 'mime-types';
import S3SyncClient from 's3-sync-client';

export class SyncService {
  constructor(
    private credentials?:
      | AwsCredentialIdentity
      | Provider<AwsCredentialIdentity>,
    private region?: string
  ) {}

  async sync(
    sourcePath: string,
    bucketUri: string,
    showProgress: boolean,
    batchSize: number,
    deleteFiles: boolean
  ) {
    const s3Client = new S3Client({
      region: this.region,
      credentials: this.credentials,
    });
    const { sync } = new S3SyncClient({ client: s3Client });
    const monitor = new S3SyncClient.TransferMonitor();

    const progressBar = new SingleBar(
      { noTTYOutput: true, stream: process.stdout },
      Presets.shades_classic
    );

    if (showProgress) {
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
      results = await sync(sourcePath, bucketUri, {
        del: deleteFiles,
        monitor,
        maxConcurrentTransfers: batchSize,
        commandInput: {
          ContentType: (syncCommandInput) => lookup(syncCommandInput.Key) || '',
        },
      });

      return results;
    } finally {
      progressBar.stop();
      s3Client.destroy();
    }
  }
}
