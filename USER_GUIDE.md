# 🤖 NLU Chatbot - Complete User Guide

Welcome to your comprehensive NLU Chatbot application! This guide will walk you through every feature and how to use them effectively.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Features](#authentication-features)
3. [Workspace Management](#workspace-management)
4. [Training Tab Features](#training-tab-features)
5. [Evaluation Tab Features](#evaluation-tab-features)
6. [Versioning Tab Features](#versioning-tab-features)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Step 1: Start Your Application
1. **Open Terminal 1** - Start Backend:
   ```bash
   cd chatbot-backend
   npm run dev
   ```

2. **Open Terminal 2** - Start Frontend:
   ```bash
   cd chatbot-frontend
   npm run dev
   ```

3. **Open Browser**: Go to `http://localhost:5173`

---

## 🔐 Authentication Features

### 1. **User Registration**
- **Purpose**: Create a new account to access the chatbot
- **How to Use**:
  1. Click "Sign Up" on the login page
  2. Fill in:
     - **Username**: Your unique username
     - **Email**: Valid email address
     - **Password**: Strong password (min 6 characters)
  3. Click "Sign Up"
  4. You'll be automatically logged in

### 2. **User Login**
- **Purpose**: Access your existing account
- **How to Use**:
  1. Enter your email and password
  2. Click "Login"
  3. You'll be redirected to the workspace

### 3. **Password Visibility Toggle**
- **Purpose**: Show/hide password while typing
- **How to Use**: Click the eye icon next to the password field

---

## 🏢 Workspace Management

### 1. **Create New Workspace**
- **Purpose**: Organize your chatbot projects
- **How to Use**:
  1. Click "Create New Workspace" button
  2. Enter a descriptive workspace name (e.g., "Restaurant Bot", "Customer Support")
  3. Click "Create"
  4. Your workspace appears in the sidebar

### 2. **Select Workspace**
- **Purpose**: Switch between different chatbot projects
- **How to Use**: Click on any workspace name in the sidebar
- **Visual Indicator**: Selected workspace is highlighted

### 3. **Workspace Information**
- **Purpose**: View details about your current workspace
- **What You See**:
  - Workspace name
  - Number of training samples
  - Number of intents
  - Model status (trained/not trained)

---

## 🎯 Training Tab Features

### 1. **Upload Training Data**
- **Purpose**: Provide data to train your chatbot
- **Supported Format**: JSON file
- **How to Use**:
  1. Click "Choose File" button
  2. Select your JSON training file
  3. Click "Upload Data"
  4. Wait for processing confirmation

#### **Training Data Format**:
```json
[
  {
    "text": "I want to book a table for dinner",
    "intent": "book_table"
  },
  {
    "text": "Can I reserve a table for 4 people?",
    "intent": "book_table"
  },
  {
    "text": "What's the weather like today?",
    "intent": "check_weather"
  }
]
```

### 2. **Train Model**
- **Purpose**: Create an AI model from your training data
- **How to Use**:
  1. Ensure training data is uploaded
  2. Click "Train Model" button
  3. Wait for training to complete (shows progress)
  4. View success message with number of intents learned

### 3. **AI Intent Prediction**
- **Purpose**: Test your trained model with new text
- **How to Use**:
  1. Type any text in the textarea
  2. Click "Predict Intent"
  3. View results:
     - **Predicted Intent**: The AI's guess
     - **Confidence Score**: How sure the AI is (0-100%)

### 4. **Model Information Display**
- **Purpose**: View details about your trained model
- **What You See**:
  - Number of training samples
  - Number of unique intents
  - Model training status
  - Last training date

---

## 📊 Evaluation Tab Features

### 1. **Upload Test Data**
- **Purpose**: Evaluate your model's performance on new data
- **How to Use**:
  1. Click "Choose Test File"
  2. Select a JSON file with test data (same format as training)
  3. Click "Evaluate Model"
  4. View comprehensive evaluation results

### 2. **Holdout Evaluation**
- **Purpose**: Automatically split your training data for testing
- **How to Use**:
  1. Set holdout ratio (default: 20%)
  2. Click "Evaluate Holdout"
  3. System automatically splits data and evaluates

### 3. **Performance Metrics**
- **Purpose**: Understand how well your model performs
- **Metrics Displayed**:
  - **Accuracy**: Overall correctness percentage
  - **F1 Score**: Balanced measure of precision and recall
  - **Precision**: How many predicted positives were correct
  - **Recall**: How many actual positives were found

### 4. **Confusion Matrix**
- **Purpose**: Visual representation of prediction accuracy
- **How to Read**:
  - **Rows**: Actual intents
  - **Columns**: Predicted intents
  - **Diagonal**: Correct predictions
  - **Off-diagonal**: Misclassifications

### 5. **Evaluation History**
- **Purpose**: Track all your model evaluations
- **Features**:
  - View all past evaluations
  - Compare different evaluations
  - Export evaluation results
  - Delete old evaluations

### 6. **Evaluation Comparison**
- **Purpose**: Compare multiple evaluation results
- **How to Use**:
  1. Select multiple evaluations from history
  2. Click "Compare" button
  3. View side-by-side comparison
  4. See which model performs better

---

## 🔄 Versioning Tab Features

### 1. **Version Statistics**
- **Purpose**: Overview of your model versions
- **Statistics Shown**:
  - Total number of versions
  - Active version
  - Average performance
  - Last updated

### 2. **Create New Version**
- **Purpose**: Save a new version of your model
- **How to Use**:
  1. Click "Create New Version"
  2. Fill in:
     - **Description**: What changed in this version
     - **Tags**: Keywords for organization (comma-separated)
  3. Click "Create Version"
  4. New version appears in the list

### 3. **Version Management**
- **Purpose**: Organize and manage your model versions
- **Features**:
  - **View All Versions**: See complete version history
  - **Active Status**: See which version is currently active
  - **Version Details**: Description, tags, creation date
  - **Performance Metrics**: Each version's evaluation results

### 4. **Version Comparison**
- **Purpose**: Compare different model versions
- **How to Use**:
  1. Select multiple versions
  2. Click "Compare Versions"
  3. View detailed comparison:
     - Performance metrics
     - Feature differences
     - Recommendations

### 5. **Export Versions**
- **Purpose**: Download model versions for external use
- **How to Use**:
  1. Select a version
  2. Click "Export" button
  3. Download includes:
     - Model files
     - Configuration
     - Performance metrics
     - Metadata

### 6. **Delete Versions**
- **Purpose**: Remove old or unwanted versions
- **How to Use**:
  1. Select version to delete
  2. Click "Delete" button
  3. Confirm deletion
  - **Note**: Cannot delete active version

---

## 🎨 Advanced Features

### 1. **Tab Navigation**
- **Purpose**: Switch between different functionalities
- **Tabs Available**:
  - **Training**: Upload data and train models
  - **Evaluation**: Test and analyze model performance
  - **Versioning**: Manage model versions

### 2. **Real-time Updates**
- **Purpose**: See changes immediately
- **Features**:
  - Live progress indicators
  - Automatic data refresh
  - Real-time status updates

### 3. **Responsive Design**
- **Purpose**: Works on all devices
- **Features**:
  - Mobile-friendly interface
  - Tablet optimization
  - Desktop enhancement

### 4. **Error Handling**
- **Purpose**: Graceful error management
- **Features**:
  - Clear error messages
  - Recovery suggestions
  - Automatic retry options

---

## 🔧 Troubleshooting

### Common Issues and Solutions:

#### 1. **"No Workspace Selected" Error**
- **Problem**: Trying to use features without selecting a workspace
- **Solution**: Click on a workspace in the sidebar first

#### 2. **Training Data Upload Fails**
- **Problem**: JSON file format is incorrect
- **Solution**: 
  - Check JSON syntax
  - Ensure each object has "text" and "intent" fields
  - Use valid JSON format

#### 3. **Model Training Stuck**
- **Problem**: Training process doesn't complete
- **Solution**:
  - Check HuggingFace API key
  - Verify internet connection
  - Try with smaller dataset

#### 4. **Evaluation Results Not Showing**
- **Problem**: Evaluation completes but no results appear
- **Solution**:
  - Refresh the page
  - Check browser console for errors
  - Try with different test data

#### 5. **Version Creation Fails**
- **Problem**: Cannot create new version
- **Solution**:
  - Ensure model is trained first
  - Check if workspace is selected
  - Verify description and tags are provided

---

## 💡 Pro Tips

### 1. **Training Data Quality**
- Use diverse, representative examples
- Include edge cases and variations
- Maintain consistent intent naming
- Aim for at least 10-20 examples per intent

### 2. **Evaluation Best Practices**
- Use holdout evaluation for quick testing
- Upload separate test data for final evaluation
- Compare multiple evaluations to track progress
- Export results for documentation

### 3. **Version Management**
- Create versions after significant improvements
- Use descriptive tags for easy organization
- Keep detailed descriptions of changes
- Regularly compare versions to identify best performers

### 4. **Performance Optimization**
- Start with smaller datasets for testing
- Gradually increase data size
- Monitor evaluation metrics closely
- Use comparison features to identify improvements

---

## 🎯 Use Case Examples

### 1. **Restaurant Chatbot**
- **Training Data**: Booking, menu, hours, complaints
- **Intents**: `book_table`, `menu_inquiry`, `hours`, `complaint`
- **Evaluation**: Test with customer service scenarios
- **Versioning**: Track improvements in booking accuracy

### 2. **Customer Support Bot**
- **Training Data**: Common questions, troubleshooting, account issues
- **Intents**: `account_help`, `technical_support`, `billing`, `general_info`
- **Evaluation**: Measure resolution accuracy
- **Versioning**: Track support quality improvements

### 3. **E-commerce Assistant**
- **Training Data**: Product inquiries, orders, returns, shipping
- **Intents**: `product_search`, `place_order`, `return_item`, `track_order`
- **Evaluation**: Test with real customer queries
- **Versioning**: Optimize for conversion rates

---

## 🚀 Next Steps

1. **Start Small**: Begin with a simple use case
2. **Iterate**: Continuously improve your training data
3. **Evaluate**: Regularly test and measure performance
4. **Version**: Track all improvements systematically
5. **Scale**: Expand to more complex scenarios

---

**Happy Chatbot Building! 🤖✨**

For technical support or questions, refer to the main README.md file or check the browser console for detailed error messages.
