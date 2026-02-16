# Testing Guide - How to Test in Google Chrome

## Step 1: Start the Backend Server

Open a terminal/command prompt and run:

```bash
cd backend
npm run dev
```

You should see:
```
Server is running on http://localhost:3000
API endpoint: http://localhost:3000/api/appointments
```

**Keep this terminal window open** - the server needs to be running.

## Step 2: Open the Website in Chrome

1. Open **Google Chrome**
2. Navigate to: `http://localhost:3000`
   - The server serves your `public_html` folder, so `index.html` will load automatically

## Step 3: Test the Form Submission

1. **Scroll down** to the "Записаться онлайн" (Sign up online) form
2. **Fill in the form**:
   - Name: Enter any name (e.g., "Иван Иванов")
   - Phone: Enter a phone number (e.g., "+7 999 123 45 67")
3. **Click** "Записаться на приём" (Book an appointment)
4. **Check for success message** - you should see a green success message

## Step 4: Check Network Requests (Chrome DevTools)

### Open Chrome DevTools:

**Method 1:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

**Method 2:** Right-click on the page → Select "Inspect"

### Check Network Tab:

1. Click on the **"Network"** tab in DevTools
2. **Filter by "Fetch/XHR"** to see only API requests
3. **Submit the form again**
4. You should see a request to `/api/appointments`
5. **Click on the request** to see:
   - **Headers**: Request and response headers
   - **Payload**: The data sent (name and phone)
   - **Response**: The server's response (success message)

### What to Look For:

✅ **Success Response (200/201)**:
```json
{
  "success": true,
  "message": "Спасибо! Ваша заявка принята...",
  "appointment": {
    "id": "...",
    "name": "...",
    "phone": "..."
  }
}
```

❌ **Error Response (400/500)**:
```json
{
  "success": false,
  "message": "Error message..."
}
```

## Step 5: Test API Endpoints Directly

You can also test the API directly in Chrome:

### Test Health Endpoint:
Open in Chrome: `http://localhost:3000/api/health`

Should show:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T..."
}
```

### Test Get Appointments:
Open in Chrome: `http://localhost:3000/api/appointments`

Should show all submitted appointments:
```json
{
  "success": true,
  "count": 1,
  "appointments": [...]
}
```

## Step 6: Check Console for Errors

1. In Chrome DevTools, go to the **"Console"** tab
2. Look for any JavaScript errors (red text)
3. Check for successful API calls (you might see logs)

## Common Issues & Solutions

### ❌ "Failed to fetch" or "Network Error"
- **Solution**: Make sure the backend server is running (`npm run dev`)

### ❌ "CORS error"
- **Solution**: Already handled in the backend, but if you see this, check that `cors` is installed

### ❌ Form doesn't submit
- **Solution**: 
  1. Check Console tab for JavaScript errors
  2. Make sure both name and phone fields are filled
  3. Check Network tab to see if request is being sent

### ❌ Server not responding
- **Solution**: 
  1. Check terminal where server is running for errors
  2. Make sure port 3000 is not already in use
  3. Try restarting the server

## Quick Test Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Website opens at `http://localhost:3000`
- [ ] Form fields are visible
- [ ] Can fill in name and phone
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] Network tab shows POST request to `/api/appointments`
- [ ] Response shows `success: true`
- [ ] Console has no errors

## Testing Different Scenarios

### Test 1: Valid Submission
- Name: "Тест Тестов"
- Phone: "+7 999 123 45 67"
- Expected: ✅ Success message

### Test 2: Empty Fields
- Name: (empty)
- Phone: (empty)
- Expected: ❌ Error message "Пожалуйста, заполните все поля"

### Test 3: Invalid Phone
- Name: "Тест"
- Phone: "abc"
- Expected: ❌ Error message "Пожалуйста, введите корректный номер телефона"
