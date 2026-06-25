Write-Host "=========================================="
Write-Host " Starting Ecowaste Hybrid GPU Server"
Write-Host "=========================================="

Write-Host "Activating Python Environment..."
. .\.venv\Scripts\Activate.ps1

Write-Host "Installing Flask..."
uv pip install flask flask-cors Pillow

Write-Host "Booting up the AI..."
python ai_server.py
