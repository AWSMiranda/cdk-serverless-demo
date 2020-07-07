# cdk-serverless-demo

A project with instructions how to run a CDK serverless demo project, written in TypeScript.
You will not find any code files here, only the README with detailed instructions how to create a demo project step by step.
Shout-out to [Darko Mesaros](https://github.com/darko-mesaros) for providing a sample example project that has been used for this demo tutorial. You can find all the code in a slightly different setup in [here](https://github.com/darko-mesaros/aws-cdk-for-serverless).

## Requirements

Before running the demo make sure to install CDK as mentioned here: [How to install CDK](https://github.com/aws/aws-cdk/blob/master/README.md).
You will deploy the demo project to your AWS Account, make sure you have set the current profile with.
Partice practice practice, try to have multiple try runs to safely navigate through code and explain the details.

## Start

Creata a new project from scratch:

```sh
mkdir cdk-demo
cd cdk-demo
cdk init app -l typescript
```

This will create a directory structure like this:

```
.
├── README.md
├── bin
├── cdk.json
├── jest.config.js
├── lib
├── node_modules
├── package-lock.json
├── package.json
├── test
└── tsconfig.json
```

Load the project into an IDE of your choice, JetBrains WebStorm, VS Code, Vim, Emasc, etc.
Open `lib/cdk-demo-stack.ts` file, it should look like this:

```
import * as cdk from '@aws-cdk/core';

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
  }
}
```

Build the project:

```
npm run build
```

Add the dependencies of the AWS constructs we will be using during the demo:

```
npm install @aws-cdk/aws-lambda @aws-cdk/aws-dynamodb @aws-cdk/aws-apigateway
```

Import this packages into `lib/cdk-demo-stack.ts` file at the top:

```
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
```

Now let us create a table, add this statement into the constructor under `super()` call:

```
const table = new dynamodb.Table(this, 'people', {
  partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING},
  tableName: "peopleTable",
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
});
```

While typing the properties of the table, show that some of them are required and some are optional.
If you use autocomplete features of the IDE, you can also highlight all the possible values that developers can see right in the IDE, without going to the browser and search in the documentation.
Build the project again with `npm run build` and compile to CloudFormation with `cdk synth`.
This will show the audience the output of the project.
Now we are ready to deploy

```
cdk deploy
```

Open the console to show the table with the same values has been created in the AWS Account. Show the table name, the partitionKey and the billing settings `PAY_PER_REQUEST`.

We will create a Lambda function. Create a folder `lambda` in the project root directory and add a javascript file `createUser.js`:

```
mkdir lambda
cd lambda
touch createUser.js
```

Open `lambda/createUser.js` file and add the handler. You can also prepare this part before the demo, there is no value to go through the code, we want to focus on CDK.

```
const AWS = require('aws-sdk');

var TableName = process.env.TABLE_NAME
var region = process.env.AWS_REGION
AWS.config.update({region: region})

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    const Item = {};
    Item['name'] = event.queryStringParameters.name;
    Item['location'] = event.queryStringParameters.location;
    Item['age'] = event.queryStringParameters.age;

    dynamo.put({TableName, Item}, function (err, data) {
        if (err) {
            console.log('error', err);
            callback(err, null);
        } else {
            var response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Access-Control-Allow-Credentials': 'true'
                },
                isBase64Encoded: false
            };
            console.log('success: returned ${data.Item}');
            callback(null, response);
        }
    });
};
```

Go back to `lib/cdk-demo-stack.ts` and add the lambda function to your stack:

```
const createLambda = new lambda.Function(this, 'CreateHandler', {
  runtime: lambda.Runtime.NODEJS_10_X,
  code: lambda.Code.fromAsset('lambda'),
  environment: { 'TABLE_NAME': 'peopleTable' },
  handler: 'createUser.handler'
});
```

Explain that this three parameters are mandatory. The `fromAsset` helper will buindle the function and create a ZIP file, upload it to S3 and use it as input during creation time of the lambda funciton.

Run `npm build` and `cdk deploy`. CDK will show you new resources that will be created during the deployment, proceed with `y`. Open the console again and show the lambda function.

We still need an API gateway to read or write the data:

```
const api = new apigw.RestApi(this, "apiGateway);
const apiCreateInteg = new apigw.LambdaIntegration(createLambda);
const apiCreate = api.root.addResource('create');
apiCreate.addMethod('POST', apiCreateInteg);
table.grantReadWriteData(createLambda);
```

This will create an API gateway with POST method, add a Lambda integration. The last line grants the lambda function a permission to write to the dynamoDB table that we have created previously.

Build and deploy the app again: "npm run build && cdk deploy". After the deployment CDk will output the endpoint of the API gateway. We can now write data to the dynamoDB table with a cURL POST request:

```
curl -X POST https://YOUR_GENERATED_API_GATEWAY_URL/prod/create?name=Jane&age=42
```

Open DynamoDB and show that the `name` and `age` is stored in the dynamoDB table. You can run `cdk synth` to show the final result of the generated CloudFormation template, to emphasize on quick prototyping with CDK without spending too much time with YAML or JSON files.
