# Deploying to VPS

When changes are pushed to GitHub, you need to pull them onto the production server and safely restart the application so it seamlessly picks up the new source code running securely under PM2.

### Deployment Steps:

1. **Log in to the Server**
   Access your VPS terminal via SSH or terminal interface.

2. **Navigate to the Project**
   ```bash
   cd /var/www/reserve-desk
   ```

3. **Pull Latest Changes**
   Download the latest updates from your codebase:
   ```bash
   git pull origin main
   ```

4. **Install Updates (Optional but Recommended)**
   If any new libraries or packages were added to the `package.json`, install them:
   ```bash
   npm install
   ```

5. **Build the Application**
   Compile the Next.js React templates and cache the Turbopack routes:
   ```bash
   npm run build
   ```

6. **Restart the PM2 Service**
   Gently restart the active daemon to load the compiled build (assuming your PM2 process is named `reserve-desk`):
   ```bash
   pm2 restart reserve-desk
   ```
