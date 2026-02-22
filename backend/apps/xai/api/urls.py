from django.urls import path

from apps.xai.api.views import (
    ClinicalExplanationView,
    ExplanationView,
    FeatureContributionsView,
)

urlpatterns = [
    path(
        "explanations/<uuid:session_id>/",
        ExplanationView.as_view(),
        name="xai-explanation",
    ),
    path(
        "explanations/<uuid:session_id>/clinical/",
        ClinicalExplanationView.as_view(),
        name="xai-clinical",
    ),
    path(
        "explanations/<uuid:session_id>/features/",
        FeatureContributionsView.as_view(),
        name="xai-features",
    ),
]
