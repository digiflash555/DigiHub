# Event Management System - User Guide Manual

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [User Roles and Permissions](#user-roles-and-permissions)
5. [Registration](#registration)
6. [Login and Authentication](#login-and-authentication)
7. [Forgot Password](#forgot-password)
8. [Dashboard Overview](#dashboard-overview)
9. [Event Management](#event-management)
10. [Event Registration](#event-registration)
11. [Nomination System](#nomination-system)
12. [Certificate Management](#certificate-management)
13. [Profile Management](#profile-management)
14. [Admin Features](#admin-features)
15. [Coordinator Features](#coordinator-features)
16. [Advanced Features](#advanced-features)
17. [Data Privacy and Security](#data-privacy-and-security)
18. [Integration Capabilities](#integration-capabilities)
19. [Performance Optimization](#performance-optimization)
20. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: React.js with functional components and hooks
- **State Management**: React Context API for authentication and user state
- **Routing**: React Router for navigation and route protection
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion for smooth transitions and animations
- **Styling**: TailwindCSS for responsive design
- **HTTP Client**: Axios for API communication
- **Notifications**: React Hot Toast for user feedback

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js for REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) for session management
- **Password Hashing**: bcryptjs for secure password storage
- **File Upload**: Multer for handling file uploads (images, signatures)
- **Encryption**: Node.js crypto module for AES-256 encryption
- **Email Service**: Nodemailer for sending emails and certificates

#### Database Schema

**User Collection**:
- Personal information (name, email, phone, bio)
- Academic details (year, department, section, registration number)
- Role-based fields (employee ID, designation, assigned class)
- Security questions (encrypted)
- Profile image and signature
- Skills array
- Timestamps

**Event Collection**:
- Event details (title, description, type, category)
- Date, time, venue information
- Registration settings (deadline, fee, capacity)
- Custom registration form fields
- Banner and thumbnail images
- Certificate template reference
- Status (draft, published, completed, cancelled)

**Registration Collection**:
- User and event references
- Registration ID (unique identifier)
- Custom field responses
- Attendance status
- Feedback submission
- Timestamps

**Nomination Collection**:
- User and form references
- Post applied for
- Personal information
- Academic proficiency
- Innovation proposal
- Custom field responses
- Approval workflow status
- Approval history (array of reviews)
- Timestamps

**NominationForm Collection**:
- Form title and description
- Start and end dates
- Active status
- Custom field definitions
- Created by reference
- Timestamps

**Settings Collection** (Singleton):
- Nomination form enable/disable flag
- Nomination submission restriction settings
- Global system configuration

**Certificate Collection**:
- Event reference
- Template image
- Variable field definitions
- Generation settings
- Timestamps

### API Architecture

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/verify-security-answers` - Verify security questions
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/update-password` - Change password
- `POST /api/auth/upload-profile` - Upload profile picture

#### Event Endpoints
- `POST /api/events` - Create event (Admin)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)
- `GET /api/events/stats` - Get event statistics (Admin)

#### Registration Endpoints
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my` - Get my registrations
- `GET /api/registrations/event/:id` - Get event registrations (Admin)
- `PUT /api/registrations/:id/attendance` - Mark attendance (Admin)
- `POST /api/registrations/:id/feedback` - Submit feedback

#### Nomination Endpoints
- `POST /api/nominations/forms` - Create nomination form (Admin)
- `GET /api/nominations/forms` - Get nomination forms
- `PUT /api/nominations/forms/:id` - Update nomination form (Admin)
- `DELETE /api/nominations/forms/:id` - Delete nomination form (Admin)
- `POST /api/nominations` - Submit nomination
- `GET /api/nominations` - Get nominations
- `GET /api/nominations/:id` - Get nomination details
- `PUT /api/nominations/:id/approve` - Approve/reject nomination

#### Certificate Endpoints
- `POST /api/certificates/generate` - Generate single certificate
- `POST /api/certificates/bulk-send` - Bulk generate certificates
- `GET /api/certificates/event/:id` - Get event certificates (Admin)

#### Settings Endpoints
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings (Admin)

### Security Architecture

#### Authentication Flow
1. User submits credentials
2. Server validates and generates JWT token
3. Token stored in client (localStorage/cookie)
4. Token sent with each API request
5. Server verifies token on protected routes
6. Token expires after 30 days

#### Authorization Levels
- **Public**: Registration, login, forgot password
- **Authenticated**: Profile management, event registration
- **Role-Based**: Admin-only routes, Coordinator-only routes
- **Resource-Based**: Users can only access their own data

#### Data Encryption
- **Passwords**: bcrypt hashing with salt rounds
- **Security Questions**: AES-256-CBC encryption
- **JWT Tokens**: Signed with secret key
- **File Uploads**: Stored in secure uploads directory

### Deployment Architecture

#### Development Environment
- Frontend: Vite dev server (port 5173)
- Backend: Express server (port 5000)
- Database: Local MongoDB instance
- Hot module replacement for frontend
- Auto-restart for backend changes

#### Production Environment (Recommended)
- **Frontend**: Static hosting (Vercel, Netlify, or nginx)
- **Backend**: Node.js server (PM2 process manager)
- **Database**: MongoDB Atlas (cloud database)
- **CDN**: For static assets (images, certificates)
- **SSL/TLS**: HTTPS for all communications
- **Load Balancer**: For high-traffic scenarios

---

## Introduction

The Event Management System is a comprehensive platform designed to streamline event organization, registration, nominations, and certificate generation for educational institutions. This system supports multiple user roles including Participants, Association Members, Class Coordinators, Program Coordinators, Faculty, and Administrators.

### Key Features
- **Event Creation and Management**: Admins can create events with custom registration forms
- **Online Registration**: Students can register for events with dynamic form fields
- **Nomination System**: Apply for leadership positions with approval workflow
- **Certificate Generation**: Automated certificate creation with customizable templates
- **Attendance Tracking**: QR code-based attendance verification
- **Profile Management**: Comprehensive user profiles with academic details
- **Security**: Encrypted security questions for password recovery

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Valid email address for registration

### Accessing the System
1. Open your web browser
2. Navigate to the application URL (typically `http://localhost:5173` for development)
3. You will see the home page with options to login or register

---

## User Roles and Permissions

### 1. Participant (Student)
- Register for events
- View event details
- Download event passes
- Submit nominations for leadership positions
- View nomination status
- Download certificates (if eligible)
- Manage personal profile

### 2. Association Member
- All Participant permissions
- Submit nominations for association positions
- Access association-specific events

### 3. Class Coordinator (CC)
- View and manage students in assigned class/year/section
- Review and approve/reject nominations
- View student attendance records
- Access coordinator dashboard

### 4. Program Coordinator (PC)
- Review nominations approved by Class Coordinators
- Final approval for program-level nominations
- View program-wide statistics

### 5. Faculty
- View assigned events
- Manage student registrations
- Access faculty-specific features

### 6. Faculty Coordinator
- Faculty-level coordination features
- Manage faculty-related events

### 7. Student Coordinator
- Student leadership coordination
- Manage student volunteer activities

### 8. Administrator
- Full system access
- Create and manage events
- Manage users (create, update, delete)
- Manage association members
- Generate certificates
- Configure system settings
- View all reports and statistics

---

## Registration

### New User Registration

#### Step 1: Access Registration Page
- Click "Create Free Account" on the login page
- Or navigate directly to `/register`

#### Step 2: Fill Personal Information
- **Full Name**: Enter your legal name
- **Student/Reg ID**: Enter your registration number (optional but recommended)
- **Date of Birth**: Select your birth date
- **Gender**: Select your gender (Male/Female/Other)

#### Step 3: Academic Details
- **Year & Department**: Select your current year and department from the dropdown
  - Available departments: CSE, ECE, EEE, Mechanical, Civil, IT, AI&DS, Mechatronics, AIML(CSE), ACT, VLSI, CYBER(CSE)
  - Years: I, II, III, IV (B.E.)
- **Class Section**: Select your section (A, B, C, or Nil)

#### Step 4: Contact Information
- **Email Address**: Enter a valid email (will be used for login)
- **Phone Number**: Enter your contact number (optional)
- **Password**: Create a password (minimum 6 characters)

#### Step 5: Additional Information
- **Bio**: Write a brief description about yourself (max 500 characters)
- **Skills**: List your skills separated by commas (e.g., "JavaScript, React, Python")

#### Step 6: Security Questions (IMPORTANT)
You must set up security questions for password recovery:
- **Best Friend's Name**: Enter in one word
- **Favorite Color**: Enter in one word
- **Favorite Hero Name**: Enter in one word

⚠️ **Note**: These answers are encrypted and stored securely. You will need these answers to reset your password if forgotten.

#### Step 7: Complete Registration
- Click "Create Participant Account"
- You will be automatically logged in and redirected to the dashboard

---

## Login and Authentication

### Logging In
1. Navigate to the login page
2. Enter your registered email address
3. Enter your password
4. Click "Sign In to Dashboard"

### Role-Based Redirect
After login, you will be redirected based on your role:
- **Participant/Association Member**: Student Dashboard
- **Class Coordinator**: Coordinator Dashboard
- **Program Coordinator**: Coordinator Dashboard
- **Admin**: Admin Dashboard
- **Faculty**: Faculty Dashboard

### Session Management
- Sessions are valid for 30 days
- You will be automatically logged out after 30 days
- Use "Logout" to end your session manually

---

## Forgot Password

If you forget your password, you can recover it using the security questions you set during registration.

### Step 1: Initiate Password Reset
1. On the login page, click "Forgot Password?"
2. You will be redirected to the password recovery page

### Step 2: Verify Email
1. Enter your registered email address
2. Click "Continue"
3. The system will check if the email exists and if security questions are set

### Step 3: Answer Security Questions
1. You must answer ALL THREE security questions correctly:
   - Best Friend's Name
   - Favorite Color
   - Favorite Hero Name
2. Enter the exact answers you provided during registration
3. Click "Verify Answers"

⚠️ **Important**: All three answers must match exactly. If any answer is incorrect, you will not be able to proceed.

### Step 4: Set New Password
1. After successful verification, enter your new password
2. Confirm the new password
3. Password must be at least 6 characters
4. Click "Reset Password"

### Step 5: Login with New Password
1. You will be redirected to the login page
2. Use your email and new password to log in

---

## Dashboard Overview

### Student Dashboard

The student dashboard provides a comprehensive view of your event participation and nominations.

#### Header Section
- **Welcome Banner**: Displays your name with a personalized greeting
- **Birthday Banner**: Special banner appears on your birthday
- **Quick Actions**: "Nominate" button for leadership applications

#### My Nominations
- View all your submitted nominations
- Track nomination status through approval workflow:
  - Submitted → CC Review → PC Review → Admin Decision
- Status indicators:
  - Green: Approved
  - Red: Rejected
  - Amber: Pending

#### My Registrations
- List of all events you've registered for
- Event details:
  - Event title and banner image
  - Date, time, and venue
  - Registration status
  - Attendance status
- Actions:
  - Download Event Pass (QR code)
  - View event details
  - Provide feedback (if attended)

### Admin Dashboard

The admin dashboard provides system-wide management capabilities.

#### Statistics Cards
- Total Events
- Total Registrations
- Total Attendees
- Recent Events list

#### Quick Actions
- **Nomination Forms**: Create and manage nomination forms
- **Manage Nominations**: Review and process nominations
- **Volunteer Applications**: Manage volunteer requests
- **Teacher Registry**: Manage faculty accounts
- **Attendance Records**: View attendance data
- **Association Members**: Manage association members
- **Scanner Mode**: QR code scanner for attendance
- **Feedback Management**: Review event feedback
- **Certificate Studio**: Generate certificates
- **Support Tickets**: Handle user support requests
- **System Settings**: Configure global system settings

---

## Event Management

### Creating Events (Admin Only)

#### Step 1: Access Create Event
- Navigate to Admin Dashboard
- Click "Create Event" or navigate to `/admin/create-event`

#### Step 2: Basic Information
- **Event Title**: Enter the event name
- **Description**: Provide a detailed description
- **Event Type**: Select type (Workshop, Seminar, Competition, etc.)
- **Category**: Select appropriate category

#### Step 3: Date and Time
- **Event Date**: Select the date
- **Start Time**: Set the start time
- **End Time**: Set the end time

#### Step 4: Location
- **Venue**: Enter the venue/location
- **Capacity**: Set maximum participants

#### Step 5: Registration Settings
- **Registration Deadline**: Set the last date for registration
- **Registration Fee**: Enter fee (if applicable)
- **Max Participants**: Set registration limit

#### Step 6: Custom Registration Form
You can create custom fields for registration:

**Field Types Available**:
- **Text**: Single-line text input
- **Textarea**: Multi-line text input
- **Dropdown**: Select from predefined options
- **Radio**: Single selection from options
- **Checkbox**: Multiple selections from options
- **File**: File upload
- **Number**: Numeric input
- **Date**: Date picker

**Adding Fields**:
1. Select field type
2. Enter field label
3. Set required status
4. For dropdown/radio/checkbox: Enter options (comma-separated)
5. Click "Add Field"

#### Step 7: Media
- **Banner Image**: Upload event banner
- **Thumbnail**: Upload event thumbnail

#### Step 8: Publish
- Review all details
- Click "Create Event"
- Event will be visible to users based on registration deadline

### Managing Events

#### View Events
- Navigate to Events page
- Filter by category, date, or status
- Search by event name

#### Edit Event
- Click on an event
- Click "Edit"
- Modify any field
- Save changes

#### Delete Event
- Click on an event
- Click "Delete"
- Confirm deletion
- ⚠️ Warning: This action cannot be undone

---

## Event Registration

### Registering for an Event

#### Step 1: Browse Events
- Navigate to Events page
- Browse available events
- Use filters to find relevant events

#### Step 2: View Event Details
- Click on an event card
- Review:
  - Event description
  - Date, time, venue
  - Registration deadline
  - Fee (if applicable)
  - Capacity

#### Step 3: Register
- Click "Register Now"
- Fill out the registration form:
  - Standard fields (name, email, etc.) are pre-filled
  - Custom fields must be completed
  - Required fields are marked
- Upload any required files
- Click "Submit Registration"

#### Step 4: Confirmation
- You will receive a confirmation message
- Registration ID will be generated
- Event pass will be available

### Downloading Event Pass

#### Step 1: Access Dashboard
- Navigate to your dashboard
- Go to "My Registrations"

#### Step 2: Find Event
- Locate the event in your registrations list

#### Step 3: Download Pass
- Click "Download Pass" button
- A QR code pass will be generated as PNG
- Save the pass to your device

#### Using the Pass
- Show the QR code at the event entrance
- Staff will scan the code for attendance
- The pass contains:
  - Your name and photo
  - Event details
  - Registration ID
  - QR code for verification

---

## Nomination System

The nomination system allows students to apply for leadership positions within the association.

### Nomination Form Availability

**Important**: Nomination forms are only available when enabled by the Administrator. If nominations are disabled, you will see a message indicating this.

### Submitting a Nomination

#### Step 1: Check Availability
- Navigate to Nomination page (`/nominate`)
- Verify that nominations are enabled
- Check if you're eligible (association members may be restricted to upcoming events)

#### Step 2: Select Nomination Form
- Choose the appropriate nomination form from the list
- Forms show:
  - Title
  - Description
  - Deadline
  - Status

#### Step 3: Fill Nomination Form

**Personal Information**:
- Name (pre-filled)
- Email (pre-filled)
- Registration Number
- Phone Number

**Academic Proficiency**:
- Current CGPA
- Year and Department
- Section

**Innovation Proposal**:
- Title of proposal
- Detailed description
- Expected outcomes

**Custom Fields**:
- Additional fields as defined by the nomination form

#### Step 4: Submit
- Review all information
- Click "Submit Nomination"
- You will receive a confirmation

### Nomination Approval Workflow

Nominations go through a three-level approval process:

#### Level 1: Class Coordinator Review
- CC reviews nominations from their assigned class
- Can approve or reject
- Can add remarks
- If approved: Moves to PC review
- If rejected: Process ends

#### Level 2: Program Coordinator Review
- PC reviews nominations approved by CC
- Can approve or reject
- Can add remarks
- If approved: Moves to Admin review
- If rejected: Process ends

#### Level 3: Admin Decision
- Admin makes final decision
- Can approve or reject
- Can add remarks
- If approved: Nomination is successful
- If rejected: Process ends

### Tracking Nomination Status

#### View Your Nominations
- Navigate to Dashboard
- Check "My Nominations" section

#### Status Indicators
- **Submitted**: Nomination submitted, awaiting CC review
- **Pending Class Coordinator**: Under CC review
- **Pending Program Coordinator**: Under PC review
- **Pending Admin**: Under Admin review
- **Approved**: Nomination successful
- **Rejected**: Nomination declined

#### Approval History
- Click on a nomination to view detailed history
- See who approved/rejected at each level
- View remarks from each reviewer

---

## Certificate Management

### Certificate Generation (Admin Only)

#### Step 1: Access Certificate Studio
- Navigate to Admin Dashboard
- Click "Certificate Studio"

#### Step 2: Select Event
- Choose the event for which to generate certificates
- View event details and registered participants

#### Step 3: Upload Template
- Upload a certificate template image (PNG/JPG)
- Recommended size: A4 landscape (2480 x 3508 pixels)

#### Step 4: Define Variable Fields
Click "Add Field" to define variables:

**Field Types**:
- **Name**: Recipient's name
- **Year**: Academic year
- **Department**: Department name
- **Event Name**: Event title
- **Date**: Certificate date
- **Custom**: Any custom text

**Field Properties**:
- **Label**: Field identifier
- **Default Value**: Placeholder text
- **Font Size**: Text size in pixels
- **Max Width**: Maximum width in pixels
- **Color**: Text color (color picker available)
- **Alignment**: Left, Center, or Right

**Positioning**:
- Drag fields on the preview canvas
- Position exactly where text should appear
- Use grid lines for alignment

#### Step 5: Preview
- Click "Preview" to see sample certificate
- Test with sample data
- Adjust positioning as needed

#### Step 6: Save Template
- Click "Save Template"
- Template is saved for the event

#### Step 7: Generate Certificates
- Click "Bulk Send"
- System generates certificates for all eligible participants
- Certificates are sent to participant emails
- PDF format

### Certificate Eligibility

Participants are eligible for certificates if:
- They registered for the event
- Their attendance was marked
- The event has a certificate template configured

### Downloading Certificates (Participants)

#### Automatic Delivery
- Certificates are emailed to eligible participants
- PDF format attachment

#### Manual Download (if available)
- Navigate to Dashboard
- Check "My Registrations"
- If certificate is available, download button appears

---

## Profile Management

### Accessing Profile
- Click on your profile picture or name
- Navigate to `/profile`

### Profile Tabs

#### Personal Tab
**Basic Information**:
- Full Name (editable)
- Email Address (read-only)
- Phone Number (editable)
- Date of Birth (editable)

**About You**:
- Bio (max 500 characters)
- Skills (comma-separated)

**Signature**:
- Upload signature image
- Preview signature
- Used for official documents

#### Academic/Work Tab
**For Students**:
- Registration Number (editable)
- Gender (editable)
- Class Section (read-only - set during registration)
- Year & Department (editable, limited to registered department)

**For Faculty/Staff**:
- Employee ID (read-only)
- Designation (editable by Admin only)
- Department (editable by Admin only)
- Assigned Year/Section (for Class Coordinators, read-only)

#### Security Tab
**Change Password**:
- Current Password
- New Password (min 6 characters)
- Confirm New Password

### Updating Profile
1. Navigate to desired tab
2. Modify fields as needed
3. Click "Save" button
4. Changes are saved immediately

### Profile Picture
- Click on camera icon on profile picture
- Select image file
- Upload
- Image is automatically updated

---

## Admin Features

### User Management

#### Create Association Member
1. Navigate to Admin Dashboard
2. Click "Teacher Registry" or "Association Members"
3. Click "Create Association Member"
4. Fill details:
   - Name, Email, Password
   - Role (Association Member)
   - Department, Designation
   - Employee ID
5. Click "Create"

#### Create Faculty
1. Navigate to Admin Dashboard
2. Click "Teacher Registry"
3. Click "Create Faculty"
4. Fill details:
   - Name, Email, Password
   - Role (Faculty/Faculty Coordinator)
   - Department, Designation
   - Employee ID
5. Click "Create"

#### View All Users
- Navigate to "Users" section
- View all registered users
- Filter by role
- Search by name/email

#### Update User
- Click on a user
- Modify details
- Click "Update"

#### Delete User
- Click on a user
- Click "Delete"
- Confirm deletion
- ⚠️ Warning: This cannot be undone

### Nomination Form Builder

#### Create Nomination Form
1. Navigate to "Nomination Forms"
2. Click "Create New Form"
3. Enter:
   - Form Title
   - Description
   - Start Date (optional)
   - End Date (optional)
4. Add custom fields as needed
5. Click "Save"

#### Manage Forms
- View all nomination forms
- Edit existing forms
- Delete forms
- Toggle active status

#### System Settings
1. Navigate to "System Settings"
2. Configure:
   - **Enable Nomination Forms**: Toggle to allow/disallow nominations
   - **Nomination Restriction**: 
     - All users can submit
     - Only for upcoming events (association members)
3. Click "Save Settings"

### Attendance Management

#### Scanner Mode
1. Navigate to "Scanner Mode"
2. Select event
3. Scan participant QR codes
4. Attendance is automatically marked

#### View Attendance Records
- Navigate to "Attendance Records"
- Filter by event
- View participant attendance status
- Export reports

### Feedback Management

#### View Feedback
- Navigate to "Feedback Management"
- Filter by event
- Read participant feedback
- Analyze ratings

### Support Tickets

#### View Tickets
- Navigate to "Support Tickets"
- View all user-submitted tickets
- Filter by status

#### Resolve Tickets
- Click on a ticket
- Add resolution notes
- Mark as resolved

---

## Coordinator Features

### Class Coordinator (CC)

#### Dashboard
- View assigned class statistics
- See student registration counts
- View attendance data

#### Manage Nominations
1. Navigate to "Review Panel"
2. View nominations from assigned class
3. Review each nomination:
   - Read proposal
   - Check academic details
   - View student profile
4. Take action:
   - Approve: Moves to PC review
   - Reject: Ends nomination process
   - Add remarks
5. Submit decision

#### View Class Students
- Navigate to "Class Students"
- View all students in assigned year/section
- View registration history
- View attendance records

### Program Coordinator (PC)

#### Dashboard
- View program-wide statistics
- See nomination approval rates
- View event participation data

#### Manage Nominations
1. Navigate to "Review Panel"
2. View nominations approved by CCs
3. Review each nomination:
   - Read proposal
   - Check CC remarks
   - View student profile
4. Take action:
   - Approve: Moves to Admin review
   - Reject: Ends nomination process
   - Add remarks
5. Submit decision

---

## Troubleshooting

### Common Issues

#### Issue: Cannot Login
**Solutions**:
- Verify email and password are correct
- Check caps lock
- Use "Forgot Password" if needed
- Ensure account is active

#### Issue: Registration Not Working
**Solutions**:
- Check if registration deadline has passed
- Verify event capacity is not full
- Ensure all required fields are filled
- Check internet connection

#### Issue: Cannot Submit Nomination
**Solutions**:
- Verify nominations are enabled by Admin
- Check if you're eligible (association members may need upcoming events)
- Ensure form deadline has not passed
- Complete all required fields

#### Issue: Certificate Not Received
**Solutions**:
- Verify attendance was marked
- Check if certificate template is configured
- Wait for bulk generation to complete
- Contact Admin if issue persists

#### Issue: QR Code Not Scanning
**Solutions**:
- Ensure QR code is clear and not blurry
- Check brightness of display
- Try zooming in on QR code
- Use a different scanner if needed

#### Issue: Profile Not Updating
**Solutions**:
- Click "Save" after making changes
- Check for error messages
- Refresh the page
- Ensure you're logged in

#### Issue: Forgot Password Not Working
**Solutions**:
- Ensure you answer ALL THREE security questions correctly
- Answers must match exactly (case-sensitive)
- One-word answers as entered during registration
- Contact Admin if security questions were not set

### Error Messages

#### "Account with this email already exists"
- You already have an account
- Use "Forgot Password" if you can't remember password
- Contact Admin for account recovery

#### "Security answers do not match"
- One or more answers are incorrect
- Try again with exact answers
- Answers are case-sensitive
- Contact Admin if you cannot remember

#### "Event registration closed"
- Registration deadline has passed
- Event capacity is full
- Event has been cancelled

#### "You are not eligible for this nomination"
- Nominations may be restricted to certain users
- Check nomination requirements
- Contact Admin for clarification

### Contact Support

If you encounter issues not covered here:
1. Check with your Class Coordinator
2. Contact Program Coordinator
3. Submit a Support Ticket
4. Contact System Administrator

---

## Best Practices

### For Participants
- Register early for events to secure your spot
- Keep your profile updated
- Download event passes before the event
- Provide feedback after attending events
- Check nomination status regularly

### For Coordinators
- Review nominations promptly
- Provide clear remarks when rejecting
- Keep track of your assigned students
- Communicate with Program Coordinator

### For Admins
- Create events well in advance
- Configure certificate templates early
- Monitor system settings regularly
- Respond to support tickets quickly
- Keep user data updated

---

## Security Guidelines

### Password Security
- Use strong passwords (minimum 6 characters)
- Don't share passwords with others
- Change password periodically
- Use different passwords for different accounts

### Security Questions
- Remember your security question answers
- Use answers you won't forget
- Keep answers private
- Update if you think they're compromised

### Account Security
- Log out after using shared devices
- Don't leave your account unattended
- Report suspicious activity immediately
- Keep your email secure

---

## System Requirements for Administrators

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Recommended Settings
- Enable JavaScript
- Enable cookies
- Allow pop-ups for certificate downloads
- Stable internet connection

---

## Advanced Features

### Dynamic Form Builder

The system includes a powerful dynamic form builder that allows administrators to create custom registration and nomination forms without coding.

#### Form Field Types

**Text Field**:
- Single-line text input
- Suitable for names, short answers
- Can be marked as required
- Supports placeholder text

**Textarea**:
- Multi-line text input
- Suitable for descriptions, essays
- Character limit support
- Resizable by user

**Dropdown**:
- Single selection from predefined options
- Options entered as comma-separated values
- First option can be default
- Clean UI with arrow indicator

**Radio Buttons**:
- Single selection from options
- Options displayed as clickable buttons
- Visual selection indicator
- Good for 3-5 options

**Checkboxes**:
- Multiple selections from options
- Each option independently selectable
- Returns array of selected values
- Good for interests, skills

**File Upload**:
- Accepts image files (JPG, PNG, GIF, WebP)
- Size limit: 5MB per file
- Automatic validation
- Preview available

**Number Field**:
- Numeric input only
- Supports min/max values
- Prevents invalid characters
- Good for age, quantity

**Date Picker**:
- Calendar-based date selection
- Native browser picker
- Date format: YYYY-MM-DD
- Good for deadlines, birthdates

#### Form Validation
- Required field validation
- Email format validation
- File type validation
- File size validation
- Character limit enforcement

### QR Code Generation

The system generates unique QR codes for each event registration.

#### QR Code Features
- **Unique per registration**: Each registration gets a unique QR code
- **Contains registration ID**: Encoded with registration identifier
- **Event information**: Includes event details
- **User information**: Includes participant name and photo
- **Scannable**: Compatible with any QR code scanner

#### QR Code Design
- Professional layout with event branding
- Participant photo and name
- Event title, date, venue
- Registration ID
- Instructions for use
- High resolution for printing

#### Attendance Scanning
- Admins use scanner mode to verify attendance
- QR code scanned at event entrance
- Instant verification of registration
- Automatic attendance marking
- Prevents duplicate check-ins

### Certificate Customization

Certificates can be fully customized with variable fields and color options.

#### Variable Fields
- **Name**: Participant's full name
- **Year**: Academic year
- **Department**: Department name
- **Event Name**: Event title
- **Date**: Certificate issuance date
- **Custom Fields**: Any additional text

#### Field Customization
- **Position**: Drag and drop on canvas
- **Font Size**: Adjustable in pixels
- **Max Width**: Text wrapping control
- **Color**: Full color picker available
- **Alignment**: Left, center, or right
- **Font Family**: System fonts supported

#### Color Options
- Full RGB color spectrum
- Preset color palette
- Hex code input
- Live preview
- Per-field color control

### Real-time Notifications

The system provides instant feedback through toast notifications.

#### Notification Types
- **Success**: Green notifications for successful actions
- **Error**: Red notifications for errors and failures
- **Warning**: Yellow notifications for warnings
- **Info**: Blue notifications for information

#### Notification Triggers
- Successful registration
- Nomination submission
- Profile updates
- Password changes
- Certificate generation
- Error messages
- Validation failures

### Responsive Design

The system is fully responsive across all device sizes.

#### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

#### Mobile Optimizations
- Touch-friendly buttons
- Stacked layouts
- Simplified navigation
- Optimized images
- Fast loading

#### Desktop Features
- Multi-column layouts
- Hover effects
- Keyboard navigation
- Larger displays
- Enhanced interactions

---

## Data Privacy and Security

### Data Collection

#### Personal Information
- **Name**: Required for identification
- **Email**: Required for login and communication
- **Phone**: Optional, for event notifications
- **Date of Birth**: Optional, for birthday features
- **Profile Image**: Optional, for personalization

#### Academic Information
- **Registration Number**: Optional, for student identification
- **Year and Department**: Required for class assignment
- **Section**: Required for coordinator assignment
- **CGPA**: Optional, for nomination eligibility

#### Security Information
- **Security Questions**: Required for password recovery
- **Answers**: Encrypted using AES-256
- **Password**: Hashed using bcrypt

### Data Storage

#### Encryption Standards
- **Passwords**: bcrypt with 10 salt rounds
- **Security Questions**: AES-256-CBC encryption
- **JWT Tokens**: Signed with secret key
- **File Uploads**: Stored in secure directory

#### Data Retention
- **User Data**: Retained until account deletion
- **Event Data**: Retained for historical records
- **Registrations**: Retained for certificate generation
- **Certificates**: Retained for reissuance

### Data Access

#### User Access
- Users can only access their own data
- Profile information is private
- Registration history is personal
- Nomination details are confidential

#### Admin Access
- Admins can access all user data
- Admins can modify user accounts
- Admins can view all registrations
- Admins can manage system settings

#### Coordinator Access
- Coordinators can access assigned student data
- Coordinators can view nominations from their class
- Coordinators cannot access other classes' data
- Coordinators have limited admin privileges

### Data Sharing

#### Third-Party Services
- **Email Service**: Nodemailer for sending emails
- **No third-party analytics**: No tracking scripts
- **No advertising**: No ad networks
- **No data selling**: Data never sold

#### Certificate Distribution
- Certificates sent via email
- PDF format for security
- No external certificate hosting
- Direct download links

### Compliance

#### GDPR Considerations
- Right to access personal data
- Right to rectify inaccurate data
- Right to erasure (account deletion)
- Right to data portability
- Clear consent mechanisms

#### Best Practices
- Regular security audits
- Password complexity requirements
- Session timeout after 30 days
- Secure password recovery
- Regular data backups

---

## Integration Capabilities

### API Integration

The system exposes RESTful APIs for integration with other systems.

#### Authentication
- JWT-based authentication
- Token-based authorization
- Role-based access control
- Session management

#### Webhook Support (Potential)
- Event registration webhooks
- Nomination status updates
- Certificate generation notifications
- User account changes

#### Data Export
- CSV export for registrations
- PDF export for certificates
- JSON export for event data
- Excel export for reports

### Email Integration

#### Email Templates
- Registration confirmation
- Nomination status updates
- Certificate delivery
- Password reset notifications
- Event reminders

#### Email Configuration
- SMTP settings
- Custom email templates
- HTML email support
- Attachment support

### Calendar Integration (Potential)

#### iCal Export
- Event calendar export
- Registration deadline reminders
- Event schedule synchronization
- Google Calendar integration

#### Outlook Integration
- Event invitations
- Meeting requests
- Calendar sync
- Reminder notifications

### Payment Integration (Potential)

#### Payment Gateways
- Razorpay integration
- Stripe integration
- PayPal integration
- UPI payment support

#### Fee Management
- Event fee collection
- Receipt generation
- Refund processing
- Payment history

---

## Performance Optimization

### Frontend Optimization

#### Code Splitting
- Route-based code splitting
- Lazy loading components
- Dynamic imports
- Reduced bundle size

#### Image Optimization
- Responsive images
- Lazy loading
- WebP format support
- Image compression

#### Caching Strategy
- Browser caching
- Service worker caching
- API response caching
- Local storage for user data

#### Performance Monitoring
- Load time tracking
- API response time
- Error tracking
- User analytics

### Backend Optimization

#### Database Indexing
- User email index
- Event date index
- Registration user index
- Nomination status index

#### Query Optimization
- Population of references
- Selective field retrieval
- Pagination for large datasets
- Aggregation for statistics

#### Caching
- Redis caching (optional)
- In-memory caching
- API response caching
- Session caching

#### Load Balancing
- Horizontal scaling
- Multiple server instances
- Database connection pooling
- Request queuing

### Database Optimization

#### Indexing Strategy
- Compound indexes for complex queries
- Text indexes for search
- Unique indexes for constraints
- Partial indexes for filtered data

#### Data Archiving
- Old event data archiving
- Expired registration cleanup
- Log rotation
- Backup strategies

#### Connection Management
- Connection pooling
- Connection timeout
- Retry logic
- Error handling

---

## Glossary

- **CC**: Class Coordinator
- **PC**: Program Coordinator
- **QR Code**: Quick Response Code for attendance verification
- **Nomination**: Application for leadership position
- **Event Pass**: Digital pass with QR code for event entry
- **Certificate Template**: Base image for certificate generation
- **Variable Field**: Dynamic text field in certificate template

---

## Version History

### Version 1.0
- Initial release
- Core event management features
- Registration system
- Nomination system
- Certificate generation
- User profiles
- Security questions for password recovery

---

## Contact Information

For technical support or questions:
- System Administrator: [Admin Email]
- IT Support: [Support Email]
- Department: [Department Contact]

---

*This user guide is subject to updates as new features are added to the system. Check for the latest version regularly.*
