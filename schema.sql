-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Jun 12, 2024 at 09:32 PM
-- Server version: 10.4.32-MariaDB-1:10.4.32+maria~ubu2004-log
-- PHP Version: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `webt`
--

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `place_id` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `name` text NOT NULL,
  `url` text NOT NULL,
  `website` text NOT NULL,
  `locality` text NOT NULL,
  `postal_code` text NOT NULL,
  `type` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`place_id`, `timestamp`, `name`, `url`, `website`, `locality`, `postal_code`, `type`) VALUES
('ChIJwUDPAcQ5jkcRjJ146wU1iWE', '2024-06-11 23:03:29', 'Lorenzini Ristorante & Bar', 'https://maps.google.com/?cid=7028206993030028684', 'http://www.lorenzini.ch/', 'Bern', '3011', 'Vegan'),
('ChIJB-pYQ1KhmkcR5lkdLsxsPqw', '2024-06-11 23:10:57', 'Zurichberg Restaurant', 'https://maps.google.com/?cid=12411477247282469350', 'https://www.zuerichberg.ch/kontakt-oeffnungszeiten', 'Zürich', '8044', 'Vegan und Glutenfrei'),
('ChIJ2VDXOvnXkUcRyn39btZUpNs', '2024-06-12 17:47:45', 'Genossenschaft Kreuz Solothurn', 'https://maps.google.com/?cid=15826868270448606666', 'https://www.kreuz-solothurn.ch/', 'Solothurn', '4500', 'Glutenfrei'),
('ChIJcdLNs365kUcRBPA-19NySuc', '2024-06-12 17:50:08', 'HANS IM GLÜCK - BASEL Steinenvorstadt', 'https://maps.google.com/?cid=16666259625212833796', 'https://hansimglueck-burgergrill.de/burger-restaurant/basel-steinenvorstadt/?utm_source=google&utm_medium=yext&utm_campaign=88', 'Basel', '4051', 'Glutenfrei'),
('ChIJmXab8p_7j0cR-vDnr3WXCl8', '2024-06-12 18:02:50', 'Wirtshaus Taube Luzern', 'https://maps.google.com/?cid=6848452715088441594', 'http://www.taube-luzern.ch/', 'Luzern', '6003', 'Vegan'),
('ChIJgSHWWvA5jkcRvnBNhWBkFuk', '2024-06-12 18:35:41', 'Il Profeta', 'https://maps.google.com/?cid=16795722226040926398', 'http://www.ilprofeta.ch/', 'Bern', '3014', 'Glutenfrei'),
('ChIJeXm93wQKkEcR9MeSrdfl2LI', '2024-06-12 18:39:05', 'Bernerhof', 'https://maps.google.com/?cid=12887303048213481460', 'https://www.bernerhof-zuerich.ch/', 'Zürich', '8004', 'Glutenfrei'),
('ChIJWfJ_ovw5jkcRbC19phRjokk', '2024-06-12 18:48:57', 'McDonald\'s Restaurant', 'https://maps.google.com/?cid=5305912251339582828', 'https://www.mcdonalds.ch/de/restaurants/bern-wankdorf?utm_source=google&utm_medium=Yext&utm_campaign=780101', 'Bern', '3014', 'Vegan und Glutenfrei'),
('ChIJkxO6vTMujEcR9e0AvTTR5JQ', '2024-06-12 18:53:28', 'Laduree Lausanne Bourg', 'https://maps.google.com/?cid=10728930236742823413', 'https://www.laduree.ch/', 'Lausanne', '1001', 'Vegan und Glutenfrei'),
('ChIJp39zKtk1j0cR2jZm5oqJnnc', '2024-06-12 18:56:04', 'Zermatterstübli', 'https://maps.google.com/?cid=8619477966497658586', 'http://www.legitan.ch/', 'Zermatt', '3920', 'Vegan und Glutenfrei'),
('ChIJZchcqjoLkEcRXQk4LidRICM', '2024-06-12 18:58:33', 'Veganitas', 'https://maps.google.com/?cid=2531112219303217501', 'http://www.veganitas.com/', 'Zürich', '8004', 'Vegan und Glutenfrei');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD UNIQUE KEY `gid` (`place_id`) USING HASH;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
