from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.clinicians.models.clinician_profile import ClinicianProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds mock clinicians for testing the booking feature'

    def handle(self, *args, **options):
        clinicians_data = [
            {
                "email": "dr.smith@cavista.com",
                "first_name": "John",
                "last_name": "Smith",
                "specialty": "Cardiology",
                "license": "LIC-12345",
                "bio": "Specialist in cardiovascular health with over 15 years of experience."
            },
            {
                "email": "dr.jones@cavista.com",
                "first_name": "Sarah",
                "last_name": "Jones",
                "specialty": "Neurology",
                "license": "LIC-67890",
                "bio": "Focuses on neurological disorders and neurodegenerative diseases."
            },
            {
                "email": "dr.wilson@cavista.com",
                "first_name": "Emily",
                "last_name": "Wilson",
                "specialty": "Dermatology",
                "license": "LIC-54321",
                "bio": "Expert in skin health, oncology, and cosmetic dermatology."
            }
        ]

        for data in clinicians_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "role": "CLINICIAN",
                    "is_active": True,
                    "is_verified": True
                }
            )
            if created:
                user.set_password("password123")
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user {user.email}'))
            
            profile, p_created = ClinicianProfile.objects.get_or_create(
                user=user,
                defaults={
                    "specialty": data["specialty"],
                    "license_number": data["license"],
                    "bio": data["bio"],
                    "is_available": True
                }
            )
            if p_created:
                self.stdout.write(self.style.SUCCESS(f'Created profile for Dr. {user.last_name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Profile for Dr. {user.last_name} already exists'))
