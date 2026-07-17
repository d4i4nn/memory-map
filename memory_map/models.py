from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    # E.g., "State Violence", "Labor Exploitation", "Resistance"
    name_en = models.CharField(max_length=100)
    name_es = models.CharField(max_length=100)

    color_hex = models.CharField(
        max_length=7,
        default="#888888",
        help_text="Hex color used for map pins and UI pills, e.g. #1D9E75",
    )
 
    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name_en"]
 
    def __str__(self):
        return f"{self.name_es} / {self.name_en}"
 
 
class HistoricalPeriod(models.Model):
    # """
    # Optional historical period label (e.g. 'Military dictatorship', 'Return to democracy').
    # Used as a secondary filter alongside the year slider.
    # """
    name_en   = models.CharField(max_length=100)
    name_es   = models.CharField(max_length=100)
    year_from = models.IntegerField(help_text="Start year of the period")
    year_to   = models.IntegerField(
        null=True, blank=True,
        help_text="End year — leave blank if ongoing",
    )
    order     = models.PositiveSmallIntegerField(
        default=0,
        help_text="Display order in the filter sidebar",
    )
 
    class Meta:
        ordering = ["order", "year_from"]
 
    def __str__(self):
        end = self.year_to or "present"
        return f"{self.name_es} ({self.year_from}–{end})"
 

class Incident(models.Model):
    # workflow
    # 1 collaborator sent a new Incident
    # 2 an admin review and approved or rejected
    # 3 only is_approved incident appear on the map
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    STATUS_CHOICES = [
        (PENDING,  "Pending review"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]
    
    title_es = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200, blank=True)
    
    # This is where your thesis text goes
    description_es = models.TextField()
    description_en = models.TextField(blank=True)
    
    
    # ── Geography ─────────────────────────────────────────────────
    latitude  = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_label = models.CharField(
        max_length=200,
        help_text="Human-readable location, e.g. 'Pinamar, Buenos Aires'",
    )
 
    # ── Time ──────────────────────────────────────────────────────
    date_occurred     = models.DateField(null=True, blank=True)
    historical_period = models.ForeignKey(
        HistoricalPeriod,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="incidents",
    )
 
    # ── Classification ────────────────────────────────────────────
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,   # prevent accidental deletion of a category with incidents
        related_name="incidents",
    )
 
    # ── Moderation ────────────────────────────────────────────────
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    rejection_note = models.TextField(
        blank=True,
        help_text="Optional note sent to the contributor if the submission is rejected",
    )
 
    # ── Authorship ────────────────────────────────────────────────
    # SET_NULL so deleting a user account does not destroy the historical record
    author = models.ForeignKey(
        User,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="submissions",
    )
    contributor_name  = models.CharField(
        max_length=120, blank=True,
        help_text="Public alias or name (shown on the detail sidebar)",
    )
    contributor_email = models.EmailField(
        blank=True,
        help_text="Private — used only for moderation follow-up",
    )
 
    # ── Timestamps ────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ["-date_occurred"]
 
    def __str__(self):
        return self.title_es
 
    @property
    def year(self):
        """Convenience accessor used in templates and the JSON API."""
        return self.date_occurred.year if self.date_occurred else None
 
    @property
    def is_approved(self):
        """Boolean shortcut kept for backwards compatibility with templates."""
        return self.status == self.APPROVED
 
  
class IncidentSource(models.Model):
    """
    One journalistic or institutional source attached to an incident.
    Stored as a separate table so an incident can have multiple sources.
    """
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="sources",
    )
    label = models.CharField(max_length=200, help_text="Display name, e.g. 'Clarín, 12 mar 1997'")
    url   = models.URLField()
 
    def __str__(self):
        return f"{self.label} — {self.incident.title_es}"
 
 
class IncidentImage(models.Model):
    """
    One or more images attached to an incident.
    The first image (order=0) is used as the cover in the detail sidebar.
    """
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image   = models.ImageField(upload_to="incidents/%Y/%m/")
    caption = models.CharField(max_length=300, blank=True)
    order   = models.PositiveSmallIntegerField(
        default=0,
        help_text="Lower numbers appear first; 0 = cover image",
    )
 
    class Meta:
        ordering = ["order"]
 
    def __str__(self):
        return f"Image {self.order} for {self.incident.title_es}"
    