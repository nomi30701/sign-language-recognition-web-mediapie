# ✋ Sing Language recognition with MediaPipe browser

<div align="center">
<img src="https://github.com/nomi30701/sign-language-recognition-web-mediapie/blob/main/preview.png" width="70%">
</div>

## 📝 Description
This browser-based hand gesture recognition application uses MediaPipe to detect and classify hand gestures in real-time. No installation required - everything runs directly in your web browser! The application includes three specialized models for different use cases:
1. General Gestures: MediaPipe's default gesture recognition model
2. Rock-Paper-Scissors: Custom model trained with MediaPipe Model Maker
3. Sign Language: Custom model trained with MediaPipe Model Maker for sign language detection

## 📊 Data Sources
- Sign Language Model: Trained on the [Sign Language MNIST dataset](https://www.kaggle.com/datasets/datamunge/sign-language-mnist/data), which contains numerous labeled images of American Sign Language letters
- Rock-Paper-Scissors Model: Developed and trained following the (official MediaPipe tutorial)[https://ai.google.dev/edge/mediapipe/solutions/customization/gesture_recognizer]

## 🤟 Sign Language Reference Chart
<div align="center"> <img src="https://github.com/nomi30701/sign-language-recognition-web-mediapie/blob/main/sign_language_example.png" width="70%" alt="Sign Language Reference Chart"> </div>

## ✨ Features
- 🖐️ Real-time hand gesture recognition
- 📷 Webcam support for live detection
- 🖼️ Image upload for static detection
- 🔄 Multiple specialized models to choose from:
    - ✌️ Rock-Paper-Scissors recognition
    - 👋 Sign language interpretation
    - 👆 General hand gesture detection
- 🚀 WebGL (GPU) acceleration for faster processing
- 💻 Wasm (CPU) support for wider device compatibility
- 📊 Detailed detection results with confidence scores
- 📱 Responsive design for mobile and desktop devices

## 🛠️ Technology Stack
- ⚛️ React.js - UI framework
- 📱 MediaPipe - Google's ML solution for vision tasks
- 🔧 MediaPipe Model Maker - For custom model training
- 🎨 TailwindCSS - Styling

## 🔧 Installation & Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/hand-detection.git

# Navigate to project directory
cd hand-detection

# Install dependencies
npm install

# Start development server
npm run dev
```