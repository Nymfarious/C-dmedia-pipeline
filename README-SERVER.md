# Server Setup Instructions

## Critical: Start the Express Server

The main issue causing 500 errors is that the Express server isn't running. Here's how to fix it:

### Quick Fix (Manual Start)

1. **Option A: Use the custom starter:**
   ```bash
   node start-server.js
   ```

2. **Option B: Direct tsx command:**
   ```bash
   npx tsx server/index.ts
   ```

3. **Option C: Add to package.json manually (if editable):**
   ```json
   {
     "scripts": {
       "server:dev": "tsx server/index.ts",
       "dev:all": "npm-run-all --parallel dev server:dev"
     }
   }
   ```

### Verification

1. Server should start on port 3001
2. Visit `http://localhost:3001/health` - should return JSON
3. Debug panel in app should now work
4. API calls should return JSON instead of HTML

### What was broken:

- **API 500 errors**: Server not running, Vite proxy failing
- **HTML instead of JSON**: Server returning default page instead of API responses  
- **Label accessibility**: Missing `id` on password input (now fixed)
- **Asset migration spam**: Too aggressive retry logic (now fixed with longer cooldowns)

The proxy is configured correctly in `vite.config.ts`, the server routes exist, but the Express server just needs to be started manually.