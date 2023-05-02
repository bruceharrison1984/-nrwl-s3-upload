export interface BucketNameResolver {
  resolverType: string;
  resolve(lookupKey: string): Promise<string>;
}
