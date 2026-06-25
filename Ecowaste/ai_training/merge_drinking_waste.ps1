$ErrorActionPreference = "Stop"

Write-Host "Downloading Drinking Waste Classification dataset..."
python -m kaggle datasets download -d arkadiyhacks/drinking-waste-classification -p .\dataset\

Write-Host "Extracting dataset..."
$zipPath = ".\dataset\drinking-waste-classification.zip"
$destPath = ".\dataset\raw_drinking_waste"

# Wait 5 seconds to ensure Kaggle releases the file lock
Start-Sleep -Seconds 5

if (Test-Path $destPath) { Remove-Item -Recurse -Force $destPath }
Expand-Archive -Path $zipPath -DestinationPath $destPath -Force

Write-Host "Removing zip file..."
Remove-Item -Force $zipPath

Write-Host "Merging files into custom categories..."
$finalPath = ".\dataset\garbage_classification"
$rawPath = "$destPath" # Check exact structure, usually it extracts directly or inside a subfolder. Let's assume directly first.
# Wait, Kaggle zips sometimes have a subfolder, sometimes not.
# We will recursively search for the target directories just to be safe.

# 1. Aluminium Cans -> metal
$aluminiumDirs = Get-ChildItem -Path $destPath -Recurse -Directory -Filter "*Aluminium Cans*"
foreach ($dir in $aluminiumDirs) {
    if (Test-Path $dir.FullName) { Move-Item "$($dir.FullName)\*" "$finalPath\metal\" -Force -ErrorAction SilentlyContinue }
}

# 2. Glass bottles -> glass
$glassDirs = Get-ChildItem -Path $destPath -Recurse -Directory -Filter "*Glass bottles*"
foreach ($dir in $glassDirs) {
    if (Test-Path $dir.FullName) { Move-Item "$($dir.FullName)\*" "$finalPath\glass\" -Force -ErrorAction SilentlyContinue }
}

# 3. Plastic bottles (PET and HDPE) -> plastic
$petDirs = Get-ChildItem -Path $destPath -Recurse -Directory -Filter "*PET (plastic) bottles*"
foreach ($dir in $petDirs) {
    if (Test-Path $dir.FullName) { Move-Item "$($dir.FullName)\*" "$finalPath\plastic\" -Force -ErrorAction SilentlyContinue }
}

$hdpeDirs = Get-ChildItem -Path $destPath -Recurse -Directory -Filter "*HDPE (plastic) milk bottles*"
foreach ($dir in $hdpeDirs) {
    if (Test-Path $dir.FullName) { Move-Item "$($dir.FullName)\*" "$finalPath\plastic\" -Force -ErrorAction SilentlyContinue }
}

Write-Host "Cleaning up raw dataset folder..."
Remove-Item -Recurse -Force $destPath

Write-Host "Drinking waste merge complete!"
