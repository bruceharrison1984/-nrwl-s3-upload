import {
  CloudFormationClient,
  Export,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const getCloudFormationExportValue = async (
  exportName: string,
  region?: string,
  profile?: string
) => {
  const cfClient = new CloudFormationClient({
    region,
    credentials: profile ? defaultProvider({ profile }) : undefined,
  });

  const exports: Export[] = [];
  let results = await cfClient.send(new ListExportsCommand({}));
  exports.push(...results.Exports);

  while (results.NextToken) {
    results = await cfClient.send(
      new ListExportsCommand({ NextToken: results.NextToken })
    );
    exports.push(...results.Exports);
  }

  const cfExport = exports.find(
    (x) => x.Name.toLowerCase() === exportName.toLocaleLowerCase()
  );
  if (!cfExport)
    throw new Error(
      `A CloudFormation export named ${exportName} could not be found`
    );

  return cfExport.Value;
};
