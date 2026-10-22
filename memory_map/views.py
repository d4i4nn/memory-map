import logging
from django import forms
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Category, Incident, IncidentImage, IncidentSource

logger = logging.getLogger(__name__)
MAX_IMAGE_BYTES = 5 * 1024 * 1024

def index(request):
    incidents = (Incident.objects
                 .filter(status=Incident.APPROVED)
                 .prefetch_related("sources", "images"))

    incidents_data = []
    for i in incidents:
        images = list(i.images.all())
        incidents_data.append({
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
            "year": i.year,
            "cover_image": images[0].image.url if images else None,
            "sources":        [
                {"label": s.label, "url": s.url} for s in i.sources.all()],
        })
    categories_data = [
        {
            "id":       c.id,
            "name_en":  c.name_en,
            "name_es":  c.name_es,
            "color":    c.color_hex,
            "bg":       f"{c.color_hex}22",
        }
        for c in Category.objects.all()
    ]
    return render(request, "memory_map/index.html", {
        "incidents":  incidents_data,
        "categories": categories_data,
    })

def _to_float(value):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        raise ValidationError("Coordenadas inválidas.")


@require_POST
def contribute(request):
        data = request.POST
        try:
             with transaction.atomic():
                  category_id = data.get("category") or None
                  if not category_id:
                        raise ValidationError("Seleccioná una categoría.")

                  incident = Incident(
                    title_es        = data.get("title_es", "").strip(),
                    description_es  = data.get("description_es", "").strip(),
                    date_occurred   = data.get("date_occurred") or None,
                    category_id     = category_id,
                    location_label  = (data.get("location_label") or "").strip(),
                    latitude        = _to_float(data.get("latitude")),
                    longitude       = _to_float(data.get("longitude")),
                    contributor_name  = data.get("contributor_name", "").strip(),
                    contributor_email = data.get("contributor_email", "").strip(),
                    status = Incident.PENDING,
                  )
                  incident.full_clean()
                  incident.save()

                  url = data.get("source_url", "").strip()
                  source = IncidentSource(
                       incident=incident,
                       url=url,
                       label=data.get("source_label", "").strip() or url,
                  )
                  source.full_clean()
                  source.save()
                  image = request.FILES.get("image")
                  if image:
                        if image.size > MAX_IMAGE_BYTES:
                            raise ValidationError("la imagen supera los 5MB")
                        forms.ImageField().clean(image) #verifica la imagen
                        IncidentImage.objects.create(
                            incident = incident,
                            image =image,
                            caption = f"Evidencia - {incident.title_es}",
                            order = 0
                        )
        except ValidationError as e:
            return JsonResponse({"status":"error", "message": " ".join(e.messages)}, status=400)
        logger.info("Incidente nuevo pendiente de revisión: id=%s", incident.id)
        return JsonResponse({"status": "success"}, status=201)
    