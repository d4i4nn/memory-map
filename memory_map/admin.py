from django.contrib import admin
from django.utils import timezone
from .models import Category, Incident, HistoricalPeriod, IncidentSource, IncidentImage
# Register your models here.

admin.site.register(Category)
admin.site.register(HistoricalPeriod)

# custom actions
@admin.action(description="Mark selected incidents as approved")
def make_approved(modeladmin, request, queryset):
        n = queryset.update(status=Incident.APPROVED, updated_at=timezone.now())
        modeladmin.message_user(request, f"{n} incidente(s) aprobado(s).")

@admin.action(description="Mark selected incidents as rejected")
def make_rejected(modeladmin, request, queryset):
    n = queryset.update(status=Incident.REJECTED, updated_at=timezone.now())
    modeladmin.message_user(request, f"{n} incidente(s) rechazado(s).")

# Esto permite administrar las imágenes desde el mismo Incidente
class IncidentImageInline(admin.TabularInline):
    model = IncidentImage
    extra = 1

# Esto permite administrar las fuentes desde el mismo Incidente
class IncidentSourceInline(admin.TabularInline):
    model = IncidentSource
    extra = 1
    
@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display  = ["title_es", "display_categories", "status", "has_coords", "date_occurred", "contributor_name"]
    list_filter   = ["status", "categories"]
    search_fields = ["title_es", "title_en", "location_label"]
    actions       = [make_approved, make_rejected]
    inlines = [IncidentImageInline, IncidentSourceInline]
    
    @admin.display(description="Categorías")
    def display_categories(self, obj):
        return ", ".join([c.name_es for c in obj.categories.all()])
 
    @admin.display(boolean=True, description="Coords")
    def has_coords(self, obj):
        return obj.latitude is not None and obj.longitude is not None
