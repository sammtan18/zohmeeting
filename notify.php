<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// ==============================
// TELEGRAM CONFIGURATION
// ==============================

$botToken = '8762919252:AAEixqSJqJTsgKm6llvvRoMH1rCtEFgKj8c';
$chatId   = '7763496441';

// ==============================
// ONLY ACCEPT POST REQUESTS
// ==============================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// ==============================
// READ JSON REQUEST
// ==============================

$input = json_decode(
    file_get_contents('php://input'),
    true
);

$event = isset($input['event'])
    ? trim((string)$input['event'])
    : '';

if ($event === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Missing event'
    ]);

    exit;
}

// Only permit known events.
$allowedEvents = [
    'download_clicked',
    'download_started',
    'download_completed'
];

if (!in_array($event, $allowedEvents, true)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid event'
    ]);

    exit;
}

// ==============================
// EVENT LABEL
// ==============================

$eventLabels = [
    'download_clicked'   => 'Download button clicked',
    'download_started'   => 'Download started',
    'download_completed' => 'Download completed'
];

$eventLabel = $eventLabels[$event];

// ==============================
// CREATE MESSAGE
// ==============================

$message =
    "📥 Download Event\n\n" .
    "Event: " . $eventLabel . "\n" .
    "Time: " . date('Y-m-d H:i:s') . "\n" .
    "Page: " . ($_SERVER['HTTP_REFERER'] ?? 'Unknown');

// ==============================
// SEND TO TELEGRAM
// ==============================

$telegramUrl =
    'https://api.telegram.org/bot' .
    rawurlencode($botToken) .
    '/sendMessage';

$postData = [
    'chat_id' => $chatId,
    'text'    => $message
];

$ch = curl_init($telegramUrl);

curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($postData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$error    = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

// ==============================
// RETURN RESULT
// ==============================

if ($error || $httpCode < 200 || $httpCode >= 300) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Notification failed'
    ]);

    exit;
}

echo json_encode([
    'success' => true
]);