# Endless Moment Admin Mobile

Private, installable admin dashboard for the Endless Moment studio. All application source is JavaScript/JSX; TypeScript and TSX source files have been removed. Features include client/enquiry management, portfolio projects, invoice generation for converted clients, security logs, admin profile settings, and PWA installation. Booking is intentionally excluded for future development.

## Render API
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health endpoint: `/api/health`
- Environment: `NODE_ENV=production`, `DEPLOY_FRONTEND=false`, `FRONTEND_URL=https://YOUR-NETLIFY-SITE.netlify.app`, `MONGODB_URI`, `JWT_SECRET` (at least 32 random characters), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

## Netlify frontend
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
- Redeploy after setting the variable.

## Initial admin provisioning
There is no public registration/signup screen or public initial-admin endpoint. Provision the first admin from a trusted terminal after setting `MONGODB_URI`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (12+ characters), `BOOTSTRAP_ADMIN_NAME`; run `npm run bootstrap-admin`. It refuses to run if any admin already exists. Never commit credentials or `.env` files.

Once an admin exists, additional accounts can be created only through authenticated admin-management API endpoints: `GET /api/admins`, `POST /api/admins`, and `DELETE /api/admins/:id`. Creating an account requires a valid email, name, and password of at least 12 characters. An admin cannot delete their own account or the last remaining admin.

All client, project, and invoice records require MongoDB; there is no local database fallback. Invoices are restricted to converted clients. Google OAuth and biometric authentication are not configured; use email and password. Two-factor authentication is not required.

## Project photo storage
Project photos are compressed in the admin app and uploaded to Cloudinary through the authenticated Render API. MongoDB stores only the returned Cloudinary secure image URLs in the project's `images` array. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Render Environment settings; never expose the API secret in Netlify variables or frontend code.
