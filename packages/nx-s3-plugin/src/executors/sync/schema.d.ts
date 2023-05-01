export interface BuildExecutorSchema {
  sourceFiles: string;
  bucketName?: string;
  region?: string;
  profile?: string;
  batchSize?: number;
  progress?: boolean;
  deleteFiles?: boolean;
} // eslint-disable-line
