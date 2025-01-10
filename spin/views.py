from django.shortcuts import render
from django.http import JsonResponse
import json
from django.contrib.auth.decorators import login_required
from .models import Activity, SpinHistory
import random
from django.views.decorators.csrf import csrf_exempt
import json

@login_required
def home(http_request):
    # Truyền thông tin cho template
    return render(http_request, 'spin/home.html')
    
def get_data(http_request):
    # Nhận tham số 'filter' từ query string, phân tách theo dấu phẩy nếu có nhiều giá trị
    filter_value = http_request.GET.get('filter', '')
    if filter_value:
        filter_list = filter_value.split(',')  # Chuyển chuỗi thành danh sách
    else:
        filter_list = []

    activities = Activity.objects.all()

    # Lọc các hoạt động theo chuỗi filter, sử dụng '__in' để lọc theo nhiều giá trị
    if filter_list:
        activities = activities.filter(category__in=filter_list)
    
    data = [
        {'name': activity.name, 'color': activity.color, 'category': activity.category, 'probability': activity.probability }
        for activity in activities
    ]

    return JsonResponse({'data': data})

def spin_history(http_request):
    if http_request.user.is_authenticated:
        history = SpinHistory.objects.filter(user=http_request.user).order_by('-date')
        data = [
            {
                'date': record.date.isoformat(),
                'result': record.result.name if record.result else None,
            }
            for record in history
        ]
        return JsonResponse(data, safe=False)

    return JsonResponse({'error': 'Unauthorized'}, status=401)

@login_required
@csrf_exempt
def spin_wheel(http_request):
    # Nếu là POST requests, lấy dữ liệu từ body
    if http_request.method == 'POST':
        activities = json.loads(http_request.body)

    # Chọn phần thưởng dựa trên xác suất
    probabilities = [activity['probability'] for activity in activities]
    activity = random.choices(activities, weights=probabilities, k=1)[0]
    activity_instance = Activity.objects.get(name=activity['name'], color=activity['color'], category=activity['category'])
                                             
    # Lưu lịch sử quay
    SpinHistory.objects.create(user=http_request.user, result=activity_instance)

    # Trả kết quả JSON
    return JsonResponse({'activity': activity['name'], 'color': activity['color']})