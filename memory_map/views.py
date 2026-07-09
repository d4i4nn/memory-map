import json
from django.core.serializers.json import DjangoJSONEncoder
from django.shortcuts import render, redirect
from .models import Incident, Category, IncidentImage, IncidentSource

def index(request):
    # categories = Category.objects.all()
    # Importante: incluimos 'category_id' para que JS pueda filtrar
    incidents = Incident.objects.filter(status='approved').select_related('category')

    incidents_data = [
        {
            "id":             i.id,
            "category_id":    i.category_id,
            "status":         i.status,
            "title_es":       i.title_es,
            "title_en":       i.title_en,
            "description_es": i.description_es,
            "description_en": i.description_en,
            "location_label": i.location_label,
            "latitude":       i.latitude,
            "longitude":      i.longitude,
            "year":           i.date_occurred.year if i.date_occurred else None,
            "cover_image":    None,   # Stage 7
            "sources":        [],     # add later

        }
        for i in incidents
    ]
    
    return render(request, "memory_map/index.html", {
        "incidents": incidents_data,
    })

def contribute(request):
    
    print("1 - view reached, method:", request.method)

    if request.method == "POST":
         
        data = request.POST
        print("2 - POST data received:", data)

   
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
        print("3 - incident created, id:", incident.id)

        IncidentSource.objects.create(
               incident = incident,
               url      = data['source_url'],
               label    = data['source_label'],
           )
        print("4 - source created")

        return redirect("index")
    
    return render(request, "memory_map/index.html", {
    })
