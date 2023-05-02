import { AwsCredentialIdentity, Provider } from '@aws-sdk/types';
import { BucketNameResolver } from '../types/BucketNameResolver';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export class SsmParameterResolver implements BucketNameResolver {
  resolverType = 'ssm';

  constructor(
    private credentials?:
      | AwsCredentialIdentity
      | Provider<AwsCredentialIdentity>,
    private region?: string
  ) {}

  async resolve(lookupKey: string): Promise<string> {
    const client = new SSMClient({
      region: this.region,
      credentials: this.credentials,
    });

    const ssmParameter = await client.send(
      new GetParameterCommand({ Name: lookupKey })
    );

    if (!ssmParameter.Parameter)
      throw new Error(`Could not retreive SSM parameter ${lookupKey}`);

    if (
      !ssmParameter.Parameter.Value ||
      ssmParameter.Parameter.Value.trim() === ''
    )
      throw new Error(
        `SSM parameter ${lookupKey} has blank or undefined value`
      );

    return ssmParameter.Parameter.Value.trim();
  }
}
