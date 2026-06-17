from django.shortcuts import render, redirect
from .models import Incident, Category, IncidentImage, IncidentSource

def index(request):
    categories = Category.objects.all()
    # Importante: incluimos 'category_id' para que JS pueda filtrar
    incidents_list = list(
        Incident.objects.filter(status='approved').values(
        'title_es', 
        'description_es', 
        'latitude', 
        'longitude', 
        'date_occurred', 
        'category_id',
        'category__name_es'
    ))
    
    return render(request, "memory_map/index.html", {
        "incidents": incidents_list,
        "categories": categories
    })

def contribute(request):
    if request.method == "POST":
         
        data = request.POST
   
        #    POST payload keys match model fields exactly — Django view does:
        incident = Incident.objects.create(
               title_es        = data['title_es'],
               description_es  = data['description_es'],
               date_occurred   = data['date_occurred'],
               category_id     = data['category'],
               location_label  = data['location_label'],
               latitude        = data['latitude'],
               longitude       = data['longitude'],
               contributor_name  = data['contributor_name'],
               contributor_email = data['contributor_email'],
               status = Incident.PENDING,
           )
        
        IncidentSource.objects.create(
               incident = incident,
               url      = data['source_url'],
               label    = data['source_label'],
           )
    
        return redirect("index")
    
    return render(request, "memory_map/index.html", {})
