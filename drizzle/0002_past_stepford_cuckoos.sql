CREATE TABLE `service_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableNumber` varchar(20) NOT NULL,
	`message` varchar(255) NOT NULL DEFAULT '需要服務',
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `service_requests_id` PRIMARY KEY(`id`)
);
