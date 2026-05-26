from django.contrib import admin
from .models import Category, Incident, HistoricalPeriod, IncidentSource, IncidentImage
# Register your models here.

admin.site.register(Category)
admin.site.register(HistoricalPeriod)
admin.site.register(IncidentSource)
admin.site.register(IncidentImage)

# custom actions
@admin.action(description="Mark selected incidents as approved")
def make_approved(modeladmin, request, queryset):
    queryset.update(status="approved")

@admin.action(description="Mark selected incidents as rejected")
def make_rejected(modeladmin, request, queryset):
    queryset.update(status="rejected")

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display  = ["title_es", "category", "status", "date_occurred", "contributor_name"]
    list_filter   = ["status", "category"]
    search_fields = ["title_es", "title_en", "location_label"]
    actions       = [make_approved, make_rejected]
    