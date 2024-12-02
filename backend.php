<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

class Database {
	protected static $conn = null;

	/**
	 * Create a new Database instance with connection to the database
	 */
	public function __construct($host, $port, $dbname, $user, $password) {
		$this->connect($host, $port, $dbname, $user, $password);
	}

	/**
	 * Create a new connection to the database
	 */
	private function connect($host, $port, $dbname, $user, $password, $charset = "utf8") {
		if (self::$conn == null) {
			self::$conn = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=$charset", $user, $password);
			self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		}
	}

	/**
	 * Execute a query on the database
	 * @param string $sql
	 * @param array $params
	 * @return PDOStatement
	 */
	public function executeQuery($sql, $params) {
		$stmt = self::$conn->prepare($sql);
		$stmt->execute($params);
		return $stmt;
	}

	/**
	 * Get all entries from the database
	 */
	public function getAllEntries() {
		$sql = "SELECT place_id, name, url, website, locality, postal_code, type FROM locations";
		$stmt = self::$conn->prepare($sql);
		$stmt->execute();
		return ['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
	}

	/**
	 * Get a single entry from the database
	 */
	public function getEntry($id) {
		$sql = "SELECT place_id, name, url, website, locality, postal_code, type FROM locations WHERE place_id = :id";
		$stmt = $this->executeQuery($sql, ['id' => $id]);
		return ['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
	}

	/**
	 * Write a new entry to the database
	 * @param array $data
	 * @return string
	 */
	public function writeEntry($data) {
		$sql = 'INSERT INTO locations (place_id, name, website, url, postal_code, locality, type) VALUES (COALESCE(:place_id, UUID()), :name, :website, :url, :postal_code, :locality, :type)';
		$this->executeQuery($sql, $data);
		echo json_encode(['data' => "Eintrag erfolgreich hinzugefügt."]);
	}

	/**
	 * Search for entries in the database
	 * @param array $params
	 * @return array
	 */
	public function searchEntries($params) {
		try {
			$sql = "SELECT place_id, name, url, website, locality, postal_code, type FROM locations WHERE ";
			$values = [];
			foreach ($params as $key => $value) {
				$sql .= "$key = :$key AND ";
				$values[":$key"] = $value;
			}
			// remove last AND
			$sql = rtrim($sql, " AND ");
			$stmt = $this->executeQuery($sql, $values);
			return ['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
		} catch (PDOException $e) {
			http_response_code(400);
			echo json_encode(['error' => 'Ungültige Suchanfrage']);
			exit();
		}
	}

	/**
	 * Check if an entry exists in the database
	 * @param string $field
	 * @param string $value
	 * @return bool
	 */
	public function entryExists($field, $value) {
		$sql = "SELECT * FROM locations WHERE $field = :value";
		$stmt = $this->executeQuery($sql, ['value' => $value]);
		$result = $stmt->fetch(PDO::FETCH_ASSOC);
		return $result ? true : false;
	}
}

class Backend {
	protected $db;
	protected $rules = [
		'name' => ['required' => true, 'minlength' => 1],
		'postal_code' => [
			'required' => true,
			'minlength' => 4, 'maxlength' => 4, 'numeric' => true
		],
		'locality' => ['required' => true, 'minlength' => 2],
		'website' => [
			'required' => false, 'minlength' => 10,
			'url' => true
		], 'url' => [
			'required' => false,
			'minlength' => 10, 'url' => true
		],
		'place_id' => ['required' => false],
		'type' => ['required' => true]
	];

	/**
	 * Create a new Backend instance with connection to the database
	 */
	public function __construct() {
		try {
			//$this->db = new Database("db", "3306", "webt", "root", "root");
			$this->db = new Database("hslu-webt-fs24.doob.ch", "3306", "webt", "66Im_ju02", "d3@Q8x9i700Er!yi24");
			$this->handleRequest();
		} catch (Exception $e) {
			echo json_encode(['error' => 'Fehler beim Aufbau der Datenbankverbindung.']);
			http_response_code(503);
		}
	}

	/**
	 * Handle the incoming request depending on the method and endpoint
	 */
	private function handleRequest() {
		$method = $_SERVER['REQUEST_METHOD'];
		$params = $_GET;
		$id = $_GET['id'] ?? null;
		$isSearchRequest = strpos($_SERVER['REQUEST_URI'], 'api/search') !== false;
		switch ($method) {

			case 'GET':
				if ($id) {
					$this->handleGetSingleRequest($id);
				} elseif ($isSearchRequest) {
					if (!empty($params)) {
						setcookie('search', json_encode($params), time() + (3600 * 60 * 30), "/");
						$this->handleSearchRequest($params);
					} else {
						if (isset($_COOKIE['search'])) {
							unset($_COOKIE['search']);
							setcookie('search', '', time() - 3600, '/');
						}
						$this->handleGetAllRequest();
					}
				} elseif (!empty($params)) {
					$this->handleSearchRequest($params);
				} else {
					$this->handleGetAllRequest();
				}
				break;

			case 'POST':
				$this->handlePostRequest();
				break;
			default:
				http_response_code(405);
		}
	}

	/**
	 * Handle a GET request to get all entries from the database
	 */
	private function handleGetAllRequest() {
		$documents = $this->db->getAllEntries();
		if (empty($documents)) {
			echo json_encode([]);
			return;
		}
		echo json_encode($documents);
	}

	/**
	 * Handle a GET request to get a single entry from the database
	 * @param string $id
	 */
	private function handleGetSingleRequest($id) {
		$document = $this->db->getEntry($id);
		if (!$document) {
			http_response_code(404);
			echo json_encode(['error' => 'Eintrag nicht gefunden.']);
			return;
		}
		echo json_encode($document);
	}

	/**
	 * Handle a POST request to write a new entry to the database
	 */
	private function handlePostRequest() {
		try {
			$body = file_get_contents("php://input");
			$json = json_decode($body, true);
			$error = self::validateData($json, $this->rules);
			if (isset($error) && !empty($error)) {
				http_response_code(400);
				echo json_encode(['error' => $error]);
				exit();
			}
			$this->db->writeEntry($json);
		} catch (Exception $e) {
			http_response_code(500);
			echo json_encode(['error' => 'Fehler beim Bearbeiten der Anfrage.']);
			exit();
		}
	}

	/**
	 * Handle a GET request to search for entries in the database
	 * @param array $params
	 */
	private function handleSearchRequest($params) {
		$documents = $this->db->searchEntries($params);
		if (empty($documents)) {
			echo json_encode([]);
			return;
		}
		echo json_encode($documents);
	}

	/**
	 * Validate a single field based on the rules
	 * @param string $field
	 * @param array $rules
	 * @return string
	 */
	private function validateField($field, $rules) {
		if ($rules['required'] && empty($field)) {
			return $field . ': is required.';
		}
		// minlength should only be checked if field has a value. Otherwise it would always be invalid.
		// There exists field with minlength which are not required.
		if (isset($rules['minlength']) && !empty($field) && strlen($field) < $rules['minlength']) {
			return $field . ': must be at least ' . $rules['minlength'] . ' characters long.';
		}
		if (isset($rules['maxlength']) && isset($field) && strlen($field) > $rules['maxlength']) {
			return  $field . ': must be no more than ' . $rules['maxlength'] . ' characters long.';
		}
		if (isset($rules['url']) && isset($rules['required']) && $rules['required'] === true && isset($field) && !filter_var($field, FILTER_VALIDATE_URL)) {
			return $field . ': is not a valid URL.';
		}
		if (isset($rules['numeric']) && isset($field) && !is_numeric($field)) {
			return $field . ': is not a valid number.';
		}
		return '';
	}

	/**
	 * Validate all fields based on the rules
	 * @param array $data
	 * @param array $rules
	 * @return array
	 */

	private function validateData($data, $rules) {
		$errors = [];

		if ($this->db->entryExists('place_id', $data['place_id'])) {
			$errors[] = 'Das Lokal existiert bereits.';
		}

		foreach ($rules as $field => $rule) {
			$error = $this->validateField($data[$field], $rule);
			if ($error) {
				$errors[] = $field . ': ' . $error;
			}
		}

		if (isset($errors) && !empty($errors)) {
			return 'Fehlerhafte Anfrage: ' . implode("\n", $errors);
		}
	}
}

$backend = new Backend();
