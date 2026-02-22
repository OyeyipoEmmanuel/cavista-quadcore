from django.urls import path
from apps.clinicians.api.views import (
    ClinicianListView,
    AppointmentCreateView,
    PatientAppointmentListView,
    ClinicianBookingListView
)

urlpatterns = [
    path("", ClinicianListView.as_view(), name="clinician-list"),
    path("appointments/", PatientAppointmentListView.as_view(), name="patient-appointments"),
    path("appointments/book/", AppointmentCreateView.as_view(), name="appointment-book"),
    path("appointments/clinician/", ClinicianBookingListView.as_view(), name="clinician-bookings"),
]
