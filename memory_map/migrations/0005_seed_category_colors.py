from django.db import migrations

CATEGORY_COLORS = {
    "Institutional violence": "#1D9E75",
    "Labor Exploitation": "#534AB7",
    "Racial hatred": "#D85A30",
    "Activism": "#639922",
}

DEFAULT_COLOR = "#888888"


def set_category_colors(apps, schema_editor):
    Category = apps.get_model("memory_map", "Category")
    for name_en, color_hex in CATEGORY_COLORS.items():
        Category.objects.filter(
            name_en=name_en, color_hex=DEFAULT_COLOR
        ).update(color_hex=color_hex)


class Migration(migrations.Migration):

    dependencies = [
        ("memory_map", "0004_seed_activism_category"),
    ]

    operations = [
        migrations.RunPython(set_category_colors, migrations.RunPython.noop),
    ]
