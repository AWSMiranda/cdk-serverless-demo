import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";

export class CdkDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const tableName = 'peopleTable'
    const table = new dynamodb.Table(this, 'people', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING},
      tableName: tableName,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY //remove table if we delete the stack, don't do in PROD!
    });
    
    const createLambda = new lambda.Function(this, 'CreateHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'createUser.handler',
      environment: {'TABLE_NAME': tableName},
    });
    
    const api = new apigw.RestApi(this, "apiGateway");
    const apiCreateInteg = new apigw.LambdaIntegration(createLambda);
    
    // add api gw path
    const apiCreate = api.root.addResource('create');
    apiCreate.addMethod('POST', apiCreateInteg);
    table.grantReadWriteData(createLambda);
  }
}
