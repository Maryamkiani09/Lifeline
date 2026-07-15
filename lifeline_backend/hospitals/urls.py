from django.urls import path
from .views import HospitalRegisterView, HospitalDirectoryListView, HospitalDetailView

urlpatterns = [
    path("register/", HospitalRegisterView.as_view(), name="hospital_register"),
    path("", HospitalDirectoryListView.as_view(), name="hospital_directory"),
    path("<int:pk>/", HospitalDetailView.as_view(), name="hospital_detail"),
]
