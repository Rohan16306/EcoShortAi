import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# ==========================================
# 1. Environment & Setup
# ==========================================
print("Setting up GPU and Mixed Precision...")
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        # Use the primary GPU
        tf.config.set_visible_devices(gpus[0], 'GPU')
        tf.config.experimental.set_memory_growth(gpus[0], True)
        print(f"Using GPU: {gpus[0].name}")
    except RuntimeError as e:
        print(e)
else:
    print("No GPU found. Training will fall back to CPU.")

# Enable Mixed Precision (mixed_float16) to leverage Tensor Cores
# This significantly speeds up training and reduces VRAM usage on modern NVIDIA GPUs
policy = tf.keras.mixed_precision.Policy('mixed_float16')
tf.keras.mixed_precision.set_global_policy(policy)
print(f"Compute dtype: {policy.compute_dtype}")
print(f"Variable dtype: {policy.variable_dtype}")

# ==========================================
# 2. Data Loading & Preprocessing
# ==========================================
# Correct path to where the actual image classes reside
dataset_path = 'd:/Codes/Vs Code/Ecowaste b/archive/Garbage classification/Garbage classification'
batch_size = 128
img_size = (224, 224)

print(f"\nLoading dataset from: {dataset_path}")
# Load Training Dataset (80%) - unbatched for mapping
train_dataset = tf.keras.utils.image_dataset_from_directory(
    dataset_path,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=img_size,
    batch_size=None,
    label_mode='int'
)

# Load Validation Dataset (20%) - unbatched
val_dataset = tf.keras.utils.image_dataset_from_directory(
    dataset_path,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=img_size,
    batch_size=None,
    label_mode='int'
)

class_names = train_dataset.class_names if hasattr(train_dataset, 'class_names') else []
if not class_names:
    # When batch_size=None, class_names might not be exposed on the dataset object directly 
    # depending on TF version. We can get them from the directory.
    class_names = sorted(os.listdir(dataset_path))

num_classes = len(class_names)
print(f"Found {num_classes} classes: {class_names}")

# ==========================================
# 3. Class Imbalance Handling
# ==========================================
print("\nCalculating class weights to handle dataset imbalance...")
# We iterate over the dataset folder to count images per class
labels = []
for i, class_name in enumerate(class_names):
    class_dir = os.path.join(dataset_path, class_name)
    if os.path.isdir(class_dir):
        num_images = len(os.listdir(class_dir))
        labels.extend([i] * num_images)

class_weights_array = compute_class_weight('balanced', classes=np.unique(labels), y=labels)
class_weights_dict = {i: float(weight) for i, weight in enumerate(class_weights_array)}
print(f"Class Weights: {class_weights_dict}")

# ==========================================
# 4. Advanced Data Augmentation ("Truth Mode")
# ==========================================
# We use pure tf.image functions for mapping to avoid potential Keras layer GPU bugs in the data pipeline.
# Note: To handle non-rigid objects (e.g., squished plastic bottles), 
# elastic deformations (via tfa.image.dense_image_warp) could be added here in the future.

def augment_image(image, label):
    # 1. Geometric: Random horizontal flip
    image = tf.image.random_flip_left_right(image)
    
    # 2. Geometric & Scale: Random zoom/crop
    # We crop the image to a random size (e.g., 200x200) and resize back to 224x224
    image = tf.image.random_crop(image, size=[200, 200, 3])
    image = tf.image.resize(image, size=[224, 224])
    
    # 3. Appearance: Random brightness and contrast
    image = tf.image.random_brightness(image, max_delta=0.2)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    
    # Ensure values remain valid
    image = tf.clip_by_value(image, 0.0, 255.0)
    
    return image, label

AUTOTUNE = tf.data.AUTOTUNE

# Apply augmentation only to the training set
train_dataset = train_dataset.map(augment_image, num_parallel_calls=AUTOTUNE)

# Apply MobileNetV2 preprocessing to both train and val sets
def preprocess(image, label):
    # MobileNetV2 expects inputs in the range [-1, 1]
    return preprocess_input(image), label

train_dataset = train_dataset.map(preprocess, num_parallel_calls=AUTOTUNE)
val_dataset = val_dataset.map(preprocess, num_parallel_calls=AUTOTUNE)

# Optimize pipeline with caching, batching, and prefetching
train_dataset = train_dataset.cache().shuffle(buffer_size=1000).batch(batch_size).prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.cache().batch(batch_size).prefetch(buffer_size=AUTOTUNE)

# ==========================================
# 5. Model Architecture (Transfer Learning)
# ==========================================
print("\nBuilding the model architecture...")
# Base model: MobileNetV2 pre-trained on ImageNet
base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze the base model for Phase 1
base_model.trainable = False

# Create the custom classification head
inputs = tf.keras.Input(shape=(224, 224, 3))
x = base_model(inputs, training=False) # Ensure batchnorm stays in inference mode
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.5)(x) # Regularization to prevent overfitting
# CRITICAL: Final layer must be float32 for mixed precision stability
outputs = Dense(num_classes, activation='softmax', dtype='float32')(x)

model = Model(inputs, outputs)
model.summary()

# ==========================================
# 6. Callbacks Configuration
# ==========================================
checkpoint_cb = ModelCheckpoint(
    "massive_waste_model_best.keras",
    save_best_only=True,
    monitor="val_accuracy",
    mode="max",
    verbose=1
)

early_stopping_cb = EarlyStopping(
    patience=8,
    restore_best_weights=True,
    monitor="val_accuracy",
    mode="max",
    verbose=1
)

reduce_lr_cb = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

callbacks = [checkpoint_cb, early_stopping_cb, reduce_lr_cb]

# ==========================================
# 7. Training Strategy: Phase 1 (Feature Extraction)
# ==========================================
print("\n--- Phase 1: Feature Extraction (Frozen Base) ---")
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Train only the custom top layers
history_phase1 = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=15,
    class_weight=class_weights_dict,
    callbacks=callbacks
)

# ==========================================
# 8. Training Strategy: Phase 2 (Fine-Tuning)
# ==========================================
print("\n--- Phase 2: Fine-Tuning (Unfrozen Base) ---")
# Unfreeze the top layers of the base model (from layer 100 onwards)
base_model.trainable = True
for layer in base_model.layers[:100]:
    layer.trainable = False

# Recompile with a VERY LOW learning rate to prevent catastrophic forgetting
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history_phase2 = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=15, 
    class_weight=class_weights_dict,
    callbacks=callbacks
)

# ==========================================
# 9. Save Final Model
# ==========================================
print("\nTraining complete. Saving the final model...")
model.save("massive_waste_model_final.keras")
print("Model saved as 'massive_waste_model_final.keras' and best weights as 'massive_waste_model_best.keras'.")
