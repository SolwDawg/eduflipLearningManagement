# Troubleshooting

### 500 Internal Server Error

If you're experiencing 500 errors when calling the API:

1. Check the CloudWatch logs for your Lambda function to see the detailed error
2. Verify that all environment variables are set correctly in Lambda
3. Make sure the AWS IAM role for your Lambda has the necessary permissions
4. For CORS-related issues, add your frontend domain to the `ALLOWED_ORIGINS` environment variable

### Grades API 500 Error

If you're specifically seeing a 500 error when accessing the grades endpoint:

1. Ensure the DynamoDB 'Grade' table exists and is properly configured

   - Check your AWS DynamoDB console to verify the table exists
   - Run the `npm run seed:grades` command to populate the table

2. Check CloudWatch logs for detailed error information

   - Look for specific DynamoDB errors like "ResourceNotFoundException"

3. Verify AWS IAM permissions

   - Your Lambda execution role needs full DynamoDB permissions
   - Add the `AmazonDynamoDBFullAccess` policy to your Lambda execution role

4. Try manually creating the table

   ```
   aws dynamodb create-table \
     --table-name Grade \
     --attribute-definitions AttributeName=gradeId,AttributeType=S \
     --key-schema AttributeName=gradeId,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
     --region ap-southeast-1
   ```

5. Run the seeding operation
   - Trigger the Lambda with the 'seed' action
   - `https://your-api-gateway-url/prod?action=seed`

### CORS Errors
