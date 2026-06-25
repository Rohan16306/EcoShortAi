import sys
from unittest.mock import MagicMock

# The tensorflowjs converter has a known bug on Windows where it tries to load 
# Linux C++ files from tensorflow_decision_forests. This mocks it to bypass the crash.
sys.modules['tensorflow_decision_forests'] = MagicMock()

import tensorflowjs as tfjs
import tensorflow as tf
import os

print("Bypassing Windows converter bug...")

try:
    # ─── TRUTH MODE: Convert the BEST model, not the old one ───
    # best_massive_waste_model.keras = 25MB, fine-tuned with Phase 2
    # custom_waste_model.h5 = 11MB, old model (DO NOT USE)
    model_path = 'best_massive_waste_model.keras'
    
    print(f"Loading custom trained model: {model_path}...")
    model = tf.keras.models.load_model(model_path)
    
    # Print model summary for verification
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
    print(f"Number of classes: {model.output_shape[-1]}")
    
    out_dir = '../frontend-next/public/model'
    os.makedirs(out_dir, exist_ok=True)
    
    # ─── Quantization: Shrink from ~25MB to ~6MB ───
    # uint8 quantization reduces weights from float32 (4 bytes) to uint8 (1 byte)
    # This is critical for mobile/browser loading on slow networks.
    # Accuracy loss is typically < 1% for MobileNetV2 architectures.
    print("Converting to Web format with uint8 quantization...")
    tfjs.converters.save_keras_model(
        model, 
        out_dir,
        quantization_dtype_map={'uint8': '*'}
    )
    
    # Calculate output size
    total_size = 0
    for f in os.listdir(out_dir):
        fpath = os.path.join(out_dir, f)
        if os.path.isfile(fpath):
            total_size += os.path.getsize(fpath)
    
    print(f"SUCCESS: Web model saved to {out_dir}")
    print(f"Total model size: {total_size / (1024*1024):.1f} MB")
    print(f"Original model size: {os.path.getsize(model_path) / (1024*1024):.1f} MB")
    print(f"Compression ratio: {os.path.getsize(model_path) / total_size:.1f}x smaller")
    
except Exception as e:
    print(f"Error during conversion: {e}")
    print("\nIf tensorflowjs is not installed, run:")
    print("  pip install tensorflowjs")
