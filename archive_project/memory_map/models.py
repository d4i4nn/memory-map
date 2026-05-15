from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    # E.g., "State Violence", "Labor Exploitation", "Resistance"
    name_en = models.CharField(max_length=100)
    name_es = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name_es} / {self.name_en}"

class Time(models.Model):
    name = models.CharField(max_length=100) # Ej: "Generación del 80", "Dictadura", "Actualidad"
    orden = models.IntegerField()

class Incident(models.Model):
    title_es = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200, blank=True)
    
    # This is where your thesis text goes
    description_es = models.TextField()
    description_en = models.TextField(blank=True)
    
    # Location data for the map
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    date_occurred = models.DateField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="incidents")
    
    # Collaborative features
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title_es