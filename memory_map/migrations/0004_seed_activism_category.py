from django.db import migrations


def add_activism(apps, schema_editor):
    Category = apps.get_model("memory_map", "Category")
    Category.objects.get_or_create(
        name_en="Activism",
        defaults={"name_es": "Activismo", "color_hex": "#639922"},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("memory_map", "0003_alter_incident_latitude_alter_incident_longitude"),
    ]

    operations = [
        migrations.RunPython(add_activism, migrations.RunPython.noop),
    ]
