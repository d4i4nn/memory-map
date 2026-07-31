# d4i4nn — Memory Map

Mapa colaborativo de memoria histórica (Django 6 + SQLite).

## Requisitos

- Python 3.12 o superior
- (Opcional) Docker

## Ejecutar localmente (sin Docker)

```bash
./run.sh
```

El script crea/usa el `venv/`, instala dependencias si faltan, aplica
migraciones y levanta el servidor en <http://localhost:8000>.

## Ejecutar con Docker

```bash
docker compose up
```

La app queda disponible en <http://localhost:8000>. La base de datos
(`db.sqlite3`) y los archivos subidos (`media/`) se persisten en volúmenes
del host, así que sobreviven a recrear el contenedor.

Para detener: `Ctrl+C`. Para correr en segundo plano: `docker compose up -d`.

## Tests

```bash
# activa el venv si es necesario
source venv/bin/activate
python manage.py test
```

## Estructura

- `final_project/` — configuración del proyecto Django
- `memory_map/` — la app (modelos, vistas, plantillas, estáticos)
- `memory_map/tests/` — tests (modelos y vistas)
- `run.sh` — arranque directo sin Docker
- `Dockerfile` / `docker-compose.yml` — dockerización

## Rutas principales

- `/` — mapa con incidentes aprobados
- `/contribute/` — formulario de aporte (quedan en estado `pending`)
- `/admin/` — panel de moderación
