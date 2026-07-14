# Admin, Faculty & Association Member Guide

This guide is specifically designed for Administrators, Faculty, and Association Members who have advanced privileges in the Event Management System.

## 👥 Who Should Use This Guide

- **Administrators** - Full system access and configuration
- **Faculty** - Manage assigned events and student registrations
- **Faculty Coordinators** - Faculty-level coordination
- **Association Members** - Extended participant privileges
- **Class Coordinators** - Manage students and review nominations
- **Program Coordinators** - Program-level oversight

---

## 🔐 Administrator Guide

### Dashboard Overview

As an Administrator, you have access to the Admin Dashboard with comprehensive system management capabilities.

**Statistics Cards:**
- Total Events
- Total Registrations
- Total Attendees
- Recent Events list

**Quick Actions Menu:**
- Nomination Forms
- Manage Nominations
- Volunteer Applications
- Teacher Registry
- Attendance Records
- Association Members
- Scanner Mode
- Feedback Management
- Certificate Studio
- Support Tickets
- System Settings

### Creating and Managing Events

#### Step 1: Create a New Event

1. **Access Create Event**
   - Navigate to Admin Dashboard
   - Click "Create Event" or go to `/admin/create-event`

2. **Basic Information**
   - **Event Title**: Enter the event name
   - **Description**: Provide detailed description
   - **Event Type**: Select (Workshop, Seminar, Competition, etc.)
   - **Category**: Choose appropriate category

3. **Date and Time**
   - **Event Date**: Select the date
   - **Start Time**: Set start time
   - **End Time**: Set end time

4. **Location Details**
   - **Venue**: Enter venue/location
   - **Capacity**: Set maximum participants

5. **Registration Settings**
   - **Registration Deadline**: Last date for registration
   - **Registration Fee**: Enter fee if applicable
   - **Max Participants**: Set registration limit

6. **Custom Registration Form**
   
   You can add custom fields for registration:
   
   **Available Field Types:**
   - **Text**: Single-line input
   - **Textarea**: Multi-line input
   - **Dropdown**: Select from options
   - **Radio**: Single selection
   - **Checkbox**: Multiple selections
   - **File**: File upload
   - **Number**: Numeric input
   - **Date**: Date picker
   
   **Adding a Field:**
   1. Select field type
   2. Enter field label
   3. Set required status
   4. For dropdown/radio/checkbox: Enter options (comma-separated)
   5. Click "Add Field"

7. **Media Upload**
   - **Banner Image**: Upload event banner
   - **Thumbnail**: Upload event thumbnail

8. **Publish Event**
   - Review all details
   - Click "Create Event"
   - Event becomes visible based on registration deadline

#### Managing Existing Events

**View Events:**
- Navigate to Events page
- Filter by category, date, or status
- Search by event name

**Edit Event:**
- Click on an event
- Click "Edit"
- Modify any field
- Save changes

**Delete Event:**
- Click on an event
- Click "Delete"
- Confirm deletion
- ⚠️ Warning: This action cannot be undone

### User Management

#### Create Association Member

1. Navigate to Admin Dashboard
2. Click "Teacher Registry" or "Association Members"
3. Click "Create Association Member"
4. Fill details:
   - Name, Email, Password
   - Role: Association Member
   - Department, Designation
   - Employee ID
5. Click "Create"

#### Create Faculty Account

1. Navigate to Admin Dashboard
2. Click "Teacher Registry"
3. Click "Create Faculty"
4. Fill details:
   - Name, Email, Password
   - Role: Faculty or Faculty Coordinator
   - Department, Designation
   - Employee ID
5. Click "Create"

#### Create Class Coordinator

1. Navigate to Admin Dashboard
2. Click "Teacher Registry"
3. Click "Create Faculty"
4. Set Role: Class Coordinator
5. Fill details:
   - Name, Email, Password
   - Department, Designation
   - Employee ID
   - Assigned Year/Section
6. Click "Create"

#### View and Manage Users

- Navigate to "Users" section
- View all registered users
- Filter by role
- Search by name/email
- Update user details
- Delete users (with caution)

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

#### Manage Nomination Forms

- View all nomination forms
- Edit existing forms
- Delete forms
- Toggle active status

#### System Settings for Nominations

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
2. Select the event
3. Scan participant QR codes using camera
4. Attendance is automatically marked

#### View Attendance Records

- Navigate to "Attendance Records"
- Filter by event
- View participant attendance status
- Export attendance reports (Excel/PDF)

### Certificate Management

#### Certificate Studio

1. Navigate to "Certificate Studio"
2. Select an event
3. View event details and registered participants

#### Create Certificate Template

1. **Upload Template**
   - Upload certificate template image (PNG/JPG)
   - Recommended size: A4 landscape (2480 x 3508 pixels)

2. **Define Variable Fields**
   - Click "Add Field"
   - Select field type:
     - Name: Recipient's name
     - Year: Academic year
     - Department: Department name
     - Event Name: Event title
     - Date: Certificate date
     - Custom: Any custom text
   - Set properties:
     - Label: Field identifier
     - Default Value: Placeholder text
     - Font Size: Text size in pixels
     - Max Width: Maximum width in pixels
     - Color: Text color
     - Alignment: Left, Center, or Right
   - Position fields on preview canvas
   - Drag to exact position

3. **Preview and Save**
   - Click "Preview" to test with sample data
   - Adjust positioning as needed
   - Click "Save Template"

4. **Generate Certificates**
   - Click "Bulk Send"
   - System generates certificates for all eligible participants
   - Certificates are emailed to participants (PDF format)

#### Certificate Eligibility

Participants receive certificates if:
- They registered for the event
- Their attendance was marked
- The event has a certificate template configured

### Feedback Management

#### View Feedback

1. Navigate to "Feedback Management"
2. Filter by event
3. Read participant feedback
4. Analyze ratings and comments

### Support Tickets

#### View Tickets

1. Navigate to "Support Tickets"
2. View all user-submitted tickets
3. Filter by status (Open, In Progress, Resolved)

#### Resolve Tickets

1. Click on a ticket
2. Read the issue description
3. Add resolution notes
4. Mark as resolved
5. User will be notified

### System Settings

Configure global system settings:
- Enable/disable nomination forms
- Set nomination restrictions
- Configure symposium details
- Upload logos (IIC, Digiflash)
- Upload signatures (Association Coordinator, HOD)

---

## 👨‍🏫 Faculty Guide

### Dashboard Overview

Faculty members have access to the Faculty Dashboard with event management capabilities.

**Features:**
- View assigned events
- Manage student registrations
- Track attendance
- Download reports

### Managing Assigned Events

#### View Your Events

1. Navigate to Faculty Dashboard
2. Check "Incharge Events" section
3. View events you're assigned to coordinate

#### Event Details

For each event, you can:
- View event information
- See registration count
- Check attendance status
- Download attendance reports (Excel/PDF)
- Download registration reports (PDF)
- Download feedback reports (Excel/PDF)

#### Download Reports

**Attendance Reports:**
- Click "Excel" for spreadsheet format
- Click "PDF" for printable format

**Registration Reports:**
- Click "PDF" to download registration list with participant details
- Includes: Serial Number, Roll Number, Name, Dept/Class, Email, Contact Number

**Feedback Reports:**
- Click "Excel" for spreadsheet format
- Click "PDF" for printable format

### Student Management

#### View Class Students (Class Coordinators Only)

1. Navigate to Faculty Dashboard
2. Switch to "Registry" tab
3. View all students in your assigned class
4. See:
   - Student details
   - Registration history
   - Attendance records

---

## 🎓 Association Member Guide

### Dashboard Overview

Association Members have extended participant privileges.

**Additional Features:**
- Access association-specific events
- Submit nominations for association positions
- View association statistics
- Manage expense tracking (if applicable)

### Event Registration

As an Association Member, you can:
- Register for all public events
- Access association-exclusive events
- Register for upcoming events (if nomination restriction is enabled)

### Nomination Submission

#### Eligibility

- Can submit nominations for association positions
- May be restricted to upcoming events only (based on system settings)

#### Submit Nomination

1. Navigate to "Nominate" page
2. Check nomination availability
3. Select appropriate nomination form
4. Fill nomination form with:
   - Personal information
   - Academic details
   - Innovation proposal
   - Custom fields
5. Submit nomination

### Expense Tracking (Association Members Only)

If enabled, Association Members can:
- Submit expense claims
- Track reimbursements
- View transaction history

---

## 📋 Class Coordinator Guide

### Dashboard Overview

Class Coordinators manage students in their assigned class/year/section.

**Features:**
- View assigned class statistics
- Manage student registrations
- Review nominations
- Track attendance

### Managing Nominations

#### Review Nominations

1. Navigate to Coordinator Dashboard
2. Go to "Review Panel"
3. View nominations from your assigned class
4. Review each nomination:
   - Read the proposal
   - Check academic details
   - View student profile

#### Approve/Reject Nominations

1. Select a nomination
2. Review all details
3. Take action:
   - **Approve**: Moves to Program Coordinator review
   - **Reject**: Ends nomination process
   - **Add Remarks**: Provide feedback
4. Submit decision

### View Class Students

1. Navigate to Coordinator Dashboard
2. Switch to "Registry" tab
3. View all students in your assigned year/section
4. See:
   - Student details
   - Registration history
   - Attendance records

---

## 🎯 Program Coordinator Guide

### Dashboard Overview

Program Coordinators provide program-level oversight.

**Features:**
- View program-wide statistics
- Review nominations approved by Class Coordinators
- Final approval for program-level nominations

### Managing Nominations

#### Review Nominations

1. Navigate to Coordinator Dashboard
2. Go to "Review Panel"
3. View nominations approved by Class Coordinators
4. Review each nomination:
   - Read the proposal
   - Check Class Coordinator remarks
   - View student profile

#### Approve/Reject Nominations

1. Select a nomination
2. Review all details
3. Take action:
   - **Approve**: Moves to Admin review
   - **Reject**: Ends nomination process
   - **Add Remarks**: Provide feedback
4. Submit decision

---

## 📊 Report Downloads

### Available Reports

**For Admins:**
- Event statistics
- Registration reports
- Attendance reports
- Feedback reports
- Nomination reports

**For Faculty/Coordinators:**
- Attendance reports (Excel/PDF)
- Registration reports (PDF)
- Feedback reports (Excel/PDF)

### Downloading Reports

1. Navigate to your Dashboard
2. Find the event in your events list
3. Go to "Instant Actions" section
4. Click the appropriate download button:
   - Attendance: Excel or PDF
   - Feedback: Excel or PDF
   - Registration: PDF

---

## 🔐 Security Best Practices

### For Administrators

- **Password Security**: Use strong passwords and change regularly
- **User Access**: Only create accounts for authorized personnel
- **Data Privacy**: Protect user information
- **Regular Audits**: Review user access periodically
- **Backup Data**: Ensure regular database backups

### For Faculty/Coordinators

- **Account Security**: Don't share login credentials
- **Student Data**: Handle student information confidentially
- **Nomination Reviews**: Be fair and objective
- **Documentation**: Keep records of important decisions

---

## ❓ Common Issues

### Administrator Issues

**Q: Event not visible to students?**
A: Check if registration deadline is in the future and event status is published.

**Q: Cannot create user account?**
A: Ensure all required fields are filled and email is not already registered.

**Q: Certificates not generating?**
A: Verify certificate template is configured and attendance is marked.

### Faculty Issues

**Q: Cannot see assigned events?**
A: Contact Administrator to ensure you're properly assigned to events.

**Q: Reports not downloading?**
A: Check internet connection and ensure you have proper permissions.

### Coordinator Issues

**Q: Cannot see student nominations?**
A: Verify you're assigned to the correct class/year/section.

**Q: Cannot approve nominations?**
A: Ensure nominations are in the correct approval stage for your role.

---

## 📞 Support

For role-specific issues:

1. **Administrators**: Contact system technical support
2. **Faculty**: Contact Program Coordinator or Administrator
3. **Coordinators**: Contact Program Coordinator or Administrator
4. **Association Members**: Contact Administrator

---

## 🎉 Best Practices

### For Administrators
- Create events well in advance
- Configure certificate templates early
- Monitor system settings regularly
- Respond to support tickets promptly
- Keep user data updated

### For Faculty
- Review event registrations regularly
- Download reports before events
- Track attendance accurately
- Provide feedback on events

### For Coordinators
- Review nominations promptly
- Provide clear remarks when rejecting
- Keep track of assigned students
- Communicate with Program Coordinator

### For Association Members
- Submit nominations on time
- Provide detailed proposals
- Track nomination status
- Participate actively in events

---

**For complete system documentation**, refer to:
- [README.md](README.md) - Technical overview
- [GETTING_STARTED.md](GETTING_STARTED.md) - New user guide
- [USER_GUIDE.md](USER_GUIDE.md) - Complete user manual
