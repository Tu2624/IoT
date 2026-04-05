-- Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS iot_dashboard DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_dashboard;

-- Bảng người dùng (Từ Figma Profile)
CREATE TABLE IF NOT EXISTS NGUOI_DUNG (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu giả định người dùng quản trị (Chỉ để demo nếu có chức năng liên quan)
INSERT IGNORE INTO NGUOI_DUNG (user_id, username, full_name, student_id, role) 
VALUES (1, 'tuvu', 'Vũ Đình Tú', 'B22DCPT244', 'Administrator');

-- Bảng lưu trữ lịch sử dữ liệu cảm biến (DataSensor)
CREATE TABLE IF NOT EXISTS LICH_SU_DU_LIEU (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    temp FLOAT NOT NULL,
    humi FLOAT NOT NULL,
    lux FLOAT NOT NULL,
    recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recorded_date (recorded_date DESC)
);

-- Bảng lưu trữ lịch sử thao tác bật tắt (ActionHistory)
CREATE TABLE IF NOT EXISTS BAO_CAO_BAO_MAT (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'online', 'offline', 'waiting'
    description TEXT,
    user_id INT, -- Có thể NULL nếu hành động tự động
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES NGUOI_DUNG(user_id) ON DELETE SET NULL,
    INDEX idx_report_date (report_date DESC),
    INDEX idx_device_name (device_name)
);

-- Bảng trạng thái hiện tại của từng thiết bị (để đồng bộ Frontend)
CREATE TABLE IF NOT EXISTS TRANG_THAI_THIET_BI (
    device_key VARCHAR(30) PRIMARY KEY,  -- 'led_temp', 'led_humi', 'led_bh'
    device_name VARCHAR(50) NOT NULL,    -- 'LED_NHIET_DO', 'LED_DO_AM', 'LED_ANH_SANG'
    is_on TINYINT(1) DEFAULT 1,          -- 1 = On, 0 = Off
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Khởi tạo trạng thái mặc định cho các thiết bị
INSERT IGNORE INTO TRANG_THAI_THIET_BI (device_key, device_name, is_on) VALUES
('led_temp', 'LED_NHIET_DO', 1),
('led_humi', 'LED_DO_AM', 1),
('led_bh', 'LED_ANH_SANG', 1);
