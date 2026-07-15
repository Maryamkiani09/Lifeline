from django.urls import path
from .views import DonorBroadcastListView, AcceptMatchView, ConfirmDonationView, CancelMatchView, CallNowView, MyMatchesView

urlpatterns = [
    path("my-broadcasts/", DonorBroadcastListView.as_view(), name="donor_broadcasts"),
    path("my-matches/", MyMatchesView.as_view(), name="my_matches"),
    path("<int:match_id>/accept/", AcceptMatchView.as_view(), name="match_accept"),
    path("<int:match_id>/confirm/", ConfirmDonationView.as_view(), name="match_confirm"),
    path("<int:match_id>/cancel/", CancelMatchView.as_view(), name="match_cancel"),
    path("<int:match_id>/call-now/", CallNowView.as_view(), name="match_call_now"),
]
