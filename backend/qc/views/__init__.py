from .auth import CustomTokenObtainPairView
from .common import (
    CustomerViewSet,
    FactoryViewSet,
    TemplateViewSet,
    FilterPresetViewSet,
    DashboardView,
)
from .evaluation import InspectionViewSet
from .final_inspection import FinalInspectionViewSet
from .style_cycle import (
    StyleMasterViewSet,
    SampleCommentViewSet,
    SampleCommentImageViewSet,
    StyleLinkViewSet,
)

__all__ = [
    "CustomTokenObtainPairView",
    "CustomerViewSet",
    "FactoryViewSet",
    "TemplateViewSet",
    "FilterPresetViewSet",
    "DashboardView",
    "InspectionViewSet",
    "FinalInspectionViewSet",
    "StyleMasterViewSet",
    "SampleCommentViewSet",
    "SampleCommentImageViewSet",
    "StyleLinkViewSet",
]
