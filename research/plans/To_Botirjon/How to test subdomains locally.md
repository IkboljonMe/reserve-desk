# Local Subdomain Testing Guide

To test the isolated secure portals on your local development machine natively, you must artificially spoof the DNS routing via your computer's `hosts` file so it believes `app.bronit.test` is hosted locally.

### 1. Configure DNS (`/etc/hosts`)

You need to strictly map all possible portals to block outward internet routing.

Open your hosts file:
```bash
sudo nano /etc/hosts
```

Ensure this specific line is present at the top:
```text
127.0.0.1 localhost bronit.test app.bronit.test admin.bronit.test demo.bronit.test hilton.bronit.test super.bronit.test
```

### 2. Reboot Development Server

Anytime configurations shift at the host origin level, you must purge Turbopack so it recognizes the newly authorized development origins attached in `next.config.ts`.

Close your terminal server (`Ctrl + C`), then run:
```bash
rm -rf .next
npm run dev
```

### 3. Verify Isolated Routing

Navigate carefully in your browser. Notice how each URL securely binds to the target portal:

1. **Selection Menu:** http://bronit.test:3000/login
2. **Owner Portal:** http://app.bronit.test:3000/login
3. **Branch Admin:** http://admin.bronit.test:3000/login
4. **Super Admin:** http://super.bronit.test:3000/login

*(Note: Navigating to the wrong portal will purposefully yield a strict authorization error).*
