from django.urls import path
from .views import ReportCreateView, BlockListCreateView, BlockDeleteView

urlpatterns = [
    path("report/", ReportCreateView.as_view(), name="report_create"),
    path("blocks/", BlockListCreateView.as_view(), name="block_list_create"),
    path("blocks/<int:pk>/", BlockDeleteView.as_view(), name="block_delete"),
]
