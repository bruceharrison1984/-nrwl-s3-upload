import { AwsCredentialIdentity, Provider } from '@aws-sdk/types';
import { BucketNameResolver } from '../types/BucketNameResolver';
import {
  CloudFormationClient,
  Export,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';

export class CloudFormationResolver implements BucketNameResolver {
  resolverType = 'cfe';

  constructor(
    private credentials?:
      | AwsCredentialIdentity
      | Provider<AwsCredentialIdentity>,
    private region?: string
  ) {}

  async resolve(lookupKey: string): Promise<string> {
    const cfClient = new CloudFormationClient({
      region: this.region,
      credentials: this.credentials,
    });

    let results = await cfClient.send(new ListExportsCommand({}));

    let matchedExport: Export | undefined;
    while (results.NextToken) {
      results = await cfClient.send(
        new ListExportsCommand({ NextToken: results.NextToken })
      );
      matchedExport = results.Exports.find((x) => x.Name === lookupKey);
      if (matchedExport) {
        break;
      }
    }

    if (!matchedExport)
      throw new Error(
        `A CloudFormation export named ${lookupKey} could not be found`
      );

    return matchedExport.Value.trim();
  }
}
