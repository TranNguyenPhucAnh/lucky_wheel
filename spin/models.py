from django.db import models
from django.db.models import QuerySet
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Activity(models.Model):

    CATEGORY_CHOICES = [
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
        ('prize', 'Phần thưởng'),
    ]

    name = models.CharField(max_length=100, verbose_name="Tên hoạt động")
    probability = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        verbose_name="Xác suất"
    )
    color = models.CharField(max_length=7, default='#FFFFFF', verbose_name="Màu sắc")
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        verbose_name="Danh mục"
    )

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class UserProfile(models.Model):
    """
    Mô hình lưu trữ thông tin người dùng liên quan đến hệ thống quay thưởng.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Người dùng")
    spins_count = models.IntegerField(default=0, verbose_name="Số lượt quay đã thực hiện")

    def __str__(self):
        return f"Profile of {self.user.username}"

class SpinHistory(models.Model):
    """
    Mô hình lưu trữ lịch sử quay của người dùng.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Người dùng")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Thời điểm quay")
    result = models.ForeignKey(Activity, null=True, on_delete=models.SET_NULL, verbose_name="Kết quả quay")

    def __str__(self):
        return f"{self.user.username} spun on {self.date.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @staticmethod
    def get_history(user: settings.AUTH_USER_MODEL) -> QuerySet:
        """
        Lấy lịch sử quay của người dùng được sắp xếp theo thời gian quay giảm dần.

        Args:
            user (User): Đối tượng người dùng.

        Returns:
            QuerySet: Lịch sử quay của người dùng, được sắp xếp giảm dần theo thời gian.
        """
        return SpinHistory.objects.filter(user=user).order_by('-date')