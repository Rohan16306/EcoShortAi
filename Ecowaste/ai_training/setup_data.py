import os
import subprocess
import zipfile

# Instructions for downloading a massive 10GB+ dataset using Kaggle.
print("=========================================================")
print("  MASSIVE DATASET DOWNLOADER (Requires Kaggle API)       ")
print("=========================================================")
print("To download 10-12GB datasets, we use the Kaggle API.")
print("1. Ensure you have Kaggle installed: `pip install kaggle`")
print("2. Get your kaggle.json from Kaggle.com -> Settings -> Create New Token")
print("3. Place kaggle.json in ~/.kaggle/ (Linux/Mac) or C:\\Users\\<User>\\.kaggle\\ (Windows)")
print("=========================================================")

# A combination of datasets could be used to reach 10-12 GB, or one massive one.
# For example, "techsash/waste-classification-data" or combining multiple.
# We will use a placeholder command here, but you can swap the dataset ID.
# Suggestion: 'mostafaabla/garbage-classification' (12 classes) combined with 'feyzullahmurtaza/garbage-classification'
DATASETS = [
    "mostafaabla/garbage-classification", # Highly diverse 12 class dataset
    "techsash/waste-classification-data"  # Organic vs Recyclable massive dataset
]

extract_dir = "dataset"

if not os.path.exists(extract_dir):
    os.makedirs(extract_dir)

def download_and_extract(dataset_id):
    zip_name = f"{dataset_id.split('/')[1]}.zip"
    
    print(f"\nAttempting to download {dataset_id}...")
    try:
        # Run kaggle command
        subprocess.run(["python", "-m", "kaggle", "datasets", "download", "-d", dataset_id, "-p", "."], check=True)
        print("Download successful. Extracting...")
        
        if os.path.exists(zip_name):
            with zipfile.ZipFile(zip_name, 'r') as zip_ref:
                # Extract directly into dataset folder
                zip_ref.extractall(extract_dir)
            print(f"Extracted {zip_name} into {extract_dir}.")
            os.remove(zip_name) # Cleanup
            print(f"Cleaned up {zip_name}.")
    except Exception as e:
        print(f"Failed to download or extract {dataset_id}. Ensure Kaggle API is configured correctly.")
        print(f"Error: {e}")

# Try to download the datasets
for dataset in DATASETS:
    download_and_extract(dataset)

print("\nSetup complete. Check the 'dataset' folder for the extracted images.")
print("Once you are satisfied with the dataset size, run train_model.py!")
