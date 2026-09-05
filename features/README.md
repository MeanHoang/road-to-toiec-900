# features/ — nơi để LOGIC

Bài `Atomic Design` trong vault nói rõ: Atomic Design là pattern tổ chức **UI**,
không phải kiến trúc ứng dụng. Component nào đụng tới domain — fetch dữ liệu,
đọc trạng thái đăng nhập, hiểu hình dạng của một từ vựng — thì không thuộc
`shared/ui`, nó thuộc về đây.

| Feature | Giữ chuyện gì |
| --- | --- |
| `auth/` | Ai đang học: ẩn danh hay Google, gộp tiến độ lúc đăng nhập |
| `lesson/` | Nội dung buổi học: lấy từ đâu, ghép thế nào, đếm ra sao |
| `progress/` | Tiến độ: localStorage, Firestore, và luật gộp hai bản |
| `vocabulary/` | UI riêng của từ vựng cần biết hình dạng dữ liệu |

Mỗi feature tự chứa cả data access, hook và component của nó. Feature được phép
import `shared/ui` và `lib/`; `shared/ui` thì KHÔNG BAO GIỜ được import ngược
lại vào đây — hễ thấy dòng import như thế là đặt file sai chỗ.
