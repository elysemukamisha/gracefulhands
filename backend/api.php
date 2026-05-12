<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = 'localhost';
$dbName = 'u549394637_Gracefulhands';
$user = 'u549394637_aubinw';
$pass = '$Massage234';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

// Auto-create tables on first run
$pdo->exec("
    CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(20) PRIMARY KEY,
        clientName VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        serviceId VARCHAR(20),
        duration INT DEFAULT 60,
        date VARCHAR(100),
        time VARCHAR(10),
        status ENUM('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Pending',
        intakeDetails JSON,
        totalPrice DECIMAL(10,2) DEFAULT 0,
        createdAt VARCHAR(50)
    );
    CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        serviceType VARCHAR(255),
        painPoints TEXT,
        hasInsurance TINYINT(1) DEFAULT 0,
        status ENUM('New','Contacted','Booked','Lost') DEFAULT 'New',
        createdAt VARCHAR(50),
        notes TEXT
    );
    CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        durationOptions JSON,
        prices JSON,
        basePrice DECIMAL(10,2) DEFAULT 0,
        image TEXT,
        category ENUM('Therapeutic','Relaxation','Specialty') DEFAULT 'Therapeutic'
    );
    CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        message TEXT,
        date VARCHAR(100)
    );
    CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        primaryColor VARCHAR(20) DEFAULT '#2D4F3E',
        secondaryColor VARCHAR(20) DEFAULT '#D4AF37',
        metaTitle VARCHAR(255) DEFAULT 'Graceful Hands | Modern Luxury Therapeutic Massage',
        metaDescription TEXT,
        instagramUrl VARCHAR(500),
        facebookUrl VARCHAR(500),
        announcementBar VARCHAR(500)
    );
    INSERT IGNORE INTO settings (id) VALUES (1);
");

$resource = $_GET['resource'] ?? '';
$id = $_GET['id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($resource) {
    case 'appointments': handleAppointments($pdo, $method, $body, $id); break;
    case 'leads':        handleLeads($pdo, $method, $body, $id);        break;
    case 'services':     handleServices($pdo, $method, $body);           break;
    case 'messages':     handleMessages($pdo, $method, $body);           break;
    case 'settings':     handleSettings($pdo, $method, $body);          break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown resource']);
}

// ── Appointments ──────────────────────────────────────────────────────────────

function handleAppointments($pdo, $method, $body, $id) {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM appointments ORDER BY createdAt DESC')->fetchAll();
        foreach ($rows as &$r) {
            $r['intakeDetails'] = json_decode($r['intakeDetails'] ?? '{}', true);
            $r['totalPrice'] = (float)$r['totalPrice'];
            $r['duration'] = (int)$r['duration'];
        }
        echo json_encode($rows);
        return;
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('
            INSERT INTO appointments (id, clientName, email, phone, serviceId, duration, date, time, status, intakeDetails, totalPrice, createdAt)
            VALUES (:id, :clientName, :email, :phone, :serviceId, :duration, :date, :time, :status, :intakeDetails, :totalPrice, :createdAt)
            ON DUPLICATE KEY UPDATE
              clientName=VALUES(clientName), email=VALUES(email), phone=VALUES(phone),
              serviceId=VALUES(serviceId), duration=VALUES(duration), date=VALUES(date),
              time=VALUES(time), status=VALUES(status), intakeDetails=VALUES(intakeDetails),
              totalPrice=VALUES(totalPrice)
        ');
        $stmt->execute([
            ':id'            => $body['id'],
            ':clientName'    => $body['clientName'],
            ':email'         => $body['email'] ?? '',
            ':phone'         => $body['phone'] ?? '',
            ':serviceId'     => $body['serviceId'] ?? '',
            ':duration'      => (int)($body['duration'] ?? 60),
            ':date'          => $body['date'] ?? '',
            ':time'          => $body['time'] ?? '',
            ':status'        => $body['status'] ?? 'Pending',
            ':intakeDetails' => json_encode($body['intakeDetails'] ?? []),
            ':totalPrice'    => (float)($body['totalPrice'] ?? 0),
            ':createdAt'     => $body['createdAt'] ?? date('c'),
        ]);
        echo json_encode(['ok' => true]);
        return;
    }

    if ($method === 'PATCH' && $id) {
        $fields = [];
        $params = [':id' => $id];
        $allowed = ['status', 'date', 'time', 'clientName', 'email', 'phone'];
        foreach ($allowed as $f) {
            if (isset($body[$f])) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $body[$f];
            }
        }
        if ($fields) {
            $pdo->prepare('UPDATE appointments SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);
        }
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// ── Leads ─────────────────────────────────────────────────────────────────────

function handleLeads($pdo, $method, $body, $id) {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM leads ORDER BY createdAt DESC')->fetchAll();
        foreach ($rows as &$r) {
            $r['hasInsurance'] = (bool)$r['hasInsurance'];
        }
        echo json_encode($rows);
        return;
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('
            INSERT INTO leads (id, name, phone, email, serviceType, painPoints, hasInsurance, status, createdAt, notes)
            VALUES (:id, :name, :phone, :email, :serviceType, :painPoints, :hasInsurance, :status, :createdAt, :notes)
            ON DUPLICATE KEY UPDATE
              name=VALUES(name), phone=VALUES(phone), email=VALUES(email),
              serviceType=VALUES(serviceType), painPoints=VALUES(painPoints),
              hasInsurance=VALUES(hasInsurance), status=VALUES(status), notes=VALUES(notes)
        ');
        $stmt->execute([
            ':id'          => $body['id'],
            ':name'        => $body['name'],
            ':phone'       => $body['phone'] ?? '',
            ':email'       => $body['email'] ?? '',
            ':serviceType' => $body['serviceType'] ?? '',
            ':painPoints'  => $body['painPoints'] ?? '',
            ':hasInsurance'=> $body['hasInsurance'] ? 1 : 0,
            ':status'      => $body['status'] ?? 'New',
            ':createdAt'   => $body['createdAt'] ?? date('c'),
            ':notes'       => $body['notes'] ?? '',
        ]);
        echo json_encode(['ok' => true]);
        return;
    }

    if ($method === 'PATCH' && $id) {
        $fields = [];
        $params = [':id' => $id];
        $allowed = ['status', 'notes', 'name', 'phone', 'email'];
        foreach ($allowed as $f) {
            if (isset($body[$f])) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $body[$f];
            }
        }
        if ($fields) {
            $pdo->prepare('UPDATE leads SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($params);
        }
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// ── Services ──────────────────────────────────────────────────────────────────

function handleServices($pdo, $method, $body) {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM services')->fetchAll();
        foreach ($rows as &$r) {
            $r['durationOptions'] = json_decode($r['durationOptions'] ?? '[]', true);
            $r['prices'] = json_decode($r['prices'] ?? '{}', true);
            $r['basePrice'] = (float)$r['basePrice'];
        }
        echo json_encode($rows);
        return;
    }

    // POST replaces entire catalog (app sends full array)
    if ($method === 'POST' && isset($body[0])) {
        $pdo->exec('DELETE FROM services');
        $stmt = $pdo->prepare('
            INSERT INTO services (id, name, description, durationOptions, prices, basePrice, image, category)
            VALUES (:id, :name, :description, :durationOptions, :prices, :basePrice, :image, :category)
        ');
        foreach ($body as $s) {
            $stmt->execute([
                ':id'             => $s['id'],
                ':name'           => $s['name'],
                ':description'    => $s['description'] ?? '',
                ':durationOptions'=> json_encode($s['durationOptions'] ?? []),
                ':prices'         => json_encode($s['prices'] ?? []),
                ':basePrice'      => (float)($s['basePrice'] ?? 0),
                ':image'          => $s['image'] ?? '',
                ':category'       => $s['category'] ?? 'Therapeutic',
            ]);
        }
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// ── Messages ──────────────────────────────────────────────────────────────────

function handleMessages($pdo, $method, $body) {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM messages ORDER BY date DESC')->fetchAll();
        echo json_encode($rows);
        return;
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('
            INSERT IGNORE INTO messages (id, name, email, message, date)
            VALUES (:id, :name, :email, :message, :date)
        ');
        $stmt->execute([
            ':id'      => $body['id'],
            ':name'    => $body['name'],
            ':email'   => $body['email'] ?? '',
            ':message' => $body['message'] ?? '',
            ':date'    => $body['date'] ?? date('Y-m-d'),
        ]);
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

// ── Settings ──────────────────────────────────────────────────────────────────

function handleSettings($pdo, $method, $body) {
    if ($method === 'GET') {
        $row = $pdo->query('SELECT * FROM settings WHERE id = 1')->fetch();
        echo json_encode($row ?: null);
        return;
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('
            UPDATE settings SET
              primaryColor    = :primaryColor,
              secondaryColor  = :secondaryColor,
              metaTitle       = :metaTitle,
              metaDescription = :metaDescription,
              instagramUrl    = :instagramUrl,
              facebookUrl     = :facebookUrl,
              announcementBar = :announcementBar
            WHERE id = 1
        ');
        $stmt->execute([
            ':primaryColor'    => $body['primaryColor'] ?? '#2D4F3E',
            ':secondaryColor'  => $body['secondaryColor'] ?? '#D4AF37',
            ':metaTitle'       => $body['metaTitle'] ?? '',
            ':metaDescription' => $body['metaDescription'] ?? '',
            ':instagramUrl'    => $body['instagramUrl'] ?? '',
            ':facebookUrl'     => $body['facebookUrl'] ?? '',
            ':announcementBar' => $body['announcementBar'] ?? '',
        ]);
        echo json_encode(['ok' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
