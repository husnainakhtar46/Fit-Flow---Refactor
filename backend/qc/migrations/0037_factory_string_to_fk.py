# Generated manually

import django.db.models.deletion
from django.db import migrations, models

def migrate_factory_forward(apps, schema_editor):
    Inspection = apps.get_model('qc', 'Inspection')
    FinalInspection = apps.get_model('qc', 'FinalInspection')
    Factory = apps.get_model('qc', 'Factory')

    # For Inspection
    for obj in Inspection.objects.all():
        if obj.factory_legacy and str(obj.factory_legacy).strip():
            factory_name = str(obj.factory_legacy).strip()
            factory_obj = Factory.objects.filter(name__iexact=factory_name).first()
            if not factory_obj:
                factory_obj = Factory.objects.create(name=factory_name)
            obj.factory = factory_obj
            obj.save(update_fields=['factory'])

    # For FinalInspection
    for obj in FinalInspection.objects.all():
        if obj.factory_legacy and str(obj.factory_legacy).strip():
            factory_name = str(obj.factory_legacy).strip()
            factory_obj = Factory.objects.filter(name__iexact=factory_name).first()
            if not factory_obj:
                factory_obj = Factory.objects.create(name=factory_name)
            obj.factory = factory_obj
            obj.save(update_fields=['factory'])

def migrate_factory_backward(apps, schema_editor):
    Inspection = apps.get_model('qc', 'Inspection')
    FinalInspection = apps.get_model('qc', 'FinalInspection')

    # Revert Inspection
    for obj in Inspection.objects.all():
        if obj.factory:
            obj.factory_legacy = obj.factory.name
            obj.save(update_fields=['factory_legacy'])

    # Revert FinalInspection
    for obj in FinalInspection.objects.all():
        if obj.factory:
            obj.factory_legacy = obj.factory.name
            obj.save(update_fields=['factory_legacy'])

class Migration(migrations.Migration):

    dependencies = [
        ('qc', '0036_alter_finalinspectionsizecheck_options_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='inspection',
            old_name='factory',
            new_name='factory_legacy',
        ),
        migrations.RenameField(
            model_name='finalinspection',
            old_name='factory',
            new_name='factory_legacy',
        ),
        migrations.AddField(
            model_name='inspection',
            name='factory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='evaluations', to='qc.factory'),
        ),
        migrations.AddField(
            model_name='finalinspection',
            name='factory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='final_inspections', to='qc.factory'),
        ),
        migrations.RunPython(migrate_factory_forward, migrate_factory_backward),
        migrations.RemoveField(
            model_name='inspection',
            name='factory_legacy',
        ),
        migrations.RemoveField(
            model_name='finalinspection',
            name='factory_legacy',
        ),
    ]
