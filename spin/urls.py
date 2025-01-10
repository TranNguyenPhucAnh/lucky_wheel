from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('spin/', views.spin_wheel, name='spin'),
    path('get-data/', views.get_data, name='data'),
    path('get-history/', views.spin_history, name='history')
]