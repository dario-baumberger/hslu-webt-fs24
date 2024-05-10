<?php
	header("Content-Type: application/json");
	header("Access-Control-Allow-Methods: GET, POST");
	header("Access-Control-Allow-Headers: Content-Type");
	setcookie('test', '1', time() + (86400 * 30), "/");

	class Database {
		protected static $conn = null;

		function __construct() {
			if (self::$conn == null) {
				self::$conn = new PDO("mysql:host=db;port=3306;dbname=webt", "root", "root");
				self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			}
		}

		function randomID($length) {
			$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
			return substr(str_shuffle($characters), 0, $length);
		}

		function readAllDocuments() {
			$sql = "SELECT * FROM test";
			$stmt = self::$conn->prepare($sql);
			$stmt->execute();
			return $stmt->fetchAll(PDO::FETCH_ASSOC);
		}

		function readDocument($id) {
			$sql = "SELECT * FROM test WHERE place_id = ?";
			$stmt = self::$conn->prepare($sql);
			$stmt->execute([$id]);
			return $stmt->fetch(PDO::FETCH_ASSOC);
		}

		function writeDocument($data) {
			$place_id = self::randomID(11);
			$sql = 'INSERT INTO test (place_id, name, website, url, postal_code, locality, type) VALUES (:place_id, :name, :website, :url, :postal_code, :locality, :type)';
			$stmt = self::$conn->prepare($sql);
			$stmt->bindParam(':place_id', $place_id);
			$stmt->bindParam(':name', $data['name']);
			$stmt->bindParam(':website', $data['website']);
			$stmt->bindParam(':url', $data['url']);
			$stmt->bindParam(':postal_code', $data['postal_code']);
			$stmt->bindParam(':locality', $data['locality']);
			$stmt->bindParam(':type', $data['type']);
			$stmt->execute();
			return $place_id;
		}

		function updateDocument($id, $data) {
			$sql = 'UPDATE test SET name = :name WHERE place_id = :place_id';
			$stmt = self::$conn->prepare($sql);
			$stmt->bindParam(':place_id', $id);
			$stmt->bindParam(':name', $data['name']);
			$stmt->execute();
			return $stmt->rowCount() > 0;
		}

		function deleteDocument($id) {
			$sql = 'DELETE FROM test WHERE place_id = :place_id';
			$stmt = self::$conn->prepare($sql);
			$stmt->bindParam(':place_id', $id);
			$stmt->execute();
			return $stmt->rowCount() > 0;
		}
	}

	class Backend {
		protected $db;

		function __construct() {
			$this->db = new Database();
			$this->handleRequest();
		}

		function handleRequest() {
			$method = $_SERVER['REQUEST_METHOD'];
			$id = $_GET['id'] ?? null;
			switch ($method) {
				case 'GET':
					if ($id) {
						$this->handleGetSingleRequest($id);
					} else {
						$this->handleGetAllRequest();
					}
					break;
				case 'POST':
					$this->handlePostRequest();
					break;
				case 'PUT':
					$this->handlePutRequest($id);
					break;
				case 'DELETE':
					$this->handleDeleteRequest($id);
					break;
				default:
					http_response_code(405);
			}
		}

		function handleGetAllRequest() {
			$documents = $this->db->readAllDocuments();
			if (empty($documents)) {
				http_response_code(404);
				echo json_encode(['error' => 'No documents found']);
				return;
			}
			echo json_encode($documents);
		}

		function handleGetSingleRequest($id) {
			$document = $this->db->readDocument($id);
			if (!$document) {
				http_response_code(404);
				echo json_encode(['error' => 'Document not found']);
				return;
			}
			echo json_encode($document);
		}

		function handlePostRequest() {
			$body = file_get_contents("php://input");
			$json = json_decode($body, true);
			$id = $this->db->writeDocument($json);
			echo json_encode(['id' => $id]);
		}

		function handlePutRequest($id) {
			$body = file_get_contents("php://input");
			$json = json_decode($body, true);
			$updated = $this->db->updateDocument($id, $json);
			if (!$updated) {
				http_response_code(404);
				echo json_encode(['error' => 'Document not found']);
				return;
			}
			echo json_encode(['success' => true]);
		}

		function handleDeleteRequest($id) {
			$deleted = $this->db->deleteDocument($id);
			if (!$deleted) {
				http_response_code(404);
				echo json_encode(['error' => 'Document not found']);
				return;
			}
			echo json_encode(['success' => true]);
		}
	}

	$backend = new Backend();
