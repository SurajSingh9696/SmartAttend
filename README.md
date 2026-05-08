# SmartAttend

SmartAttend is a comprehensive, multi-role Smart Attendance System built with Next.js and MongoDB. It provides a scalable and secure platform for educational institutions to manage attendance, student records, and class schedules efficiently.

## 🌟 Features

* **Role-Based Access Control:** Dedicated portals for Students, Teachers, Admins, and Superadmins.
* **Real-time Attendance Tracking:** Live monitoring and polling-based attendance using WebSocket (Socket.io).
* **Smart Verification:** Secure attendance marking using QR Codes and Device Fingerprinting to prevent proxy attendance.
* **Bulk Data Management:** Easy CSV import functionality for registering students and schedules in bulk.
* **Interactive Dashboards:** Analytics and visualizations using Recharts for attendance trends and insights.
* **Automated Tasks:** Scheduled tasks and chron jobs for system maintenance and attendance finalization.
* **Modern Tech Stack:** Built with the latest Next.js 16, React 19, and NextAuth for robust performance and security.

## 🚀 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Frontend:** React 19, Zustand (State Management), Lucide React (Icons)
* **Backend:** Node.js, Next.js API Routes
* **Database:** MongoDB & Mongoose
* **Authentication:** NextAuth.js, bcryptjs, JSON Web Tokens (JWT)
* **Real-time:** Socket.io
* **Utilities:** QRCode, Papaparse (CSV), Recharts (Charts), FingerprintJS

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18 or higher)
* MongoDB Database (Local or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Attendance System"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory and add the following required variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Roles & Portals

* **Superadmin:** Global platform management, managing registered colleges/institutions, and site-wide branding.
* **Admin:** College-level administration, managing teachers, students, classes, and bulk imports.
* **Teacher:** Class management, initiating live attendance sessions, and viewing class analytics.
* **Student:** Viewing personal attendance records, scanning QR codes, and profile management.

## 🛠 Scripts

* `npm run dev`: Starts the development server.
* `npm run build`: Builds the app for production.
* `npm run start`: Runs the built app in production mode.
* `npm run lint`: Runs ESLint to check for code issues.

## 📄 License

This project is licensed under the MIT License.
