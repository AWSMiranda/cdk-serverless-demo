import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class CdkDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const table = new dynamodb.Table(this, 'people', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING},
      tableName: "peopleTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY //remove table if we delete the stack, don't do in PROD!
    });
    
    const createLambda = new lambda.Function(this, 'CreateHandler', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'createUser.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: { 'TABLE_NAME': 'peopleTable' }
    });
    
    const api = new apigw.RestApi(this, "apiGateway");
    const apiCreateInteg = new apigw.LambdaIntegration(createLambda);
    const apiCreate = api.root.addResource('create');
    apiCreate.addMethod('POST', apiCreateInteg);
    
    table.grantReadWriteData(createLambda);
  }
}
