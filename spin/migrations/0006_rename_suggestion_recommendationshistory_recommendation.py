# Generated by Django 4.2.17 on 2025-01-07 14:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spin', '0005_rename_suggestionhistory_recommendationshistory'),
    ]

    operations = [
        migrations.RenameField(
            model_name='recommendationshistory',
            old_name='suggestion',
            new_name='recommendation',
        ),
    ]
