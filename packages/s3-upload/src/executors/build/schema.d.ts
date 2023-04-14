export interface BuildExecutorSchema {
  sourceFiles: string;
  bucketName: string;
  region?: string;
  profile?: string;
  chunkSize?: number;
  progress?: boolean;
} // eslint-disable-line
