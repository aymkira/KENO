```bash
#!/bin/bash

# ═══════════════════════════════════════════════
#   تثبيت nvm + Node.js 22 LTS
#   شغّل بهالأمر: bash nvm.sh
# ═══════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  تثبيت nvm..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# تثبيت nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# تفعيل nvm في نفس الجلسة
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  تثبيت Node.js 22 LTS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

nvm install 22
nvm use 22
nvm alias default 22

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  تم التثبيت بنجاح ✅"
echo "  الإصدار الحالي:"
node -v
npm -v
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# إضافة nvm لـ bashrc إذا ما موجود
if ! grep -q "NVM_DIR" ~/.bashrc; then
  echo '' >> ~/.bashrc
  echo '# nvm' >> ~/.bashrc
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
  echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
  echo "✅ تم إضافة nvm لـ ~/.bashrc"
fi

echo ""
echo "أعد تشغيل الترمينال أو شغّل: source ~/.bashrc"
```
