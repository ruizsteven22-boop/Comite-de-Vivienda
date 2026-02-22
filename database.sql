-- Base de Datos: Tierra Esperanza
-- Generado para restauración de sistema

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'soporte', 'soporte.password', 'SUPPORT', 'Soporte Técnico');
INSERT INTO `users` VALUES ('2', 'admin', 'Lio061624', 'ADMINISTRATOR', 'Administrador');
INSERT INTO `users` VALUES ('3', 'presi', 'te2024', 'PRESIDENT', 'Presidente');
INSERT INTO `users` VALUES ('4', 'teso', 'te2024', 'TREASURER', 'Tesorero');
INSERT INTO `users` VALUES ('5', 'secre', 'te2024', 'SECRETARY', 'Secretario');

-- ----------------------------
-- Table structure for config
-- ----------------------------
DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `legalName` varchar(255) DEFAULT NULL,
  `tradeName` varchar(255) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `municipalRes` varchar(255) DEFAULT NULL,
  `legalRes` varchar(255) DEFAULT NULL,
  `language` varchar(10) DEFAULT 'es',
  `logoUrl` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of config
-- ----------------------------
INSERT INTO `config` VALUES (1, 'Comité de Vivienda Tierra Esperanza', 'Tierra Esperanza', '76.123.456-7', 'contacto@tierraesperanza.cl', '+56 9 1234 5678', 'Res. Exenta N° 456/2023', 'Pers. Jurídica N° 7890-S', 'es', '');

-- ----------------------------
-- Table structure for members
-- ----------------------------
DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` varchar(50) NOT NULL,
  `rut` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `joinDate` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `comuna` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `photoUrl` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut` (`rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` varchar(50) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `referenceNumber` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `memberId` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for board
-- ----------------------------
DROP TABLE IF EXISTS `board`;
CREATE TABLE `board` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(100) NOT NULL,
  `primary_name` varchar(255) DEFAULT NULL,
  `primary_rut` varchar(20) DEFAULT NULL,
  `primary_phone` varchar(50) DEFAULT NULL,
  `substitute_name` varchar(255) DEFAULT NULL,
  `substitute_rut` varchar(20) DEFAULT NULL,
  `substitute_phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of board
-- ----------------------------
INSERT INTO `board` VALUES (1, 'Presidente', 'Juan Pérez', '12.345.678-9', '+56912345678', '', '', '');
INSERT INTO `board` VALUES (2, 'Secretario', 'María López', '15.678.901-2', '+56987654321', '', '', '');
INSERT INTO `board` VALUES (3, 'Tesorero', 'Carlos Ruiz', '18.901.234-5', '+56955566677', '', '', '');

-- ----------------------------
-- Table structure for assemblies
-- ----------------------------
DROP TABLE IF EXISTS `assemblies`;
CREATE TABLE `assemblies` (
  `id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `summonsTime` varchar(10) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `startTime` varchar(10) DEFAULT NULL,
  `observations` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for documents
-- ----------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` varchar(50) NOT NULL,
  `folioNumber` int(11) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `addressee` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `lastUpdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
