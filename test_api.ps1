# PowerShell API Test Script for Choice Tailors Ledger

$baseUrl = "http://127.0.0.1:8000/api"

Write-Output "--- Starting Choice Tailors API Automated Verification ---"

# Step 1: Login
Write-Output "Logging in..."
$loginBody = @{
    email = "choice.kadi@gmail.com"
    password = "Choice@123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.access_token
    Write-Output "Login successful! JWT Token acquired."
} catch {
    Write-Error "Login failed: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# Step 2: Get Customers List
Write-Output "`nFetching customer list..."
$customers = Invoke-RestMethod -Uri "$baseUrl/customers" -Method Get -Headers $headers
$dinesh = $customers | Where-Object { $_.name -like "*Dinesh*" }

if ($dinesh) {
    Write-Output "Success: Dinesh Kumar found in the database. Phone: $($dinesh.phone)"
} else {
    Write-Error "Dinesh Kumar was not found in the database."
    exit 1
}

# Step 3: Get Nilesh Shah's Order Details
Write-Output "`nFetching orders..."
$orders = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Get -Headers $headers
Write-Output "Orders count in DB: $($orders.Count)"
$orders | ForEach-Object { Write-Output "Order Customer: $($_.customer_name), ID: $($_.id), Invoice: $($_.invoice_id)" }
$nileshOrder = $orders | Where-Object { $_.customer_name -like "*Nilesh*" -and ($_.invoice_id -eq "INV-1092F3" -or $_.invoice_id -eq "INV-1092f3") }

if ($nileshOrder) {
    Write-Output "Success: Nilesh Shah's order INV-1092F3 found."
    Write-Output "Initial Remaining Balance: ₹$($nileshOrder.remaining_payment)"
    if ($nileshOrder.remaining_payment -ne 7500) {
        Write-Warning "Warning: Nilesh Shah's outstanding dues are $($nileshOrder.remaining_payment) (Expected: 7500)"
    }
} else {
    Write-Error "Nilesh Shah's order was not found."
    exit 1
}

# Step 4: Record a New Payment
Write-Output "`nRecording a payment of ₹2500 UPI..."
$paymentBody = @{
    customer_id = $nileshOrder.customer_id
    amount = 2500.0
    payment_mode = "UPI"
    order_id = $nileshOrder.id
    notes = "Test script dues payment"
} | ConvertTo-Json

$payment = Invoke-RestMethod -Uri "$baseUrl/payments" -Method Post -Body $paymentBody -ContentType "application/json" -Headers $headers
Write-Output "Payment created successfully! Transaction ID: $($payment.id)"

# Step 5: Verify Order Balance Updated
Write-Output "`nChecking updated order balance..."
$updatedOrder = Invoke-RestMethod -Uri "$baseUrl/orders/$($nileshOrder.id)" -Method Get -Headers $headers
Write-Output "New Remaining Balance: ₹$($updatedOrder.remaining_payment)"

if ($updatedOrder.remaining_payment -eq ($nileshOrder.remaining_payment - 2500)) {
    Write-Output "Success: Outstanding dues correctly reduced by ₹2500!"
} else {
    Write-Error "Error: Outstanding dues did not update correctly. Remaining: $($updatedOrder.remaining_payment)"
    exit 1
}

# Step 6: Verify Payment Ledger logs
Write-Output "`nFetching Nilesh Shah's payment ledger..."
$paymentsList = Invoke-RestMethod -Uri "$baseUrl/payments/customer/$($nileshOrder.customer_id)" -Method Get -Headers $headers
$loggedPayment = $paymentsList | Where-Object { $_.id -eq $payment.id }

if ($loggedPayment) {
    Write-Output "Success: Verified payment of ₹$($loggedPayment.amount) exists in Nilesh's ledger."
} else {
    Write-Error "Error: Payment was not found in customer ledger."
    exit 1
}

# Step 7: Void the payment (Restore db sanity)
Write-Output "`nVoiding (deleting) the test payment..."
$deleteRes = Invoke-RestMethod -Uri "$baseUrl/payments/$($payment.id)" -Method Delete -Headers $headers
Write-Output "Void Response: $($deleteRes.message)"

# Step 8: Verify Dues Restored
$restoredOrder = Invoke-RestMethod -Uri "$baseUrl/orders/$($nileshOrder.id)" -Method Get -Headers $headers
Write-Output "Dues after voiding payment: ₹$($restoredOrder.remaining_payment)"

if ($restoredOrder.remaining_payment -eq $nileshOrder.remaining_payment) {
    Write-Output "Success: Ledger balances successfully restored!"
} else {
    Write-Error "Error: Dues were not restored after voiding payment."
    exit 1
}

Write-Output "`n*** API VERIFICATION: ALL TESTS PASSED SUCCESSFULLY! ***"
