const AWS = require('aws-sdk');

var TableName = process.env.TABLE_NAME
var region = process.env.AWS_REGION
AWS.config.update({region: region})

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

  const Item = {};
  Item['name'] = event.queryStringParameters.name;
  Item['location'] = event.queryStringParameters.location;
  Item['age'] = event.queryStringParameters.age;
  
  try {
    const res = await dynamo.put({TableName, Item}).promise();
    return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Credentials': 'true'
        },
        isBase64Encoded: false,
        body: 'Successfully uploaded '+ Item['name']
    }
  } catch (error){
    console.log("error update user", error)
    throw error
  }
};