import json
from django.core.serializers.json import DjangoJSONEncoder
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Incident, Category, IncidentImage, IncidentSource

def index(request):
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
            "cover_image":    i.images.first().image.url if i.images.exists() else None,   # Stage 7
            "sources":        [
                {"label": s.label, "url": s.url} for s in i.sources.all()
                ],
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

        lat_value = data.get('latitude')
        lng_value = data.get('longitud')
   
        #    POST payload keys match model fields exactly — Django view does:
        incident = Incident.objects.create(
               title_es        = data['title_es'],
               description_es  = data['description_es'],
               date_occurred   = data['date_occurred'],
               category_id     = data['category'],
               location_label  = data['location_label'],
               latitude        = float(lat_value) if lat_value and lat_value.strip() else None,
               longitude       = float(lng_value) if lng_value and lng_value.strip() else None,
               contributor_name  = data['contributor_name'],
               contributor_email = data['contributor_email'],
               status = Incident.PENDING,
           )
        print("3 - incident created, id:", incident.id)

        IncidentSource.objects.create(
               incident = incident,
               url      = data['source_url'],
               label    = data['source_label'] or "Fuente de prensa",
           )
        print("4 - source created")

        image_archive = request.FILES.get('image')

        if image_archive:
            IncidentImage.objects.create(
                incident = incident,
                image = image_archive,
                caption = f"Evidencia - {incident.title_es}",
                order = 0
        )
        print("5 image saved succcessfully")

        return JsonResponse({"status": "success"}, status=201)
    
    return render(request, "memory_map/index.html", {
    })
