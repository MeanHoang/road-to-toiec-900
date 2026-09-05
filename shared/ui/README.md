# shared/ui — Atomic Design

Chỉ TRÌNH BÀY. Không fetch dữ liệu, không biết Firestore, không biết "buổi học"
hay "câu nghe" là gì. State ở đây chỉ được là state UI tạm (đang phát, đang mở).

| Tầng | Là gì | Ví dụ ở đây |
| --- | --- | --- |
| `atoms/` | Phần tử nhỏ nhất, không ghép từ thứ gì khác | `Button`, `Badge`, `Input`, `Progress` |
| `molecules/` | Ghép vài atom cho một việc cụ thể | `NavCard`, `StepList`, `Speak`, `AudioPlayer` |
| `organisms/` | Vùng UI lớn, tự đứng được trên trang | `TopBar` |

Quy tắc: một component đụng tới domain (tiến độ học, nội dung buổi, tài khoản)
thì KHÔNG thuộc về đây — nó thuộc `features/<tên feature>/`.
Xem `features/auth/AccountBar.js` và `features/vocabulary/CopyUnknown.js`.

Không có file barrel: import thẳng từng file để nhìn là biết phụ thuộc vào cái gì.
