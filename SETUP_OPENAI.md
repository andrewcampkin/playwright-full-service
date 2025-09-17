# OpenAI API Key Setup

## Quick Setup

1. **Get your OpenAI API key:**
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in to your OpenAI account
   - Click "Create new secret key"
   - Copy the API key

2. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env and replace the placeholder with your actual API key
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **For Docker Compose (recommended):**
   ```bash
   # Set the environment variable in your shell
   export OPENAI_API_KEY=sk-your-actual-api-key-here
   
   # Then start the services
   docker-compose up
   ```

4. **For local development:**
   ```bash
   # Set the environment variable
   export OPENAI_API_KEY=sk-your-actual-api-key-here
   
   # Or on Windows PowerShell:
   $env:OPENAI_API_KEY="sk-your-actual-api-key-here"
   
   # Then run the backend
   cd backend/PlaywrightService
   dotnet run
   ```

## Testing the Setup

1. Start the services:
   ```bash
   docker-compose up
   ```

2. Open your browser to [http://localhost:3000](http://localhost:3000)

3. Enter a URL (try `https://example.com` or `https://httpbin.org`)

4. Click "Generate Tests" and watch the AI explore the website!

## Troubleshooting

- **"OpenAI API key is not configured"**: Make sure you've set the `OPENAI_API_KEY` environment variable
- **"Failed to generate tests"**: Check that your API key is valid and has credits
- **CORS errors**: Make sure both frontend (port 3000) and backend (port 5000) are running

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Your API key is only used server-side and never exposed to the frontend
