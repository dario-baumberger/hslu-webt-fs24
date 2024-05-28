<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

class Database {
	protected static $conn = null;

	public function __construct() {
		if (self::$conn == null) {
			self::$conn = new PDO("mysql:host=db;port=3306;dbname=webt", "root", "root");
			self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		}
	}

	private function randomID($length) {
		$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		return substr(str_shuffle($characters), 0, $length);
	}

	public function get_all_entries() {
		$sql = "SELECT * FROM test";
		$stmt = self::$conn->prepare($sql);
		$stmt->execute();
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function get_entry($id) {
		$sql = "SELECT * FROM test WHERE place_id = ?";
		$stmt = self::$conn->prepare($sql);
		$stmt->execute([$id]);
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	public function write_entry($data) {
		$data['place_id'] = self::randomID(11);
		$sql = 'INSERT INTO test (place_id, name, website, url, postal_code, locality, type) VALUES (:place_id, :name, :website, :url, :postal_code, :locality, :type)';
		$stmt = self::$conn->prepare($sql);
		$stmt->execute($data);
		return $data['place_id'];
	}

	public function update_entry($id, $data) {
		$sql = 'UPDATE test SET name = :name WHERE place_id = :place_id';
		$stmt = self::$conn->prepare($sql);
		$stmt->bindParam(':place_id', $id);
		$stmt->bindParam(':name', $data['name']);
		$stmt->execute();
		return $stmt->rowCount() > 0;
	}

	public function delet_entry($id) {
		$sql = 'DELETE FROM test WHERE place_id = :place_id';
		$stmt = self::$conn->prepare($sql);
		$stmt->bindParam(':place_id', $id);
		$stmt->execute();
		return $stmt->rowCount() > 0;
	}

	public function search_entries($params) {
		try {
			$sql = "SELECT * FROM test WHERE ";
			$values = [];
			foreach ($params as $key => $value) {
				$sql .= "$key = :$key AND ";
				$values[":$key"] = $value;
			}
			$sql = rtrim($sql, " AND ");
			$stmt = self::$conn->prepare($sql);
			$stmt->execute($values);
			return $stmt->fetchAll(PDO::FETCH_ASSOC);
		} catch (PDOException $e) {
			http_response_code(400);
			echo json_encode(['error' => 'Invalid request']);
			exit();
		}
	}
}

class Backend {
	protected $db;
	protected $rules = ['name' => ['required' => true, 'minlength' => 1], 'postal_code' => ['required' => true, 'minlength' => 3, 'maxlength' => 6], 'locality' => ['required' => true, 'minlength' => 2], 'website' => ['required' => false, 'minlength' => 3, 'maxlength' => 100], 'url' => ['required' => false], 'place_id' => ['required' => false], 'type' => ['required' => true]];

	function __construct() {
		$this->db = new Database();
		$this->handleRequest();
	}

	private function handleRequest() {
		$method = $_SERVER['REQUEST_METHOD'];
		$params = $_GET;
		$id = $_GET['id'] ?? null;
		switch ($method) {
			case 'GET':
				if ($id) {
					$this->handleGetSingleRequest($id);
				} elseif (!empty($params)) {
					$this->handleSearchRequest($params);
				} /* elseif (isset($_COOKIE['search']) && !empty($_COOKIE['search'])) {
					$searchParams = json_decode($_COOKIE['search'], true);
					$this->handleSearchRequest($searchParams);
				} */ else {
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

	private function handleGetAllRequest() {
		$documents = $this->db->get_all_entries();
		if (empty($documents)) {
			echo json_encode([]);
			return;
		}
		echo json_encode($documents);
	}

	private function handleGetSingleRequest($id) {
		$document = $this->db->get_entry($id);
		if (!$document) {
			http_response_code(404);
			echo json_encode(['error' => 'Document not found']);
			return;
		}
		echo json_encode($document);
	}

	private function handlePostRequest() {
		try {
			$body = file_get_contents("php://input");
			$json = json_decode($body, true);
			self::validateData($json, $this->rules);
			if (!$this->db->write_entry($json)) {
				http_response_code(400);
				throw new Exception('Failed to write entry to database');
			}
			http_response_code(200);
			echo json_encode($json);
		} catch (Exception $e) {
			http_response_code(400);
			echo json_encode(['error' => $e->getMessage()]);
			exit();
		}
	}

	private function handleSearchRequest($params) {
		$cookie = [];
		foreach ($params as $key => $value) {
			$cookie["$key"] = $value;
		}
		setcookie('search', json_encode($cookie), time() + (3600 * 60 * 30), "/");
		$documents = $this->db->search_entries($params);
		if (empty($documents)) {
			echo json_encode([]);
			return;
		}
		echo json_encode($documents);
	}

	private function validateField($field, $rules) {
		if ($rules['required'] && empty($field)) {
			return 'This field is required.';
		}
		if (isset($rules['minlength']) && isset($field) && strlen($field) < $rules['minlength']) {
			return 'This field must be at least ' . $rules['minlength'] . ' characters long.';
		}
		if (isset($rules['maxlength']) && isset($field) && strlen($field) > $rules['maxlength']) {
			return 'This field must be no more than ' . $rules['maxlength'] . ' characters long.';
		}
		return '';
	}

	private function validateData($data, $rules) {
		$errors = [];
		foreach ($rules as $field => $rule) {
			$error = $this->validateField($data[$field], $rule);
			if ($error) {
				$errors[$field] = $error;
			}
		}
		return $errors;
	}
}

$backend = new Backend();
