from django.contrib import admin
from .models import Category, Time, Incident
# Register your models here.

admin.site.register(Category)
admin.site.register(Time)
admin.site.register(Incident)