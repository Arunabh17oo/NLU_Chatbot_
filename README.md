# NLU Chatbot with HuggingFace Integration

A full-stack chatbot application with AI-powered intent recognition using HuggingFace models. Users can upload JSON training data, convert it to YAML format, train models, and get intelligent intent predictions.

## 🚀 Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Workspace Management**: Create and manage multiple workspaces
- **JSON to YAML Conversion**: Automatic conversion of training data
- **HuggingFace Integration**: Train models and predict intents
- **Real-time Predictions**: Get intent suggestions with confidence scores
- **Modern UI**: Beautiful, responsive interface with React

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
