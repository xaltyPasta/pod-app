# 📦 Proof of Delivery (POD) App

_A Next.js 15 + TypeScript production-ready application for delivery executives to capture and manage proof of delivery with real-time sync to Supabase and Google Sheets._

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

The POD App streamlines the delivery proof collection process by enabling delivery executives to:

- **Authenticate** securely via Google OAuth
- **Scan or enter** AWB (Air Waybill) numbers using QR/barcode scanner
- **Capture** proof images directly from their device camera
- **Upload** images to Cloudinary with automatic optimization
- **Store** delivery records in Supabase PostgreSQL database
- **Sync** data to Google Sheets for easy access and reporting
- **Search & track** delivery history and proof records

---

## 🏗️ Architecture

### Core Flow

```
User Login (Google OAuth) 
    ↓
AWB Entry/Scan (QR/Barcode) 
    ↓
Camera Capture 
    ↓
Cloudinary Upload (Image Storage) 
    ↓
Supabase Storage (Database) + Google Sheets Sync
    ↓
Success Confirmation
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | Server-side rendering, routing |
| **UI Framework** | React + TypeScript | Type-safe component development |
| **Styling** | Bootstrap 5 | Responsive UI components |
| **Authentication** | NextAuth.js v5 | Google OAuth integration |
| **Database** | Supabase (PostgreSQL) | Primary data storage |
| **ORM** | Prisma | Type-safe database queries |
| **File Storage** | Cloudinary | Image CDN and optimization |
| **External Sync** | Google Sheets API | Real-time data logging |
| **QR Scanner** | jsQR | Barcode/QR code detection |
| **Deployment** | Vercel | Serverless hosting |

---

## 📁 Project Structure

```
└── xaltypasta-pod-app/
    ├── README.md                  # Documentation file (this one)
    ├── eslint.config.mjs          # ESLint configuration for linting
    ├── LICENSE                    # Open-source license (MIT or custom)
    ├── next.config.ts             # Next.js configuration
    ├── package.json               # Project metadata, dependencies, and scripts
    ├── tsconfig.json              # TypeScript configuration
    ├── prisma/
    │   └── schema.prisma          # Prisma schema defining database models and relations
    └── src/
        ├── global.d.ts            # Global TypeScript type declarations
        ├── middleware.ts          # Middleware for authentication checks & route protection
        ├── app/
        │   ├── globals.css        # Global styles applied across the app
        │   ├── layout.tsx         # Root layout wrapper for all pages
        │   ├── page.module.css    # Styles for the home page
        │   ├── page.tsx           # Main landing (Home) page
        │   ├── providers.tsx      # Context providers (NextAuth, Theme, etc.)
        │   ├── api/
        │   │   ├── auth/
        │   │   │   └── [...nextauth]/route.ts  # NextAuth API route (handles login/logout/session)
        │   │   └── deliveries/
        │   │       ├── route.ts                # Handles POST/GET for all deliveries
        │   │       └── [awb]/route.ts          # Handles GET/UPDATE for specific delivery by AWB
        │   ├── capture/
        │   │   └── page.tsx                    # Page for capturing proof images
        │   ├── history/
        │   │   └── page.tsx                    # Page displaying user's delivery history
        │   ├── scan/
        │   │   └── page.tsx                    # Page for scanning QR codes (mobile optimized)
        │   ├── search-pod/
        │   │   └── page.tsx                    # Page for searching proof of delivery by AWB
        │   ├── signin/
        │   │   └── page.tsx                    # Authentication/sign-in page
        │   └── success/
        │       └── page.tsx                    # Success confirmation screen after upload
        ├── components/
        │   ├── CaptureWidget.tsx               # Handles image capture and preview UI
        │   ├── HomeLayout.tsx                  # Layout wrapper for main navigation
        │   ├── Scanner.tsx                     # Custom QR scanner component (mobile-friendly)
        │   └── SignOutButton.tsx               # Reusable button for user logout
        ├── lib/
        │   ├── auth.ts                         # NextAuth configuration and session helpers
        │   ├── cloudinary.ts                   # Cloudinary upload utility and credentials
        │   ├── db.ts                           # Prisma client initialization
        │   ├── sheets.ts                       # Functions for integrating Google Sheets (if enabled)
        │   └── uploadMedia.ts                  # Function for handling file uploads to Cloudinary
        └── types/
            └── index.d.ts                      # Custom TypeScript type definitions


```

---

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String?
  image         String?
  emailVerified DateTime?
  phone         String?
  role          UserRole   @default(DELIVERY_EXECUTIVE)
  deliveries    Delivery[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

### Delivery Model
```prisma
model Delivery {
  id            String   @id @default(cuid())
  awb           String   
  mediaUrl      String   
  mediaType     String   
  publicId      String   
  width         Int?
  height        Int?
  bytes         Int?
  format        String?
  geoLat        Float?
  geoLng        Float?
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  
  @@index([awb])
  @@index([createdById])
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Google Cloud Console account
- Supabase account
- Cloudinary account
- Google Sheets

### 1. Clone Repository

```bash
git clone https://github.com/xaltyPasta/pod-app.git
cd pod-app
npm install
```

### 2. Environment Configuration

Create `.env.local` in the root directory:

```env
# NEXTAUTH CONFIGURATION
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_min_32_chars

# GOOGLE OAUTH CREDENTIALS
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# SUPABASE DATABASE
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres

# CLOUDINARY (UNSIGNED PRESET)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
NEXT_PUBLIC_CLOUDINARY_DEFAULT_FOLDER=pod-proof

# GOOGLE SHEETS API (SERVICE ACCOUNT)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SA_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SA_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Sheets API** and **Google Drive API**
4. Configure OAuth Consent Screen:
   - User Type: External
   - Add scopes: `email`, `profile`, `openid`
5. Create OAuth 2.0 Client ID (Web application):
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://your-domain.vercel.app`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.vercel.app/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### 4. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to **Settings → Database**
3. Copy **Connection String** (Transaction pooling mode) → `DATABASE_URL`
4. Copy **Direct Connection** string → `DIRECT_URL`
5. Run database migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to **Settings → Upload**
3. Create an **Unsigned Upload Preset**:
   - Preset name: `pod_preset` (or your choice)
   - Signing Mode: **Unsigned**
   - Folder: `pod-proof`
   - Transformation: Optional (resize, optimize)
4. Add credentials to `.env.local`

### 6. Google Sheets Setup

1. Create a new Google Sheet named **Pod_data**
2. Add header row (A1:F1):
   ```
   AWB | DateTime(IST) | Name | Phone | URL | Type
   ```
3. Create Service Account:
   - Go to [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Create Service Account
   - Download JSON key file
   - Extract `client_email` → `GOOGLE_SA_EMAIL`
   - Extract `private_key` → `GOOGLE_SA_KEY`
4. Share your Sheet with service account email (Editor access)
5. Copy Spreadsheet ID from URL to `.env.local`

### 7. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📱 User Journey

### 1. Sign In
- User clicks "Sign in with Google"
- OAuth authentication via NextAuth
- Session created and stored in Supabase

### 2. Scan/Enter AWB
- Navigate to `/scan` page
- Option 1: Click "Scan QR/Barcode" → camera opens → automatic detection
- Option 2: Manual entry in text input
- Click "Capture" to proceed

### 3. Capture Proof
- Camera interface opens at `/capture?awb=123456`
- User positions camera and clicks capture button
- Image preview shown with retry option

### 4. Upload & Store
- Image uploaded to Cloudinary (optimized, secure URL)
- Delivery record created in Supabase via Prisma
- Data appended to Google Sheet in real-time
- Success confirmation shown

### 5. View History
- `/history` page shows all user's deliveries
- Filter and search capabilities
- Click any item to view full details

### 6. Search POD
- `/search-pod` allows searching by AWB number
- Returns all matching delivery records
- Accessible by authorized users

---

## 🔒 Security Features

- **Google OAuth**: Industry-standard authentication
- **JWT Sessions**: Secure session management via NextAuth
- **Environment Variables**: Sensitive data never exposed to client
- **Middleware Protection**: Auth-required routes automatically protected
- **Unsigned Upload**: Cloudinary preset restricted to specific folder
- **Service Account**: Google Sheets access via server-side only
- **HTTPS Only**: Production deployment enforces secure connections
- **CORS**: Configured properly for API endpoints

---

## 🧪 API Endpoints

### Authentication
```
POST /api/auth/signin          # Initiate Google OAuth
GET  /api/auth/callback/google # OAuth callback
POST /api/auth/signout         # Sign out user
GET  /api/auth/session         # Get current session
```

### Deliveries
```
GET  /api/deliveries           # List user's deliveries
POST /api/deliveries           # Create new delivery
GET  /api/deliveries/[id]      # Get delivery by ID
GET  /api/deliveries?awb=123   # Search by AWB number
```

### Request/Response Examples

**Create Delivery:**
```json
POST /api/deliveries
{
  "awb": "AWB123456789",
  "mediaUrl": "https://res.cloudinary.com/...",
  "mediaType": "image/jpeg",
  "publicId": "pod-proof/abc123",
  "width": 1920,
  "height": 1080,
  "bytes": 245678,
  "format": "jpg"
}

Response: 201 Created
{
  "id": "clx123abc",
  "awb": "AWB123456789",
  "mediaUrl": "https://...",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

## 🌐 Deployment

### Deploy to Vercel

1. Push code to GitHub repository
2. Visit [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project" → Import from GitHub
4. Select your repository
5. Configure Environment Variables (copy all from `.env.local`)
6. Deploy

### Post-Deployment

1. Update Google OAuth credentials:
   - Add Vercel URL to Authorized JavaScript origins
   - Add `https://your-app.vercel.app/api/auth/callback/google` to Redirect URIs

2. Update NEXTAUTH_URL:
   ```env
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. Test all flows in production

---

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Prisma Commands
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate dev       # Create & apply migration
npx prisma migrate deploy    # Deploy migrations (production)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema changes without migration
```

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Camera access denied | Browser permission blocked | Enable camera in browser settings; ensure HTTPS/localhost |
| Google OAuth 400 error | Redirect URI mismatch | Verify exact match in Google Console |
| Sheets append failed | Service account not shared | Share Sheet with SA email as Editor |
| Prisma timeout | Non-pooled connection | Use Supabase transaction pool URL (`DATABASE_URL`) |
| Cloudinary upload fails | Wrong preset/cloud name | Verify `NEXT_PUBLIC_CLOUDINARY_*` vars |
| NextAuth secret error | Missing/invalid secret | Generate secure 32+ char string |
| QR scanner not working | Poor lighting/focus | Ensure good lighting and hold steady |
| Build errors | Type mismatches | Run `npm run type-check` and fix errors |

---

## 📊 Performance Optimizations

- **Image Optimization**: Cloudinary auto-formats and compresses images
- **Database Indexing**: Indexed queries on `awb` and `createdById`
- **Connection Pooling**: Supabase pooler for scalable connections
- **Static Generation**: Next.js optimizes static pages
- **Edge Functions**: Vercel Edge Network for low latency
- **Lazy Loading**: Components loaded on demand

---

## 🧪 Testing Locally

1. **Sign In**: Use your Google account
2. **Scan Test**: Use QR code generator for test AWB numbers
3. **Camera**: Allow camera permissions
4. **Upload**: Capture and verify in Cloudinary dashboard
5. **Database**: Check Prisma Studio (`npx prisma studio`)
6. **Sheets**: Verify data appears in Google Sheet

---

## 📝 Future Enhancements

- [ ] Offline mode with sync when online
- [ ] Bulk upload capability
- [ ] Advanced analytics dashboard
- [ ] SMS/Email notifications
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Role-based access control (Admin, Manager, Executive)
- [ ] Delivery route optimization
- [ ] Real-time delivery tracking
- [ ] Export reports (PDF, CSV)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Raj Kumar Ravi (xaltyPasta)**

- GitHub: [@xaltyPasta](https://github.com/xaltyPasta)
- Project: [xaltypasta-pod-app](https://github.com/xaltyPasta/pod-app)

---

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Vercel for hosting platform
- Supabase for database solution
- Cloudinary for image management
- Google for OAuth and Sheets API

---


**⭐ Star this repo if you find it helpful!**
