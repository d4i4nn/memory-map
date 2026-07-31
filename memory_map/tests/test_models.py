from datetime import date

from django.test import TestCase

from memory_map.models import Category, HistoricalPeriod, Incident, IncidentSource


class CategoryModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en="State Violence",
            name_es="Violencia Estatal",
            color_hex="#1D9E75",
        )

    def test_str(self):
        self.assertEqual(str(self.category), "Violencia Estatal / State Violence")

    def test_ordering(self):
        Category.objects.create(name_en="A", name_es="Alfa")
        Category.objects.create(name_en="B", name_es="Beta")
        names = list(Category.objects.values_list("name_en", flat=True))
        self.assertEqual(names, ["A", "B", "State Violence"])


class HistoricalPeriodModelTests(TestCase):
    def test_str_with_end_year(self):
        period = HistoricalPeriod.objects.create(
            name_en="Dictatorship",
            name_es="Dictadura",
            year_from=1976,
            year_to=1983,
        )
        self.assertEqual(str(period), "Dictadura (1976–1983)")

    def test_str_ongoing(self):
        period = HistoricalPeriod.objects.create(
            name_en="Ongoing",
            name_es="Actualidad",
            year_from=1983,
        )
        self.assertEqual(str(period), "Actualidad (1983–present)")


class IncidentModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name_en="A", name_es="Alfa")
        self.incident = Incident.objects.create(
            title_es="Test incident",
            title_en="Incidente de prueba",
            description_es="Descripción",
            description_en="Description",
            category=self.category,
            latitude=-37.5,
            longitude=-57.5,
            location_label="Pinamar, Buenos Aires",
            date_occurred=date(1983, 12, 10),
            status=Incident.APPROVED,
            contributor_name="Gabriel",
        )

    def test_str(self):
        self.assertEqual(str(self.incident), "Test incident")

    def test_year_property(self):
        self.assertEqual(self.incident.year, 1983)

    def test_year_property_without_date(self):
        self.incident.date_occurred = None
        self.assertEqual(self.incident.year, None)

    def test_is_approved_true(self):
        self.assertTrue(self.incident.is_approved)

    def test_is_approved_false_for_pending(self):
        self.incident.status = Incident.PENDING
        self.assertFalse(self.incident.is_approved)

    def test_default_status_is_pending(self):
        incident = Incident.objects.create(
            title_es="Nuevo",
            description_es="Desc",
            category=self.category,
        )
        self.assertEqual(incident.status, Incident.PENDING)

    def test_incident_source_str(self):
        source = IncidentSource.objects.create(
            incident=self.incident,
            label="Clarín",
            url="https://example.com",
        )
        self.assertEqual(str(source), "Clarín — Test incident")

    def test_related_sources(self):
        IncidentSource.objects.create(incident=self.incident, label="A", url="https://a.com")
        IncidentSource.objects.create(incident=self.incident, label="B", url="https://b.com")
        self.assertEqual(self.incident.sources.count(), 2)

    def test_category_protect_on_delete(self):
        with self.assertRaises(Exception):
            self.category.delete()
