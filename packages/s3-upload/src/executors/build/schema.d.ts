export interface BuildExecutorSchema {
  sourceFiles: string;
  bucketName: string;
  region?: string;
  profile?: string;
  chunkSize?: number;
} // eslint-disable-line
