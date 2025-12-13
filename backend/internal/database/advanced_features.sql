-- Pharmaceutical Sales Management System - Advanced Database Features
-- Triggers, Stored Procedures, and Views

-- ==================== VIEWS ====================

-- 药品库存视图：显示药品详细信息和库存状态
CREATE OR REPLACE VIEW v_medicine_inventory AS
SELECT 
    m.id,
    m.code,
    m.name,
    m.type,
    m.spec,
    m.price,
    m.stock,
    m.manufacturer,
    m.status,
    CASE 
        WHEN m.stock = 0 THEN '缺货'
        WHEN m.stock < 50 THEN '库存不足'
        ELSE '库存充足'
    END AS stock_status,
    m.price * m.stock AS stock_value
FROM medicines m;

-- 销售汇总视图：按药品统计销售情况
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.code AS medicine_code,
    COUNT(s.id) AS sale_count,
    SUM(s.quantity) AS total_quantity,
    SUM(s.total_price) AS total_revenue,
    AVG(s.total_price) AS avg_order_value
FROM medicines m
LEFT JOIN sales s ON m.id = s.medicine_id
GROUP BY m.id, m.name, m.code;

-- 入库汇总视图：按供应商统计入库情况
CREATE OR REPLACE VIEW v_inbound_summary AS
SELECT 
    sup.id AS supplier_id,
    sup.name AS supplier_name,
    sup.contact,
    COUNT(i.id) AS inbound_count,
    SUM(i.quantity) AS total_quantity,
    SUM(i.price * i.quantity) AS total_cost
FROM suppliers sup
LEFT JOIN inbounds i ON sup.id = i.supplier_id
GROUP BY sup.id, sup.name, sup.contact;

-- 客户消费视图：按客户统计消费情况
CREATE OR REPLACE VIEW v_customer_purchases AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone,
    COUNT(s.id) AS order_count,
    SUM(s.quantity) AS total_quantity,
    SUM(s.total_price) AS total_spent
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.phone;

-- 每日销售报表视图
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(sale_date) AS sale_day,
    COUNT(*) AS order_count,
    SUM(quantity) AS total_quantity,
    SUM(total_price) AS total_revenue
FROM sales
GROUP BY DATE(sale_date)
ORDER BY sale_day DESC;

-- ==================== STORED PROCEDURES ====================

-- 存储过程：模糊查询药品
DELIMITER //
CREATE PROCEDURE sp_search_medicines(IN keyword VARCHAR(100))
BEGIN
    SELECT * FROM medicines 
    WHERE name LIKE CONCAT('%', keyword, '%') 
       OR code LIKE CONCAT('%', keyword, '%')
       OR manufacturer LIKE CONCAT('%', keyword, '%');
END //
DELIMITER ;

-- 存储过程：获取库存不足的药品
DELIMITER //
CREATE PROCEDURE sp_get_low_stock(IN threshold INT)
BEGIN
    SELECT id, code, name, stock, price, manufacturer
    FROM medicines
    WHERE stock < threshold
    ORDER BY stock ASC;
END //
DELIMITER ;

-- 存储过程：获取某时间段的销售报表
DELIMITER //
CREATE PROCEDURE sp_sales_report(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        s.id,
        s.order_id,
        m.name AS medicine_name,
        c.name AS customer_name,
        s.quantity,
        s.total_price,
        s.sale_date
    FROM sales s
    LEFT JOIN medicines m ON s.medicine_id = m.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE DATE(s.sale_date) BETWEEN start_date AND end_date
    ORDER BY s.sale_date DESC;
END //
DELIMITER ;

-- 存储过程：获取某时间段的入库报表
DELIMITER //
CREATE PROCEDURE sp_inbound_report(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        i.id,
        m.name AS medicine_name,
        sup.name AS supplier_name,
        i.quantity,
        i.price,
        i.price * i.quantity AS total_cost,
        i.inbound_date
    FROM inbounds i
    LEFT JOIN medicines m ON i.medicine_id = m.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
    WHERE DATE(i.inbound_date) BETWEEN start_date AND end_date
    ORDER BY i.inbound_date DESC;
END //
DELIMITER ;

-- 存储过程：计算财务统计
DELIMITER //
CREATE PROCEDURE sp_financial_stats(IN report_type VARCHAR(10))
BEGIN
    DECLARE start_dt DATETIME;
    
    IF report_type = 'daily' THEN
        SET start_dt = CURDATE();
    ELSE
        SET start_dt = DATE_FORMAT(NOW(), '%Y-%m-01');
    END IF;
    
    SELECT 
        report_type AS period_type,
        start_dt AS period_start,
        (SELECT COALESCE(SUM(total_price), 0) FROM sales WHERE sale_date >= start_dt) AS sales_income,
        (SELECT COALESCE(SUM(price * quantity), 0) FROM inbounds WHERE inbound_date >= start_dt) AS purchase_cost,
        (SELECT COALESCE(SUM(total_price), 0) FROM sales WHERE sale_date >= start_dt) - 
        (SELECT COALESCE(SUM(price * quantity), 0) FROM inbounds WHERE inbound_date >= start_dt) AS gross_profit;
END //
DELIMITER ;

-- ==================== TRIGGERS ====================

-- 触发器：销售后自动更新库存（减少）
DELIMITER //
CREATE TRIGGER tr_after_sale_insert
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET stock = stock - NEW.quantity 
    WHERE id = NEW.medicine_id;
END //
DELIMITER ;

-- 触发器：入库后自动更新库存（增加）
DELIMITER //
CREATE TRIGGER tr_after_inbound_insert
AFTER INSERT ON inbounds
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET stock = stock + NEW.quantity 
    WHERE id = NEW.medicine_id;
END //
DELIMITER ;

-- 触发器：删除销售记录时恢复库存
DELIMITER //
CREATE TRIGGER tr_after_sale_delete
AFTER DELETE ON sales
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET stock = stock + OLD.quantity 
    WHERE id = OLD.medicine_id;
END //
DELIMITER ;

-- 触发器：删除入库记录时减少库存
DELIMITER //
CREATE TRIGGER tr_after_inbound_delete
AFTER DELETE ON inbounds
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET stock = stock - OLD.quantity 
    WHERE id = OLD.medicine_id;
END //
DELIMITER ;

-- 触发器：防止库存变为负数
DELIMITER //
CREATE TRIGGER tr_before_sale_check_stock
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
    DECLARE current_stock INT;
    SELECT stock INTO current_stock FROM medicines WHERE id = NEW.medicine_id;
    IF current_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '库存不足，无法完成销售';
    END IF;
END //
DELIMITER ;

-- ==================== FUNCTIONS ====================

-- 函数：计算药品库存价值
DELIMITER //
CREATE FUNCTION fn_medicine_stock_value(med_id INT) 
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE value DECIMAL(10, 2);
    SELECT price * stock INTO value FROM medicines WHERE id = med_id;
    RETURN COALESCE(value, 0);
END //
DELIMITER ;

-- 函数：获取客户总消费金额
DELIMITER //
CREATE FUNCTION fn_customer_total_spent(cust_id INT) 
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10, 2);
    SELECT COALESCE(SUM(total_price), 0) INTO total FROM sales WHERE customer_id = cust_id;
    RETURN total;
END //
DELIMITER ;

-- 函数：获取药品本月销售量
DELIMITER //
CREATE FUNCTION fn_medicine_monthly_sales(med_id INT) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE qty INT;
    SELECT COALESCE(SUM(quantity), 0) INTO qty 
    FROM sales 
    WHERE medicine_id = med_id 
    AND YEAR(sale_date) = YEAR(NOW()) 
    AND MONTH(sale_date) = MONTH(NOW());
    RETURN qty;
END //
DELIMITER ;

SELECT 'Advanced database features created successfully!' AS Status;
