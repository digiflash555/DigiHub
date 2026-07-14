# Event Management System

A comprehensive web-based platform for managing events, registrations, nominations, and certificates for educational institutions. Built with React.js, Node.js, Express, and MongoDB.

## 🌟 Features

### Core Functionality
- **Event Management**: Create, manage, and publish events with custom registration forms
- **Online Registration**: Dynamic form builder for event registrations
- **Nomination System**: Apply for leadership positions with multi-level approval workflow
- **Certificate Generation**: Automated certificate creation with customizable templates
- **Attendance Tracking**: QR code-based attendance verification system
- **Profile Management**: Comprehensive user profiles with academic details
- **Security**: Encrypted security questions for secure password recovery

### User Roles
- **Participant/Student**: Register for events, submit nominations, download certificates
- **Association Member**: Extended participant privileges for association activities
- **Class Coordinator**: Manage students, review nominations, track attendance
- **Program Coordinator**: Review nominations, program-level oversight
- **Faculty**: Manage assigned events and student registrations
- **Faculty Coordinator**: Faculty-level coordination features
- **Student Coordinator**: Student leadership coordination
- **Administrator**: Full system access and configuration

## 🛠️ Tech Stack

### Frontend
- **React.js** - Functional components with hooks
- **React Router** - Navigation and route protection
- **TailwindCSS** - Responsive styling
- **Axios** - API communication
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library
- **React Hot Toast** - User notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - REST API framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication and session management
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **jsPDF** - PDF generation for certificates and reports

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn package manager
- Modern web browser

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Event_Management_System
```

### 2. Install Dependencies

#### Install Server Dependencies
```bash
cd server
npm install
```

#### Install Client Dependencies
```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

#### Client Environment Variables
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or ensure MongoDB Atlas connection string is in .env
```

### 5. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
# From project root
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

#### Individual Development
```bash
# Terminal 1 - Backend
cd server
npm run server

# Terminal 2 - Frontend
cd client
npm run dev
```

## 📁 Project Structure

```
Event_Management_System/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Custom middlewares
│   │   └── utils/         # Utility functions
│   ├── uploads/          # File upload directory
│   └── package.json
├── USER_GUIDE.md         # Detailed user manual
└── README.md             # This file
```

## 🎯 Quick Start Guide

### For Users

1. **Register**: Create an account with your academic details
2. **Login**: Sign in with your credentials
3. **Browse Events**: View available events and register
4. **Download Pass**: Get your QR code event pass
5. **Attend Events**: Show QR code for attendance verification
6. **Submit Nominations**: Apply for leadership positions (if enabled)
7. **Download Certificates**: Receive certificates via email after event completion

### For Administrators

1. **Login** as Admin
2. **Create Events**: Set up events with custom registration forms
3. **Manage Users**: Create faculty and coordinator accounts
4. **Configure Settings**: Enable/disable nominations, set system preferences
5. **Monitor Registrations**: Track event registrations and attendance
6. **Generate Certificates**: Create certificate templates and bulk generate
7. **Review Nominations**: Approve/reject leadership applications

## 📖 Documentation

For detailed usage instructions, please refer to the **[USER_GUIDE.md](USER_GUIDE.md)** which includes:

- Complete system architecture
- User roles and permissions
- Step-by-step guides for all features
- Troubleshooting common issues
- Security guidelines
- Best practices

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Encrypted Security Questions**: AES-256 encryption for password recovery
- **Role-Based Access Control**: Granular permissions based on user roles
- **Protected Routes**: API endpoints protected by authentication middleware

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password recovery
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (Admin)
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my` - Get my registrations
- `PUT /api/registrations/:id/attendance` - Mark attendance

### Nominations
- `POST /api/nominations` - Submit nomination
- `GET /api/nominations` - Get nominations
- `PUT /api/nominations/:id/approve` - Approve/reject nomination

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `POST /api/certificates/bulk-send` - Bulk send certificates

## 🧪 Testing

```bash
# Run backend tests (if configured)
cd server
npm test

# Run frontend tests (if configured)
cd client
npm test
```

## 📦 Deployment

### Production Build

#### Frontend
```bash
cd client
npm run build
```

The build output will be in `client/dist/`

#### Backend
```bash
cd server
npm start
```

### Recommended Deployment Stack
- **Frontend**: Vercel, Netlify, or nginx
- **Backend**: Node.js with PM2 process manager
- **Database**: MongoDB Atlas
- **CDN**: For static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Dr. Mahalingam College of Engineering and Technology, Pollachi
- Department of Computer Science and Engineering
- All contributors and developers

---

**Note**: This is an educational institution event management system designed to streamline event organization, registration, and certificate generation processes.
