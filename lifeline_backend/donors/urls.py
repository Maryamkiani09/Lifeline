from django.urls import path
from .views import DonorRegisterView, DonorMeView

urlpatterns = [
    path("register/", DonorRegisterView.as_view(), name="donor_register"),
    path("me/", DonorMeView.as_view(), name="donor_me"),
]
