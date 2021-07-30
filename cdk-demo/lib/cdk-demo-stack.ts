import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'people', {
      partitionKey: {name: 'name', type: dynamodb.AttributeType.STRING},
      tableName: "peopleTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const createLambda = new lambda.Function(this, 'CreateHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('lambda'),
      environment: {'TABLE_NAME': 'peopleTable'},
      handler: 'createUser.handler'
    });

    const api = new apigw.RestApi(this, "apiGateway");
    const apiCreateInteg = new apigw.LambdaIntegration(createLambda);
    const apiCreate = api.root.addResource('create');
    apiCreate.addMethod('POST', apiCreateInteg);
    table.grantReadWriteData(createLambda);
  }
}
