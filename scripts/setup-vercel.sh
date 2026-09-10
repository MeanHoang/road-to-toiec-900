#!/usr/bin/env bash
# Nối project với Vercel, đẩy biến môi trường từ .env.local lên, rồi deploy.
#
#   vercel login          (chạy một lần, mở trình duyệt)
#   bash scripts/setup-vercel.sh
#
# Chạy lại được nhiều lần: biến nào đã có sẵn trên Vercel thì bỏ qua, không nhân đôi.

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
ENVIRONMENTS=(production preview development)

if ! command -v vercel >/dev/null; then
  echo "Chưa có Vercel CLI. Cài bằng:  npm i -g vercel"
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Chưa đăng nhập Vercel. Chạy:  vercel login"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Thiếu $ENV_FILE. Copy từ .env.example rồi điền config Firebase."
  exit 1
fi

echo "→ Đăng nhập với: $(vercel whoami)"

# --- 1. Nối thư mục này với project trên Vercel ---
if [ ! -f .vercel/project.json ]; then
  echo "→ Nối project…"
  vercel link --yes
else
  echo "→ Đã nối sẵn với project trên Vercel"
fi

# --- 2. Đẩy từng biến lên cả 3 môi trường ---
# Bỏ qua dòng trống và dòng chú thích. Giá trị lấy nguyên sau dấu = đầu tiên,
# để những giá trị có chứa dấu = (như appId) không bị cắt.
existing=$(vercel env ls 2>/dev/null || true)

while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  [[ -z "$value" ]] && { echo "  ⚠ $key để trống, bỏ qua"; continue; }

  for env in "${ENVIRONMENTS[@]}"; do
    if grep -q "$key" <<<"$existing" && grep -q "$env" <<<"$existing"; then
      echo "  = $key ($env) đã có"
      continue
    fi
    printf '%s' "$value" | vercel env add "$key" "$env" >/dev/null 2>&1 \
      && echo "  + $key ($env)" \
      || echo "  = $key ($env) đã có hoặc lỗi"
  done
done <"$ENV_FILE"

# --- 3. Deploy ---
echo "→ Deploy production…"
vercel --prod

echo
echo "✓ Xong. Nhớ kiểm tra trên Firebase Console:"
echo "  - Authentication → Sign-in method → bật Anonymous"
echo "  - Firestore → Rules → dán nội dung firestore.rules rồi Publish"
