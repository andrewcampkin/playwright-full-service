# Playwright as a service
This is a SAAS wrapper around the `playwright` MCP server.
There are the following functionality
- Automated site exploration by AI
- `Playwright` test generation by AI
- `Playwright` test running
- Automated analysis of test results by AI
- Automated improvement of tests by AI

## Front end
The front end is vite react. It is deployed to a static site running from an aws s3 bucket. We are using yarn, run `yarn` then `yarn dev` to get started.

## Back end
The back end is a service with a postgresql database.
The service is built with dotnet and deployed using Fargate.
We will use dotnet entity framework to manage the database migrations and schema.
The backend will support the following
- OIDC auth
- Site exploration
- Identify site map
- User prompted site mapping
- Prompting the user to save secrets 

## Deployment
This system is deployed to `aws`. All of the `aws` resources are created with terraform which is in the deployment folder.
All of the pipelines are running with github actions.
Front end will be deployed to an s3 bucket. We will have cloudfront and route 53.
Backend will be deployed with Fargate. We will build from a docker file and deploy the container.
The database will be provisioned by terraform.

## Development
You will need to create the docker containers with the database and whatever else we made up to run the full stack.
We need separate docker files for local setup where a postgresql container will be created and production deployment where we are building a dotnet image.
