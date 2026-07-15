from django.urls import path
from .views import (
    IndividualPatientRegisterView,
    MyPatientRequestsView,
    HospitalPatientRequestListCreateView,
    HospitalPatientRequestDetailView,
    HospitalPublicPatientListView,
)

urlpatterns = [
    path("register/", IndividualPatientRegisterView.as_view(), name="patient_register"),
    path("my-requests/", MyPatientRequestsView.as_view(), name="my_patient_requests"),
    path("hospital-requests/", HospitalPatientRequestListCreateView.as_view(), name="hospital_requests"),
    path("hospital-requests/<int:pk>/", HospitalPatientRequestDetailView.as_view(), name="hospital_request_detail"),
    path("public/hospital/<int:hospital_id>/", HospitalPublicPatientListView.as_view(), name="hospital_public_patients"),
]
