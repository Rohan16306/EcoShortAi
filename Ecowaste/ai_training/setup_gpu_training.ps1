Write-Host "Resetting environment for RTX 4050 GPU Training..." -ForegroundColor Cyan

# Force uv to cache all downloaded AI packages locally inside this folder
$env:UV_CACHE_DIR = ".\.uv_cache"
# 1. Clear the environment to remove the converter files that cause conflicts
uv venv --python 3.10 --clear

# 2. Activate it
. .\.venv\Scripts\Activate.ps1

# 3. Install ONLY the specific GPU wheels and a compatible numpy
uv pip install .\tensorflow_intel-2.10.0-cp310-cp310-win_amd64.whl .\tensorflow_directml_plugin-0.4.0.dev230202-cp310-cp310-win_amd64.whl "numpy<2" scipy pandas

Write-Host "`nEnvironment is ready for GPU Training! Run 'python train_model.py' to start." -ForegroundColor Green
