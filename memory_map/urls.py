
from django.urls import path
from . import views  # Importamos las vistas de tu aplicación

app_name = 'memory_map'

urlpatterns = [
    # Ruta raíz de la app que carga la vista de tu mapa colaborativo
    path('', views.index, name='index'), 
    path('contribute/', views.contribute, name='contribute'), # <-- Asegurate de que tenga la barra '/' al final
]