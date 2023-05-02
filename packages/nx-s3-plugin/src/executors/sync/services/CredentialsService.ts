import { AwsCredentialIdentity, Provider } from '@aws-sdk/types';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export class CredentialsService {
  credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>;

  constructor(profile?: string) {
    this.credentials = profile ? defaultProvider({ profile }) : undefined;
  }
}
