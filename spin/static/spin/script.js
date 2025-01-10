let spinning = false;
let currentAngle = 0; // Lưu góc hiện tại của vòng quay
let slowRotationInterval; // Chế độ quay chậm (idle)
let defaultCategory = 'prize';
let inputArray = [defaultCategory];
let data = [];
let lines = [];
let currentLine = '';
let finalAngle;
let sortOrder = 'asc'; // Mặc định là tăng dần
let activityCount = 0;
let historyCount = 0;
let recHistoryCount = 0;
const wheel = document.getElementById('wheel');
const spinResult = document.getElementById('spin-result');
const editor = document.getElementById('entry-editor');
const spinningSound = document.getElementById('spinning-sound');
const bravoSound = document.getElementById('bravo-sound');
const defaultColors = ['#3C78D8', '#6AA84F', '#F6B26B', '#E06666'];

// Chế độ quay chậm khi vừa vào trang
function startSlowRotation() {
    stopSlowRotation(); // Đảm bảo không có quay chậm nào đang chạy
    slowRotationInterval = setInterval(() => {
        currentAngle = (currentAngle + 1) % 360; // Tăng góc chậm dần
        wheel.style.transform = `rotate(${currentAngle}deg)`; // Quay theo chiều kim đồng hồ
    }, 50); // 50ms để quay chậm
}

// Dừng chế độ quay chậm
function stopSlowRotation() {
    clearInterval(slowRotationInterval);
}

async function showCongratulations(color, activity, index) {
    const modal = document.getElementById('congratulations-modal');
    const header = document.getElementById('congrats-header');
    const body = document.getElementById('congrats-body');
    const removeButton = document.getElementById('remove-entry');
    removeButton.onclick = () => removeEntry(index);

    header.style.backgroundColor = color;
    header.textContent = "Chúc mừng! Bạn đã quay vào ô:";
    
    // Nội dung thông báo
    body.textContent = activity;
    modal.style.display = "flex";

    await populateHistory();

    // Gọi hiệu ứng confetti nếu có
    launchConfetti(color); // Hiệu ứng đồng bộ với màu
}

// Đóng modal
function closeModal() {
    document.getElementById('congratulations-modal').style.display = "none";
}

function launchConfetti(color) {
    const duration = 2 * 1000; // 2 giây
    const end = Date.now() + duration;

    const colors = [color, '#ffffff'];
    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

// Xử lý khi nhấn nút "Quay"
wheel.addEventListener('click', async () => {
    if (spinning) return; // Ngăn bấm liên tục khi đang quay
    spinning = true;
    stopSlowRotation(); // Dừng quay chậm

    // Phát âm thanh quay
    spinningSound.currentTime = 0; // Đặt lại âm thanh về đầu
    spinningSound.play();

    // Reset trạng thái CSS
    wheel.style.transition = 'none'; // Tạm thời xóa transition
    wheel.style.transform = `rotate(${currentAngle}deg)`; // Đặt lại góc hiện tại
    setTimeout(() => {
        wheel.style.transition = 'transform 5s ease-out'; // Áp dụng lại transition
        wheel.style.transform = `rotate(${finalAngle}deg)`; // Quay vòng quay
    }, 0); // Đảm bảo transition được áp dụng lại đúng cách

    try {
        const object = await fetch(`/spin/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)  // Truyền mảng dưới dạng JSON
        });
        const result = await object.json();

        // Lấy thông tin phần thưởng
        const prizeIndex = data.findIndex(item => result.activity == item.name && result.color == item.color)
        // Tính toán góc cần quay
        const anglePerPrize = 360 / data.length; // Góc mỗi ô
        const prizeAngle = prizeIndex * anglePerPrize; 

        // Tính toán góc cuối cùng
        const randomOffset = Math.random() * anglePerPrize;
        finalAngle = 3600 - prizeAngle - randomOffset; // Quay 10 vòng trước khi dừng
    
        // Bắt đầu quay
        wheel.style.transform = `rotate(${finalAngle}deg)`; // Tăng tốc rồi giảm tốc theo chiều kim đồng hồ

        // Cập nhật góc sau khi dừng
        currentAngle = (prizeAngle + randomOffset) % 360;

        // Hiển thị kết quả sau khi vòng quay dừng
        setTimeout(async () => {
            // Dừng âm thanh quay
            spinningSound.pause();
            spinningSound.currentTime = 0;

            // Phát âm thanh "bravo"
            bravoSound.play();

            await showCongratulations(result.color, result.activity, prizeIndex);

            spinResult.textContent = `Bạn đã quay vào ô: ${result.activity}`;
            spinning = false;
        }, 5000);
    } catch (error) {
        result.textContent = 'Có lỗi xảy ra. Vui lòng thử lại!';
        spinning = false;
        startSlowRotation(); // Khởi động lại quay chậm nếu gặp lỗi
    }
});

// Bắt đầu quay chậm khi vừa vào trang
startSlowRotation();

async function getData() {
    let object = await fetch(`/get-data/?filter=${inputArray}`);
    let json = await object.json();
    data = json.data;
    updateActivityCount(data.length);
    return data;
}

function updateActivityCount(count) {
    activityCount = count;
    document.querySelector('a[href="#tab-activities"]').innerHTML = `Hoạt động (${activityCount})`;
}

async function drawWheel(isInit = false) {
    if (isInit === true) {
        await getData();
    }
    editor.value = data.map(entry => entry.name).join('\n'); // Hiển thị mỗi entry trên một dòng
    let mapData = data.map(item => ({ name: item.name, color: item.color }));
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2; // Bán kính vòng quay (canvas hình vuông)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const numSegments = mapData.length;
    const angleStep = (2 * Math.PI) / numSegments; // Góc mỗi ô
    const offsetAngle = -Math.PI / 2; // Dịch chuyển để index 0 bắt đầu từ 12 giờ

    // Vẽ các ô màu
    mapData.forEach((label, index) => {
        const startAngle = index * angleStep + offsetAngle; // Dịch chuyển góc bắt đầu
        const endAngle = startAngle + angleStep;

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle, false);
        ctx.closePath();
        ctx.fillStyle = label.color || '#cccccc'; // Màu mặc định
        ctx.fill();
        ctx.stroke();
    });

    // Thêm hiệu ứng đổ bóng cho vòng tròn trung tâm
    const innerCircleRadius = radius * 0.2; // Kích thước vòng tròn trắng (20% của bán kính)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(radius, radius, innerCircleRadius, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = 'white'; // Màu trắng cho vòng tròn
    ctx.fill();
    ctx.restore();

    // Vẽ văn bản
    mapData.forEach((label, index) => {
        const startAngle = index * angleStep + offsetAngle; // Dịch chuyển góc
        const textAngle = startAngle + angleStep / 2;
        const textRadius = radius * 0.7; // Đặt văn bản bên ngoài vòng tròn trắng
        ctx.save();
        ctx.translate(
            radius + textRadius * Math.cos(textAngle),
            radius + textRadius * Math.sin(textAngle)
        );
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label.name, 0, 0);
        ctx.restore();
    });
}

// Cập nhật dữ liệu vòng quay theo nội dung editor
async function updateWheelFromEditor() {
    // Đọc nội dung từ textarea
    const lines = editor.value.split('\n').filter(line => line.trim() !== ''); // Lọc bỏ dòng trống
    const newData = lines.map(line => line.trim()); // Lấy danh sách tên mới

    // Cập nhật data
    const updatedData = newData.map(name => {
        const existingEntry = data.find(entry => entry.name === name);
        return existingEntry || { name, color: getRandomColorFromList(defaultColors) };
    });

    data = updatedData; // Cập nhật lại data
    updateActivityCount(data.length);
    // Vẽ lại vòng quay
    await drawWheel();
}

document.getElementById('entry-editor').addEventListener('input', async(event) => {
    if (event.inputType == "insertText" || event.inputType == "insertFromPaste") {
        currentLine += event.data;
    }
    else if (event.inputType === "deleteContentBackward") {
        // Xử lý xóa ký tự
        currentLine = currentLine.length == 0 ? '' : currentLine.slice(0, -1); // Xóa ký tự cuối
    }
    //Bỏ qua dòng trống
    if (currentLine.trim() !== '' && event.inputType !== "insertLineBreak" && event.inputType !== "deleteContentBackward") {
        data.push({ name: currentLine.trim(), color: getRandomColorFromList(defaultColors), category: defaultCategory, probability: 0.1 });
    }
    else if (event.inputType !== "insertLineBreak") {
        data.pop();
    }
    else if (event.inputType === "insertLineBreak") {
        currentLine = '';
    }
    if (event.inputType !== "insertLineBreak") {
        await updateWheelFromEditor();
    }
});

// Hàm chọn màu ngẫu nhiên từ danh sách
function getRandomColorFromList(colorList) {
    const randomIndex = Math.floor(Math.random() * colorList.length);
    return colorList[randomIndex];
}

// Xóa một entry khỏi danh sách
async function removeEntry(index) {
    data.splice(index, 1); // Xóa entry khỏi dữ liệu
    updateActivityCount(data.length);
    closeModal();
    await drawWheel(); // Render lại danh sách
}

// Sắp xếp entry theo thứ tự ABC
async function sortActivities() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Chuyển đổi trạng thái
    data.sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.name.localeCompare(b.name); // Tăng dần (A->Z)
        } else {
            return b.name.localeCompare(a.name); // Giảm dần (Z->A)
        }
    });
    await drawWheel();
}

// Trộn ngẫu nhiên entry
async function shuffleActivities() {
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    await drawWheel();
}

// Populate danh sách lịch sử quay
async function populateHistory() {
    const historyList = document.getElementById('history-list'); // Lấy phần tử ul để chứa danh sách
    historyList.innerHTML = ''; // Xóa các mục cũ (nếu có)

    try {
        // Gửi yêu cầu đến API lấy dữ liệu lịch sử quay
        const response = await fetch('/get-history/');
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu lịch sử quay.');
        }

        const historyData = await response.json(); // Chuyển đổi dữ liệu JSON
        // Nếu không có lịch sử quay
        if (historyData.length === 0) {
            const noHistoryItem = document.createElement('li');
            noHistoryItem.className = 'list-group-item text-center';
            noHistoryItem.textContent = 'Chưa có lịch sử quay.';
            historyList.appendChild(noHistoryItem);
            return;
        }

        historyCount = historyData.length;
        document.querySelector('a[href="#tab-history"]').innerHTML = `Lịch sử quay (${historyCount})`;
        // Duyệt qua từng mục lịch sử và hiển thị
        historyData.forEach(record => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';

            // Hiển thị thông tin lịch sử (thời gian quay và kết quả)
            listItem.innerHTML = `
                <strong>Kết quả:</strong> ${record.result || 'Không xác định'}<br>
                <small><strong>Thời gian:</strong> ${new Date(record.date).toLocaleString('vi-VN')}</small>
            `;

            historyList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Lỗi khi tải lịch sử quay:', error);

        // Hiển thị thông báo lỗi trong danh sách
        const errorItem = document.createElement('li');
        errorItem.className = 'list-group-item text-center text-danger';
        errorItem.textContent = 'Không thể tải lịch sử quay. Vui lòng thử lại sau.';
        historyList.appendChild(errorItem);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('visible');
}

// Fullscreen Toggle
document.getElementById('fullscreen').onclick = function () {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

// Dark Mode Toggle
document.getElementById('toggle-dark-mode').onclick = function () {
    document.body.classList.toggle('dark-mode');
    document.getElementById('sidebar').classList.toggle('dark-mode');
    document.querySelector('header').classList.toggle('dark-mode');
};

// Khởi tạo danh sách ban đầu
document.addEventListener('DOMContentLoaded', async () => {
    await drawWheel(true);
    await populateHistory();
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('visible')) {
        sidebar.classList.add('visible');
    }
});

document.getElementById('screenshot-copy').addEventListener('click', async () => {
    const icon = document.getElementById('screenshot-copy');

    const target = document.body; // Hoặc bất kỳ phần tử nào bạn muốn chụp
    const canvas = await html2canvas(target); // Chụp màn hình
    canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
    });
    
    // Thay đổi icon thành tick xanh
    icon.textContent = '✔️';  // Thay đổi nội dung thành tick xanh
    icon.classList.add('icon-tick');  // Áp dụng màu xanh
    
    // Tạo hiệu ứng fade out
    icon.classList.add('fade-out');

    // Sau 1 giây, thay đổi lại icon gốc và xóa hiệu ứng fade out
    setTimeout(() => {
        icon.textContent = '📋';  // Trả về icon gốc
        icon.classList.remove('icon-tick');  // Loại bỏ màu xanh
        icon.classList.remove('fade-out');  // Loại bỏ hiệu ứng fade out

        // Ẩn thông báo "Copied" sau 2 giây
        setTimeout(() => {
            setTimeout(() => {
            }, 500);  // Chờ hiệu ứng fade-out
        }, 1000);  // Ẩn thông báo sau 1 giây
    }, 1000);  // 1 giây để fade out icon
});
