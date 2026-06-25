$ErrorActionPreference = "Stop"

$kagglePath = "C:\Users\Rohan\.kaggle\kaggle.json"
if (-Not (Test-Path $kagglePath)) {
    Write-Error "kaggle.json not found!"
}

Write-Host "Installing Kaggle CLI..."
python -m pip install kaggle

Write-Host "Downloading dataset from Kaggle..."
python -m kaggle datasets download -d mostafaabla/garbage-classification -p .\dataset\

Write-Host "Extracting dataset..."
$zipPath = ".\dataset\garbage-classification.zip"
$destPath = ".\dataset\raw_12_classes"

if (Test-Path $destPath) { Remove-Item -Recurse -Force $destPath }
Expand-Archive -Path $zipPath -DestinationPath $destPath -Force

Write-Host "Removing zip file..."
Remove-Item -Force $zipPath

Write-Host "Reorganizing into custom categories..."
$finalPath = ".\dataset\garbage_classification"
if (Test-Path $finalPath) { Remove-Item -Recurse -Force $finalPath }
New-Item -ItemType Directory -Path $finalPath | Out-Null

$categories = @(
    "organic_waste",
    "plastic",
    "metal",
    "glass",
    "hard_waste",
    "non_organic_waste",
    "liquid_waste"
)

foreach ($cat in $categories) {
    New-Item -ItemType Directory -Path "$finalPath\$cat" | Out-Null
}

$rawPath = "$destPath\garbage_classification" # Kaggle extracts it into this subfolder

Write-Host "Moving files..."
# 1. Organic Waste (biological)
if (Test-Path "$rawPath\biological") { Move-Item "$rawPath\biological\*" "$finalPath\organic_waste\" -Force }

# 2. Plastic (plastic)
if (Test-Path "$rawPath\plastic") { Move-Item "$rawPath\plastic\*" "$finalPath\plastic\" -Force }

# 3. Metal (metal)
if (Test-Path "$rawPath\metal") { Move-Item "$rawPath\metal\*" "$finalPath\metal\" -Force }

# 4. Glass (green-glass, brown-glass, white-glass)
if (Test-Path "$rawPath\green-glass") { Move-Item "$rawPath\green-glass\*" "$finalPath\glass\" -Force }
if (Test-Path "$rawPath\brown-glass") { Move-Item "$rawPath\brown-glass\*" "$finalPath\glass\" -Force }
if (Test-Path "$rawPath\white-glass") { Move-Item "$rawPath\white-glass\*" "$finalPath\glass\" -Force }

# 5. Hard Waste (batteries)
if (Test-Path "$rawPath\battery") { Move-Item "$rawPath\battery\*" "$finalPath\hard_waste\" -Force }
if (Test-Path "$rawPath\batteries") { Move-Item "$rawPath\batteries\*" "$finalPath\hard_waste\" -Force }

# 6. Non-Organic Waste (trash, paper, cardboard, clothes, shoes)
if (Test-Path "$rawPath\trash") { Move-Item "$rawPath\trash\*" "$finalPath\non_organic_waste\" -Force }
if (Test-Path "$rawPath\paper") { Move-Item "$rawPath\paper\*" "$finalPath\non_organic_waste\" -Force }
if (Test-Path "$rawPath\cardboard") { Move-Item "$rawPath\cardboard\*" "$finalPath\non_organic_waste\" -Force }
if (Test-Path "$rawPath\clothes") { Move-Item "$rawPath\clothes\*" "$finalPath\non_organic_waste\" -Force }
if (Test-Path "$rawPath\shoes") { Move-Item "$rawPath\shoes\*" "$finalPath\non_organic_waste\" -Force }

Write-Host "Cleaning up raw dataset folder..."
Remove-Item -Recurse -Force $destPath

Write-Host "Dataset setup complete!"
