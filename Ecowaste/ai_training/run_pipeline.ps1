Write-Host "=========================================="
Write-Host " Ecowaste AI - Local Training Pipeline"
Write-Host "=========================================="

# Force uv to cache all downloaded AI packages locally inside this folder
$env:UV_CACHE_DIR = ".\.uv_cache"

Write-Host "`n[1/4] Setting up RTX 4050 GPU Environment..."
# Must use Python 3.10 for DirectML compatibility
uv venv --python 3.10 --clear
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Activate the virtual environment
. .\.venv\Scripts\Activate.ps1

# Install strict GPU packages
uv pip install .\tensorflow_intel-2.10.0-cp310-cp310-win_amd64.whl .\tensorflow_directml_plugin-0.4.0.dev230202-cp310-cp310-win_amd64.whl "numpy<2" scipy pandas
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install GPU plugins." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[2/4] Downloading Dataset..."
python setup_data.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/4] Training Custom Model on RTX 4050..."
python train_model.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[4/4] Converting Model for the Web..."
Write-Host "Switching environment to Web Converter Mode..." -ForegroundColor Cyan
# Uninstall GPU plugin and install converter tools
uv pip uninstall tensorflow-directml-plugin
uv pip install tensorflowjs "setuptools<70"

$OUT_DIR = "..\frontend-next\public\model"
if (!(Test-Path -Path $OUT_DIR)) {
    New-Item -ItemType Directory -Force -Path $OUT_DIR
}

# Run the converter
python convert_model.py

Write-Host "`n=========================================="
Write-Host " SUCCESS! Pipeline Complete."
Write-Host " Model deployed to: frontend-next/public/model"
Write-Host "=========================================="
