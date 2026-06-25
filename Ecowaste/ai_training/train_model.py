import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, RandomFlip, RandomRotation, RandomZoom, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import os
import numpy as np

# Hide Intel iGPU (Adapter 1) to force RTX 4050 (Adapter 0)
gpus = tf.config.list_physical_devices('GPU')
if len(gpus) > 1:
    tf.config.set_visible_devices(gpus[0], 'GPU')

# --- RTX 4050 OPTIMIZATION ---
# Enable Mixed Precision to use Tensor Cores (Trains faster, uses 50% less VRAM)
policy = tf.keras.mixed_precision.Policy('mixed_float16')
tf.keras.mixed_precision.set_global_policy(policy)
print(f"Compute dtype: {policy.compute_dtype}")
print(f"Variable dtype: {policy.variable_dtype}")

# 1. Load the Dataset
# Change this to point to the new massive dataset directory
dataset_path = './dataset/garbage_classification'

# For a massive dataset on a 6GB VRAM card with mixed precision, a batch size of 128 or 256 is better to fully utilize GPU
batch_size = 128
img_size = (224, 224)

print("Loading dataset...")
# shuffle=False avoids a DirectML bug where duplicate Equal kernels crash on seed comparison
train_dataset = tf.keras.utils.image_dataset_from_directory(
    dataset_path,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=img_size,
    batch_size=batch_size,
    shuffle=False
)
class_names = train_dataset.class_names
train_dataset = train_dataset.shuffle(buffer_size=1000)

val_dataset = tf.keras.utils.image_dataset_from_directory(
    dataset_path,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=img_size,
    batch_size=batch_size,
    shuffle=False
)

print(f"Classes detected ({len(class_names)}): {class_names}")

# --- DATA AUGMENTATION ---
# Prevents overfitting on huge datasets
# We force this to run entirely on the CPU dataset pipeline to bypass DirectML GPU kernel bugs!
# We use pure tf.image functions because Keras Random layers create Variables 
# that trigger a fatal DirectML AssignVariableOp GPU crash.
def augment_image(image, label):
    image = tf.image.random_flip_left_right(image)
    image = tf.image.random_brightness(image, max_delta=0.2)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    # Add slight random crop and resize to make AI robust to different angles (Truth Mode)
    image = tf.image.resize(tf.image.random_crop(image, size=[200, 200, 3]), [224, 224])
    return image, label

AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.unbatch().map(augment_image, num_parallel_calls=AUTOTUNE).batch(batch_size)

# 2. Build the Custom Model (Transfer Learning)
base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False # Freeze base model initially

# Apply augmentations to inputs
inputs = tf.keras.Input(shape=(224, 224, 3))
# (Augmentation is now safely handled on the CPU before it reaches the GPU model)
x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs) # MobileNetV2 specific preprocessing
x = base_model(x, training=False)
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.5)(x) # Help prevent overfitting

# Using float32 for final layer is required when using mixed precision
predictions = Dense(len(class_names), activation='softmax', dtype='float32')(x)

model = Model(inputs=inputs, outputs=predictions)

# 3. Compile and Train
# Using Adam optimizer
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# --- CHECKPOINTS & EARLY STOPPING ---
# Ensure we don't lose days of training if it crashes
callbacks = [
    ModelCheckpoint('best_massive_waste_model.keras', save_best_only=True, monitor='val_accuracy'),
    ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6),
    EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True)
]

# Calculate Class Weights to handle dataset imbalances (Truth Mode)
class_weights = {}
total_samples = 0
for i, class_name in enumerate(class_names):
    class_dir = os.path.join(dataset_path, class_name)
    if os.path.exists(class_dir):
        num_samples = len(os.listdir(class_dir))
        class_weights[i] = num_samples
        total_samples += num_samples

num_classes = len(class_names)
if total_samples > 0:
    for i in class_weights.keys():
        if class_weights[i] > 0:
            class_weights[i] = (1 / class_weights[i]) * (total_samples / num_classes)
        else:
            class_weights[i] = 0.0
else:
    class_weights = None

print("Starting Highly Optimized GPU Training for RTX 4050...")
# Prefetching to keep GPU busy
AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.prefetch(buffer_size=AUTOTUNE)

# Phase 1: Train Top Layers
print("Starting Phase 1: Training Top Layers...")
model.fit(train_dataset, validation_data=val_dataset, epochs=50, callbacks=callbacks, class_weight=class_weights)

# Phase 2: Truth Mode Fine-Tuning
print("Starting Phase 2: Fine-Tuning base model layers (Truth Mode)...")
# Unfreeze the top 30 layers of the base model to adapt specific edge-detection to waste
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

# Recompile with a microscopically low learning rate to prevent catastrophic forgetting
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Train for another 20 epochs with early stopping to cement 'Truth Mode' knowledge
model.fit(train_dataset, validation_data=val_dataset, epochs=20, callbacks=callbacks, class_weight=class_weights)

# 4. Save the trained Keras model
model.save('massive_waste_model_final.h5')
print("Model saved successfully as massive_waste_model_final.h5 and best_massive_waste_model.keras!")
