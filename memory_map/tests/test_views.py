import io
import json
from datetime import date

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from PIL import Image

from memory_map.models import Category, Incident, IncidentImage, IncidentSource


def make_image_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buf, format="PNG")
    return buf.getvalue()


class IndexViewTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name_en="A", name_es="Alfa")

    def test_index_returns_200(self):
        response = self.client.get(reverse("memory_map:index"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "memory_map/index.html")

    def test_index_only_shows_approved_incidents(self):
        Incident.objects.create(
            title_es="Aprobado",
            description_es="Desc",
            category=self.category,
            status=Incident.APPROVED,
            date_occurred="1976-01-01",
        )
        Incident.objects.create(
            title_es="Pendiente",
            description_es="Desc",
            category=self.category,
            status=Incident.PENDING,
        )
        Incident.objects.create(
            title_es="Rechazado",
            description_es="Desc",
            category=self.category,
            status=Incident.REJECTED,
        )

        response = self.client.get(reverse("memory_map:index"))
        incidents = response.context["incidents"]
        self.assertEqual(len(incidents), 1)
        self.assertEqual(incidents[0]["title_es"], "Aprobado")

    def test_index_serializes_expected_fields(self):
        incident = Incident.objects.create(
            title_es="Aprobado",
            description_es="Descripción",
            category=self.category,
            status=Incident.APPROVED,
            latitude=-37.5,
            longitude=-57.5,
            location_label="Pinamar",
            date_occurred="1976-01-01",
        )
        IncidentSource.objects.create(
            incident=incident, label="Clarín", url="https://example.com"
        )

        response = self.client.get(reverse("memory_map:index"))
        item = response.context["incidents"][0]

        self.assertEqual(item["id"], incident.id)
        self.assertEqual(item["category_id"], self.category.id)
        self.assertEqual(item["status"], "approved")
        self.assertEqual(item["latitude"], -37.5)
        self.assertEqual(item["longitude"], -57.5)
        self.assertEqual(item["year"], 1976)
        self.assertEqual(item["location_label"], "Pinamar")
        self.assertEqual(item["cover_image"], None)
        self.assertEqual(item["sources"], [{"label": "Clarín", "url": "https://example.com"}])


class ContributeViewTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name_en="A", name_es="Alfa")

    def payload(self, **overrides):
        data = {
            "title_es": "Incidente de prueba",
            "description_es": "Descripción del incidente",
            "date_occurred": "1976-03-24",
            "category": self.category.id,
            "location_label": "Buenos Aires",
            "latitude": "-34.6",
            "longitude": "-58.38",
            "contributor_name": "Gabriel",
            "contributor_email": "gabriel@example.com",
            "source_url": "https://example.com",
            "source_label": "Diario",
        }
        data.update(overrides)
        return data

    def test_contribute_get_returns_200(self):
        response = self.client.get(reverse("memory_map:contribute"))
        self.assertEqual(response.status_code, 200)

    def test_contribute_post_creates_pending_incident(self):
        response = self.client.post(
            reverse("memory_map:contribute"), self.payload(), format="multipart"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.content), {"status": "success"})

        incident = Incident.objects.get()
        self.assertEqual(incident.status, Incident.PENDING)
        self.assertEqual(incident.title_es, "Incidente de prueba")
        self.assertEqual(incident.latitude, -34.6)
        self.assertEqual(incident.longitude, -58.38)
        self.assertEqual(incident.date_occurred, date(1976, 3, 24))
        self.assertEqual(incident.category, self.category)

    def test_contribute_post_creates_source(self):
        self.client.post(reverse("memory_map:contribute"), self.payload())
        source = IncidentSource.objects.get()
        self.assertEqual(source.url, "https://example.com")
        self.assertEqual(source.label, "Diario")

    def test_contribute_post_with_empty_source_label_uses_default(self):
        payload = self.payload(source_label="")
        self.client.post(reverse("memory_map:contribute"), payload)
        source = IncidentSource.objects.get()
        self.assertEqual(source.label, "Fuente de prensa")

    def test_contribute_post_creates_image(self):
        payload = self.payload()
        payload["image"] = SimpleUploadedFile(
            "incident.png", make_image_bytes(), content_type="image/png"
        )
        response = self.client.post(
            reverse("memory_map:contribute"), payload, format="multipart"
        )
        self.assertEqual(response.status_code, 201)

        incident = Incident.objects.get()
        image = IncidentImage.objects.get()
        self.assertEqual(image.incident, incident)
        self.assertEqual(image.order, 0)
        self.assertTrue(incident.images.exists())
        self.assertEqual(incident.images.first(), image)
