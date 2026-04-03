<?php
/**
 * MadeMy IT Solutions - Postmark Email API
 *
 * Single PHP file - no dependencies needed.
 * Works on any PHP hosting (Hostinger, etc.)
 *
 * Setup:
 * 1. Upload this file to your server (e.g., /api/send.php)
 * 2. Set the constants below with your Postmark credentials
 * 3. Done!
 */

// ============================================
// CONFIGURATION - Loaded from .env file
// ============================================
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (str_contains($line, '=')) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

define('POSTMARK_TOKEN', $_ENV['POSTMARK_SERVER_TOKEN'] ?? '');
define('FROM_EMAIL',     $_ENV['FROM_EMAIL']            ?? 'noreply@mademy.nl');
define('TO_EMAIL',       $_ENV['TO_EMAIL']              ?? 'mail@mademy.nl');
define('ALLOWED_ORIGIN', $_ENV['ALLOWED_ORIGIN']        ?? 'https://mademy.nl');

if (!POSTMARK_TOKEN) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuratie fout.']);
    error_log('Postmark: POSTMARK_SERVER_TOKEN not set in .env');
    exit;
}
// ============================================

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [ALLOWED_ORIGIN, 'http://localhost:1313', 'http://localhost:1314'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Simple rate limiting (per IP, file-based)
$rateLimitDir = sys_get_temp_dir() . '/mademy_ratelimit';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0755);
$ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = "$rateLimitDir/$ipHash.txt";
$now = time();
$maxRequests = 5;
$windowSeconds = 900; // 15 minutes

if (file_exists($rateLimitFile)) {
    $data = json_decode(file_get_contents($rateLimitFile), true);
    // Clean old entries
    $data = array_filter($data, fn($t) => ($now - $t) < $windowSeconds);
    if (count($data) >= $maxRequests) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Te veel verzoeken. Probeer het over 15 minuten opnieuw.']);
        exit;
    }
    $data[] = $now;
    file_put_contents($rateLimitFile, json_encode($data));
} else {
    file_put_contents($rateLimitFile, json_encode([$now]));
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// Determine action from URL: ?action=quote or ?action=contact
$action = $_GET['action'] ?? 'contact';

// Honeypot check
if (!empty($input['_gotcha'])) {
    echo json_encode(['success' => true, 'message' => 'Bedankt!']);
    exit;
}

// Sanitize
function clean($str) {
    return htmlspecialchars(trim($str ?? ''), ENT_QUOTES, 'UTF-8');
}

$name  = clean($input['name'] ?? '');
$email = clean($input['email'] ?? '');
$phone = clean($input['phone'] ?? '');

// Validate
if (strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Naam is verplicht.']);
    exit;
}
if (!filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geldig e-mailadres is verplicht.']);
    exit;
}

// ============================================
// BUILD EMAIL
// ============================================
if ($action === 'quote') {
    // Quote request
    $plan = clean($input['plan'] ?? 'Algemeen');
    $product = clean($input['product'] ?? '');
    $cpuSockets = clean($input['cpu_sockets'] ?? '');
    $productLabel = $product ?: 'Offerte';
    $subject = "[Offerte] $productLabel - $plan - $name";
    $htmlBody = buildQuoteEmail($name, $email, $phone, $plan, $productLabel, $cpuSockets);
    $textBody = "Offerte aanvraag\nProduct: $productLabel\nNaam: $name\nE-mail: {$input['email']}\nTelefoon: " . ($phone ?: '-') . "\nPakket: $plan" . ($cpuSockets ? "\nAantal CPU Sockets: $cpuSockets" : '');

} else {
    // Contact form
    $company    = clean($input['company'] ?? '');
    $formSubject = clean($input['subject'] ?? 'Algemeen');
    $message    = clean($input['message'] ?? '');

    if (strlen($message) < 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Vul een bericht in.']);
        exit;
    }

    $subjectMap = [
        'proxmox' => 'Proxmox VE',
        'vmware'  => 'VMware Cloud Foundation',
        'hosting' => 'Hosting / Colocatie',
        'hardware'=> 'Hardware / Licenties',
        'support' => 'Support',
        'other'   => 'Overig',
    ];
    $subjectLabel = $subjectMap[$formSubject] ?? $formSubject;
    $subject = "[Contact] $subjectLabel - $name";
    $htmlBody = buildContactEmail($name, $input['email'], $phone, $company, $subjectLabel, $message);
    $textBody = "Contact: $name ({$input['email']})\nOnderwerp: $subjectLabel\nTelefoon: " . ($phone ?: '-') . "\nBedrijf: " . ($company ?: '-') . "\n\n$message";
}

// ============================================
// SEND VIA POSTMARK
// ============================================
$postmarkData = [
    'From'          => FROM_EMAIL,
    'To'            => TO_EMAIL,
    'ReplyTo'       => $input['email'],
    'Subject'       => $subject,
    'HtmlBody'      => $htmlBody,
    'TextBody'      => $textBody,
    'MessageStream' => 'outbound',
];

$ch = curl_init('https://api.postmarkapp.com/email');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($postmarkData),
    CURLOPT_HTTPHEADER     => [
        'Accept: application/json',
        'Content-Type: application/json',
        'X-Postmark-Server-Token: ' . POSTMARK_TOKEN,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    error_log("Postmark cURL error: $curlError");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er is een fout opgetreden. Probeer het later opnieuw.']);
    exit;
}

$result = json_decode($response, true);

if ($httpCode === 200 && ($result['ErrorCode'] ?? -1) === 0) {
    $successMsg = $action === 'quote'
        ? 'Offerte aanvraag verstuurd! We nemen zo snel mogelijk contact met u op.'
        : 'Bericht succesvol verstuurd! We nemen zo snel mogelijk contact met u op.';
    echo json_encode(['success' => true, 'message' => $successMsg]);
} else {
    error_log("Postmark error: $response");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er is een fout opgetreden bij het versturen.']);
}

// ============================================
// EMAIL TEMPLATES
// ============================================
function buildQuoteEmail($name, $email, $phone, $plan, $product = 'Offerte', $cpuSockets = '') {
    $date = date('d-m-Y H:i');
    $phoneHtml = $phone ? "<a href=\"tel:$phone\" style=\"color:#E57035;font-weight:500;\">$phone</a>" : '<span style="color:#94a3b8;">Niet opgegeven</span>';
    $socketsRow = $cpuSockets ? "<tr><td style=\"padding:10px 0;color:#64748b;\">CPU Sockets</td><td style=\"padding:10px 0;font-weight:600;\">$cpuSockets</td></tr>" : '';
    return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#E57035 0%,#D46030 100%);color:white;padding:24px 30px;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;font-size:20px;">Nieuwe offerte aanvraag</h2>
    <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">$product - $plan</p>
  </div>
  <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#64748b;width:120px;">Naam</td><td style="padding:10px 0;font-weight:600;font-size:16px;">$name</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">E-mail</td><td style="padding:10px 0;"><a href="mailto:$email" style="color:#E57035;font-weight:500;">$email</a></td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">Telefoon</td><td style="padding:10px 0;">$phoneHtml</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;">Pakket</td><td style="padding:10px 0;"><span style="background:#E57035;color:white;padding:4px 12px;border-radius:6px;font-weight:600;font-size:14px;">$plan</span></td></tr>
      $socketsRow
    </table>
    <div style="margin-top:24px;padding:16px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa;">
      <p style="margin:0;font-size:14px;color:#9a3412;"><strong>Actie:</strong> Neem contact op met $name voor een $product offerte ($plan).</p>
    </div>
    <div style="margin-top:20px;font-size:12px;color:#94a3b8;">Verstuurd op $date via mademy.nl</div>
  </div>
</body>
</html>
HTML;
}

function buildContactEmail($name, $email, $phone, $company, $subjectLabel, $message) {
    $date = date('d-m-Y H:i');
    $phoneHtml = $phone ? "<a href=\"tel:$phone\" style=\"color:#E57035;\">$phone</a>" : '<span style="color:#94a3b8;">-</span>';
    $companyHtml = $company ?: '<span style="color:#94a3b8;">-</span>';
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#E57035 0%,#D46030 100%);color:white;padding:24px 30px;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;font-size:20px;">Nieuw contactformulier</h2>
  </div>
  <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;width:120px;">Naam</td><td style="padding:8px 0;font-weight:600;">$name</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">E-mail</td><td style="padding:8px 0;"><a href="mailto:$safeEmail" style="color:#E57035;">$safeEmail</a></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Telefoon</td><td style="padding:8px 0;">$phoneHtml</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Bedrijf</td><td style="padding:8px 0;">$companyHtml</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Onderwerp</td><td style="padding:8px 0;font-weight:600;">$subjectLabel</td></tr>
    </table>
    <div style="margin-top:20px;padding:16px;background:white;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="color:#64748b;font-size:13px;margin-bottom:8px;">Bericht</div>
      <div>$safeMessage</div>
    </div>
    <div style="margin-top:20px;font-size:12px;color:#94a3b8;">Verstuurd op $date via mademy.nl</div>
  </div>
</body>
</html>
HTML;
}
