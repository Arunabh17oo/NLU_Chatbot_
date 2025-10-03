# NLU Chatbot with HuggingFace Integration

A comprehensive full-stack chatbot application with AI-powered intent recognition using HuggingFace models. Features advanced model evaluation, versioning, and comparison capabilities for production-ready AI model management.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/signup with JWT tokens
- **Role-Based Access Control**: Admin and user roles with approval workflow
- **Workspace Management**: Create and manage multiple workspaces
- **JSON to YAML Conversion**: Automatic conversion of training data
- **HuggingFace Integration**: Train models and predict intents
- **Real-time Predictions**: Get intent suggestions with confidence scores

### Advanced AI Features (Milestone 3 - COMPLETED ✅)
- **Model Evaluation**: Comprehensive performance metrics (accuracy, F1 score, precision, recall)
- **Visual Metrics Dashboard**: Interactive confusion matrix and performance charts
- **Holdout Evaluation**: Automatic test set evaluation with configurable ratios
- **Model Versioning**: Track and manage different model versions
- **Model Comparison**: Compare multiple model versions side-by-side
- **Export Functionality**: Export trained models, predictions, and evaluation results
- **Performance Analytics**: Detailed statistics and trend analysis

### Advanced Enterprise Features (NEW - Milestone 4 - COMPLETED ✅)
- **Admin Panel**: Comprehensive admin dashboard for user, dataset, and project management
- **User Approval System**: Admin approval required for new user registrations
- **Feedback Module**: User correction system with feedback tracking and review workflow
- **Active Learning Dashboard**: Uncertain sample management with annotation and retraining
- **Role-Based Security**: Separate admin and user interfaces with proper access control
- **Dataset Management**: Advanced dataset organization and management
- **Project Management**: Project-based organization with collaboration features

### User Interface
- **Modern UI**: Beautiful, responsive interface with React
- **Tabbed Interface**: Organized workflow with Training, Evaluation, and Versioning tabs
- **Interactive Dashboards**: Real-time metrics visualization
- **Mobile Responsive**: Optimized for all device sizes

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- HuggingFace account with API key

## 🛠️ Installation & Setup

### Step 1: Clone and Navigate to Project
```bash
cd /Users/smacair/Desktop/NLU_Chatbot
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
```bash
cd chatbot-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`:**
```env
PORT=3001
MONGO_URI=mongodb+srv://arunabh17oo:Test123@chatbot.vsreuo6.mongodb.net/?retryWrites=true&w=majority&appName=Chatbot
JWT_SECRET=Hello
CLIENT_URL=http://localhost:5173

# HuggingFace Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL_NAME=microsoft/DialoGPT-medium
```

5. **Get HuggingFace API Key:**
   - Go to [HuggingFace](https://huggingface.co/settings/tokens)
   - Create a new token
   - Replace `your_huggingface_api_key_here` with your actual API key

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../chatbot-frontend
```

2. **Install dependencies:**
```bash
npm install
```

### Step 4: Create Uploads Directory
```bash
cd ../chatbot-backend
mkdir uploads
```

### Step 5: Create Admin User
```bash
# Set admin credentials in .env (optional)
echo "ADMIN_EMAIL=admin@chatbot.com" >> .env
echo "ADMIN_PASSWORD=admin123" >> .env
echo "ADMIN_USERNAME=admin" >> .env

# Create the admin user
npm run create-admin
```

## 🚀 Running the Application

### Terminal 1: Start Backend Server
```bash
cd chatbot-backend
npm run dev
```
The backend will start on `http://localhost:3001`

### Terminal 2: Start Frontend Server
```bash
cd chatbot-frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

## 📖 How to Use

### 1. **Authentication**
- Open `http://localhost:5173`
- Sign up for a new account or login
- You'll be redirected to the workspace

### 2. **Create Workspace**
- Click "Create New Workspace" 
- Enter a workspace name
- Click "Create"

### 3. **Upload Training Data**
- Select a workspace (click on it)
- Upload a JSON file with training data
- Format example:
```json
[
  {
    "text": "I want to book a table for dinner",
    "intent": "book_table"
  },
  {
    "text": "Can I reserve a table for 4 people?",
    "intent": "book_table"
  }
]
```

### 4. **Train Model**
- After uploading JSON data, click "Train Model"
- Wait for training to complete
- You'll see success message with number of intents

### 5. **Predict Intents**
- Type text in the "AI Intent Prediction" textarea
- Click "Predict Intent"
- View the predicted intent with confidence score

### 6. **Admin Panel (Admin Users Only)**
- Login with admin credentials
- Access the Admin Panel from the workspace
- Manage users, datasets, and projects
- Approve/reject new user registrations
- Monitor system statistics

### 7. **Feedback System**
- Submit corrections for incorrect predictions
- View your feedback history and status
- Track which corrections have been applied

### 8. **Active Learning**
- Review uncertain samples that need annotation
- Annotate samples with correct intents
- Batch process multiple samples
- Monitor retraining progress

## 📁 Project Structure

```
NLU_Chatbot/
├── chatbot-backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   └── training.js
│   │   ├── services/
│   │   │   └── huggingfaceService.js
│   │   ├── utils/
│   │   │   └── jsonToYaml.js
│   │   └── index.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── chatbot-frontend/
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Workspace.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── sample-training-data.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Training & Prediction
- `POST /api/training/upload-and-train` - Upload JSON and train model
- `POST /api/training/predict` - Predict intent for text
- `GET /api/training/model-info/:workspaceId` - Get model information
- `GET /api/training/models` - List all trained models
- `DELETE /api/training/model/:workspaceId` - Delete trained model

### Chat
- `POST /api/chat/ask` - Chat with bot (protected)

### Evaluation (NEW - Milestone 3)
- `POST /api/evaluation/evaluate` - Evaluate model on test data
- `POST /api/evaluation/evaluate-holdout` - Holdout evaluation
- `GET /api/evaluation/results/:evaluationId` - Get evaluation results
- `GET /api/evaluation/workspace/:workspaceId` - Get workspace evaluations
- `POST /api/evaluation/compare` - Compare evaluations
- `GET /api/evaluation/export/:evaluationId` - Export evaluation

### Model Versioning (NEW - Milestone 3)
- `GET /api/model-versioning/versions/:workspaceId` - Get model versions
- `GET /api/model-versioning/active/:workspaceId` - Get active version
- `POST /api/model-versioning/create` - Create new version
- `PUT /api/model-versioning/version/:versionId` - Update version
- `POST /api/model-versioning/compare` - Compare versions
- `DELETE /api/model-versioning/version/:versionId` - Delete version
- `GET /api/model-versioning/export/:versionId` - Export version
- `GET /api/model-versioning/statistics` - Get versioning statistics

### Admin Management (NEW - Milestone 4)
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:userId/approve` - Approve/reject user (admin only)
- `PUT /api/auth/users/:userId/role` - Update user role (admin only)
- `DELETE /api/auth/users/:userId` - Delete user (admin only)
- `GET /api/admin/dashboard` - Get admin dashboard statistics
- `GET /api/admin/datasets` - Get all datasets (admin only)
- `GET /api/admin/projects` - Get all projects (admin only)

### Feedback System (NEW - Milestone 4)
- `POST /api/feedback/submit` - Submit user feedback
- `GET /api/feedback/user` - Get user's feedback
- `GET /api/feedback/admin` - Get all feedback (admin only)
- `PUT /api/feedback/:feedbackId/review` - Review feedback (admin only)
- `PUT /api/feedback/:feedbackId/retrain` - Mark feedback as retrained
- `GET /api/feedback/stats` - Get feedback statistics

### Active Learning (NEW - Milestone 4)
- `POST /api/active-learning/add-uncertain` - Add uncertain sample
- `GET /api/active-learning/queue` - Get uncertain samples queue
- `PUT /api/active-learning/:sampleId/annotate` - Annotate uncertain sample
- `POST /api/active-learning/batch-annotate` - Batch annotate samples
- `PUT /api/active-learning/:sampleId/retrain` - Mark sample as retrained
- `DELETE /api/active-learning/:sampleId` - Delete uncertain sample
- `GET /api/active-learning/stats` - Get active learning statistics

## 📝 Sample Training Data

Use the provided `sample-training-data.json` file as an example. It contains various intents like:
- `book_table` - Restaurant reservations
- `book_flight` - Flight bookings
- `book_hotel` - Hotel reservations
- `book_taxi` - Taxi bookings
- `check_weather` - Weather queries
- `food_order` - Food ordering
- `business_hours` - Business hours queries
- `complaint` - Customer complaints

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Check your MongoDB URI in `.env`
   - Ensure MongoDB Atlas cluster is running

2. **HuggingFace API Error**
   - Verify your API key is correct
   - Check if you have sufficient API credits

3. **File Upload Issues**
   - Ensure uploads directory exists
   - Check file size (max 10MB)
   - Verify JSON format is valid

4. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes: `lsof -ti:3001 | xargs kill`

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Implement rate limiting for API endpoints
- Validate all user inputs

## 🚀 Production Deployment

1. **Environment Variables**: Set production values
2. **Database**: Use production MongoDB cluster
3. **Security**: Enable HTTPS, CORS, and security headers
4. **Monitoring**: Add logging and error tracking
5. **Scaling**: Use PM2 or Docker for process management

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all dependencies are installed
3. Ensure all environment variables are set
4. Check console logs for error messages

---

**Happy Chatbot Building! 🤖✨**
