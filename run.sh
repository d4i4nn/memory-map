#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

PYTHON_BIN="python3"
VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "No se encontro $VENV_DIR. Creando entorno virtual..."
    $PYTHON_BIN -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

if ! python -c "import django" >/dev/null 2>&1; then
    echo "Django no esta instalado. Instalando dependencias..."
    pip install -r requirements.txt
fi

echo "Aplicando migraciones pendientes..."
python manage.py migrate

echo ""
echo "Iniciando el servidor en http://localhost:8000 (Ctrl+C para detener)"
echo ""
exec python manage.py runserver 0.0.0.0:8000
