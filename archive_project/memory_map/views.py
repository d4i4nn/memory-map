from django.shortcuts import render
from .models import Incident, Category

def index(request):
    categories = Category.objects.all()
    # Importante: incluimos 'category_id' para que JS pueda filtrar
    incidents_list = list(Incident.objects.filter(is_approved=True).values(
        'title_es', 
        'description_es', 
        'latitude', 
        'longitude', 
        'date_occurred', 
        'category_id'
    ))
    
    return render(request, "memory_map/index.html", {
        "incidents": incidents_list,
        "categories": categories
    })