# AtalCloud Notes App

A full-stack notes management application built with React, AWS Amplify, and modern web technologies.

## Features

- 🔐 **User Authentication** - Secure email-based authentication with AWS Cognito
- 📝 **CRUD Operations** - Create, Read, Update, Delete notes
- 📎 **File Attachments** - Upload and attach images to notes
- ✅ **Bulk Operations** - Select multiple notes for batch deletion
- ✏️ **Edit Mode** - Update existing notes with pre-filled forms
- 🎨 **Modern UI** - Clean, responsive design with table layout
- 🔒 **User Isolation** - Each user can only see their own notes
- 📱 **Mobile Friendly** - Responsive design works on all devices

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **AWS Amplify UI** - Pre-built authentication components

### Backend
- **AWS Amplify** - Full-stack development platform
- **Amazon DynamoDB** - NoSQL database for notes storage
- **Amazon Cognito** - User authentication and authorization
- **Amazon S3** - File storage for attachments
- **AWS AppSync** - GraphQL API for data operations

## Project Structure

```
notesapp/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   └── main.jsx         # Application entry point
├── amplify/
│   ├── auth/
│   │   └── resource.ts  # Authentication configuration
│   ├── data/
│   │   └── resource.ts  # Database schema and API
│   ├── storage/
│   │   └── resource.ts  # File storage configuration
│   └── backend.ts       # Backend resource definitions
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- AWS Account with appropriate permissions
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ranjitbatra/notesapp.git
   cd notesapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS credentials**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and region
   ```

4. **Bootstrap CDK (if not done already)**
   ```bash
   npx cdk bootstrap
   ```

5. **Deploy the backend**
   ```bash
   npx ampx sandbox
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## Usage

### Creating Notes
1. Fill in the note name and description
2. Optionally attach an image file
3. Click "Create Note"

### Managing Notes
- **View**: All your notes are displayed in a table format
- **Select**: Use checkboxes to select one or multiple notes
- **Update**: Select exactly one note and click "Update Selected Note"
- **Delete**: Select notes and click "Delete Selected Notes" for bulk deletion
- **File Access**: Click on attached images to view them in full size

### Authentication
- Sign up with your email address
- Verify your email if prompted
- Sign in to access your personal notes
- Sign out when finished

## Deployment

### Development Environment
The app runs in sandbox mode for development and testing.

### Production Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Amplify Hosting**
   ```bash
   npx ampx generate outputs --app-id <your-app-id> --branch main
   ```

## Resource Management

### Clean Up Resources
To delete all AWS resources:
```bash
npx ampx sandbox delete
```

### Recreate Resources
To recreate the backend:
```bash
npx ampx sandbox
```

## Cost Information

### AWS Free Tier (12 months)
- **Amazon Cognito**: 50,000 MAUs - FREE
- **DynamoDB**: 25 GB storage + 25 RCU/WCU - FREE
- **S3**: 5 GB storage + 20,000 GET requests - FREE
- **AppSync**: 250,000 requests/month - FREE

For typical usage, the app should remain within free tier limits.

## Industry Applications

This notes app can be adapted for various industries:

- **Healthcare**: Patient records and medical notes
- **Education**: Student assignments and lesson plans
- **Legal**: Case notes and document management
- **Real Estate**: Property inspection reports
- **Consulting**: Client project documentation
- **Manufacturing**: Quality control reports
- **Field Services**: Service call documentation
- **Research**: Experiment documentation

## Security Features

- **User Authentication**: AWS Cognito handles secure authentication
- **Data Isolation**: Users can only access their own notes
- **File Security**: S3 storage with user-specific access controls
- **API Security**: GraphQL API with owner-based authorization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check AWS Amplify documentation: https://docs.amplify.aws/
- Review AWS pricing: https://calculator.aws/

## Acknowledgments

- AWS Amplify team for the excellent development platform
- React team for the powerful frontend framework
- Vite team for the fast build tool