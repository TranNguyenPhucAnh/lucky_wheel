# Generated by Django 4.2.17 on 2025-01-10 14:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('spin', '0008_alter_recommendationshistory_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activity',
            name='category',
            field=models.CharField(choices=[('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng'), ('prize', 'Phần thưởng')], max_length=50, verbose_name='Danh mục'),
        ),
        migrations.DeleteModel(
            name='RecommendationsHistory',
        ),
    ]