from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import base64
from PIL import Image
import io

app = Flask(__name__)
# Enable CORS so Next.js (localhost:3000) can talk to this server (localhost:5000)
CORS(app)

print("Loading GPU Model... Please wait...")
# Load the custom trained model
try:
    model = tf.keras.models.load_model('best_massive_waste_model.keras')
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# The 7 exact categories from the new massive dataset
CLASS_NAMES = ['glass', 'hard_waste', 'liquid_waste', 'metal', 'non_organic_waste', 'organic_waste', 'plastic']

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        # The image comes as a base64 string from the webcam
        base64_img = data['image']
        
        # Strip the data:image/jpeg;base64, prefix if present
        if ',' in base64_img:
            base64_img = base64_img.split(',')[1]

        # Decode base64 to image
        img_data = base64.b64decode(base64_img)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        
        # Resize to match the 224x224 input size used during training
        img = img.resize((224, 224))
        
        # Convert image to numpy array
        img_array = tf.keras.utils.img_to_array(img)
        img_array = tf.expand_dims(img_array, 0) # Create a batch of 1

        # Predict using the GPU model
        predictions = model.predict(img_array)
        score = predictions[0] # Removed double softmax bug
        
        class_idx = np.argmax(score)
        predicted_class = CLASS_NAMES[class_idx]
        confidence = float(np.max(score))

        return jsonify({
            'className': predicted_class,
            'probability': confidence
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Ecowaste Custom GPU Server on port 5000...")
    app.run(host='0.0.0.0', port=5000)
