from django.contrib import admin
from .models import Category, Incident, HistoricalPeriod
# Register your models here.

admin.site.register(Category)
admin.site.register(HistoricalPeriod)
admin.site.register(Incident)