import { BucketNameResolver } from '../types/BucketNameResolver';
import { BucketNameResult } from '../types/BucketNameResult';
import { CloudFormationResolver } from '../resolvers/CloudFormationResolver';
import { CredentialsService } from './CredentialsService';
import { SsmParameterResolver } from '../resolvers/SsmParameterResolver';

export class BucketNameService {
  private _resolvers: BucketNameResolver[] = [];

  constructor(credentialService: CredentialsService, region: string) {
    this._resolvers.push(
      new CloudFormationResolver(credentialService.credentials, region),
      new SsmParameterResolver(credentialService.credentials, region)
    );
  }

  async resolveBucketName(bucketName: string) {
    const matches = bucketName.match(/^(.{3}):(.*)$/);
    const result: BucketNameResult = {
      bucketName: `s3://${bucketName}`,
      requiresLookup: false,
    };

    if (!matches) return result;

    result.requiresLookup = true;
    result.lookupType = matches[1].toLocaleLowerCase();
    result.lookupKey = matches[2];

    const resolver = this._resolvers.find(
      (x) => x.resolverType === result.lookupType
    );

    if (!resolver)
      throw new Error(
        `Resolver of type '${
          result.lookupType
        }' could not be found. Only the following resolvers are currently supported ${this._resolvers
          .map((x) => x.resolverType)
          .join(',')}`
      );

    const resolvedBucket = await resolver.resolve(result.lookupKey);

    result.bucketName = `s3://${resolvedBucket}`;

    return result;
  }
}
