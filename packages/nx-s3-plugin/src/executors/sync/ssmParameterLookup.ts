import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const getSsmParameterStoreValue = async (
  parameterName: string,
  region?: string,
  profile?: string
) => {
  const client = new SSMClient({
    region,
    credentials: profile ? defaultProvider({ profile }) : undefined,
  });

  const ssmParameter = await client.send(
    new GetParameterCommand({ Name: parameterName })
  );

  if (!ssmParameter.Parameter)
    throw new Error(`Could not retreive SSM parameter ${parameterName}`);

  if (
    !ssmParameter.Parameter.Value ||
    ssmParameter.Parameter.Value.trim() === ''
  )
    throw new Error(
      `SSM parameter ${parameterName} has blank or undefined value`
    );

  return ssmParameter.Parameter.Value.trim();
};
