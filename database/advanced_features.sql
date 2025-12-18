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
DROP PROCEDURE IF EXISTS sp_search_medicines;
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
DROP PROCEDURE IF EXISTS sp_get_low_stock;
DELIMITER //
CREATE PROCEDURE sp_get_low_stock(IN threshold INT)
BEGIN
    SELECT id, code, name, stock, price, manufacturer
    FROM medicines
    WHERE stock < threshold
    ORDER BY stock ASC;
END //
DELIMITER ;

-- 存储过程：模糊查询客户
DROP PROCEDURE IF EXISTS sp_search_customers;
DELIMITER //
CREATE PROCEDURE sp_search_customers(IN keyword VARCHAR(100))
BEGIN
    SELECT * FROM customers 
    WHERE name LIKE CONCAT('%', keyword, '%') 
       OR phone LIKE CONCAT('%', keyword, '%');
END //
DELIMITER ;

-- 存储过程：模糊查询供应商
DROP PROCEDURE IF EXISTS sp_search_suppliers;
DELIMITER //
CREATE PROCEDURE sp_search_suppliers(IN keyword VARCHAR(100))
BEGIN
    SELECT * FROM suppliers 
    WHERE name LIKE CONCAT('%', keyword, '%') 
       OR contact LIKE CONCAT('%', keyword, '%');
END //
DELIMITER ;

-- 存储过程：模糊查询销售记录 (支持订单号、药品名、客户名)
DROP PROCEDURE IF EXISTS sp_search_sales;
DELIMITER //
CREATE PROCEDURE sp_search_sales(IN keyword VARCHAR(100), IN filter_type VARCHAR(20))
BEGIN
    SELECT 
        s.*,
        m.name AS medicine_name,
        m.type AS medicine_type,
        c.name AS customer_name
    FROM sales s
    LEFT JOIN medicines m ON s.medicine_id = m.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE (s.order_id LIKE CONCAT('%', keyword, '%')
       OR m.name LIKE CONCAT('%', keyword, '%')
       OR c.name LIKE CONCAT('%', keyword, '%'))
       AND (filter_type = '' OR m.type = filter_type)
    ORDER BY s.sale_date DESC;
END //
DELIMITER ;

-- 存储过程：模糊查询入库记录 (支持药品名、供应商名)
DROP PROCEDURE IF EXISTS sp_search_inbounds;
DELIMITER //
CREATE PROCEDURE sp_search_inbounds(IN keyword VARCHAR(100))
BEGIN
    SELECT 
        i.*,
        m.name AS medicine_name,
        sup.name AS supplier_name
    FROM inbounds i
    LEFT JOIN medicines m ON i.medicine_id = m.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
    WHERE m.name LIKE CONCAT('%', keyword, '%')
       OR sup.name LIKE CONCAT('%', keyword, '%')
    ORDER BY i.inbound_date DESC;
END //
DELIMITER ;

-- 存储过程：获取某时间段的销售报表
DROP PROCEDURE IF EXISTS sp_sales_report;
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
DROP PROCEDURE IF EXISTS sp_inbound_report;
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
DROP PROCEDURE IF EXISTS sp_financial_stats;
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
        (
            (SELECT COALESCE(SUM(total_price), 0) FROM sales WHERE sale_date >= start_dt) - 
            (
                SELECT COALESCE(SUM(s.quantity * IFNULL(avg_cost.avg_price, (m.price * 0.6))), 0)
                FROM sales s
                JOIN medicines m ON s.medicine_id = m.id
                LEFT JOIN (
                    SELECT medicine_id, AVG(price) as avg_price FROM inbounds GROUP BY medicine_id
                ) avg_cost ON s.medicine_id = avg_cost.medicine_id
                WHERE s.sale_date >= start_dt
            )
        ) AS gross_profit;
END //
DELIMITER ;

-- ==================== TRIGGERS ====================

-- 触发器：销售后自动更新库存（减少）
DROP TRIGGER IF EXISTS tr_after_sale_insert;
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
DROP TRIGGER IF EXISTS tr_after_inbound_insert;
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
DROP TRIGGER IF EXISTS tr_after_sale_delete;
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
DROP TRIGGER IF EXISTS tr_after_inbound_delete;
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
DROP TRIGGER IF EXISTS tr_before_sale_check_stock;
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
DROP FUNCTION IF EXISTS fn_medicine_stock_value;
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
DROP FUNCTION IF EXISTS fn_customer_total_spent;
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
DROP FUNCTION IF EXISTS fn_medicine_monthly_sales;
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

-- ==================== ADDITIONAL VIEWS ====================

-- 普通员工药品视图（隐藏进货价）
CREATE OR REPLACE VIEW v_staff_medicines AS
SELECT 
    id, code, name, type, spec, price, stock, manufacturer, status
FROM medicines;

-- 管理员财务视图（包含成本数据）
CREATE OR REPLACE VIEW v_admin_financials AS
SELECT 
    DATE(s.sale_date) AS sale_day,
    SUM(s.total_price) AS daily_revenue,
    (SELECT COALESCE(SUM(i.price * i.quantity), 0) 
     FROM inbounds i 
     WHERE DATE(i.inbound_date) = DATE(s.sale_date)) AS daily_cost,
    SUM(s.total_price) - (SELECT COALESCE(SUM(i.price * i.quantity), 0) 
     FROM inbounds i 
     WHERE DATE(i.inbound_date) = DATE(s.sale_date)) AS daily_profit
FROM sales s
GROUP BY DATE(s.sale_date)
ORDER BY sale_day DESC;

-- 销售员视图 - 只能看到销售相关数据，隐藏客户敏感信息
CREATE OR REPLACE VIEW v_sales_staff AS
SELECT 
    s.id,
    s.order_id,
    m.name AS medicine_name,
    m.type AS medicine_type,
    s.quantity,
    s.total_price,
    s.sale_date
FROM sales s
JOIN medicines m ON s.medicine_id = m.id;

-- 库存管理员视图 - 入库和库存信息
CREATE OR REPLACE VIEW v_inventory_staff AS
SELECT 
    i.id,
    m.code AS medicine_code,
    m.name AS medicine_name,
    sup.name AS supplier_name,
    i.quantity,
    i.price AS unit_price,
    i.quantity * i.price AS total_cost,
    i.inbound_date
FROM inbounds i
JOIN medicines m ON i.medicine_id = m.id
LEFT JOIN suppliers sup ON i.supplier_id = sup.id;

-- 客户消费排行视图（用于分析）
CREATE OR REPLACE VIEW v_customer_ranking AS
SELECT 
    c.id,
    c.name,
    COUNT(s.id) AS order_count,
    COALESCE(SUM(s.total_price), 0) AS total_spent
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;

-- ==================== ADDITIONAL STORED PROCEDURES ====================

-- 存储过程：按日期范围统计销售趋势
DROP PROCEDURE IF EXISTS sp_sales_trend;
DELIMITER //
CREATE PROCEDURE sp_sales_trend(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        DATE(sale_date) AS sale_day,
        COUNT(*) AS order_count,
        SUM(quantity) AS total_quantity,
        SUM(total_price) AS total_revenue
    FROM sales
    WHERE DATE(sale_date) BETWEEN start_date AND end_date
    GROUP BY DATE(sale_date)
    ORDER BY sale_day;
END //
DELIMITER ;

-- 存储过程：获取热销药品排行 (增加动态排序支持)
DROP PROCEDURE IF EXISTS sp_top_selling_medicines;
DELIMITER //
CREATE PROCEDURE sp_top_selling_medicines(
    IN start_date DATE, 
    IN end_date DATE, 
    IN limit_count INT,
    IN sort_column VARCHAR(50),
    IN sort_order VARCHAR(10)
)
BEGIN
    SELECT 
        m.id,
        m.code,
        m.name,
        m.type,
        SUM(s.quantity) AS total_sold,
        SUM(s.total_price) AS total_revenue
    FROM medicines m
    JOIN sales s ON m.id = s.medicine_id
    WHERE DATE(s.sale_date) BETWEEN start_date AND end_date
    GROUP BY m.id, m.code, m.name, m.type
    ORDER BY 
        CASE WHEN sort_column = 'total_sold' AND sort_order = 'DESC' THEN SUM(s.quantity) END DESC,
        CASE WHEN sort_column = 'total_sold' AND sort_order = 'ASC' THEN SUM(s.quantity) END ASC,
        CASE WHEN sort_column = 'total_revenue' AND sort_order = 'DESC' THEN SUM(s.total_price) END DESC,
        CASE WHEN sort_column = 'total_revenue' AND sort_order = 'ASC' THEN SUM(s.total_price) END ASC,
        -- Default sort if none matches
        SUM(s.quantity) DESC
    LIMIT limit_count;
END //
DELIMITER ;

-- 存储过程：用户搜索（模糊查询用户名/姓名）
DROP PROCEDURE IF EXISTS sp_search_users;
DELIMITER //
CREATE PROCEDURE sp_search_users(IN keyword VARCHAR(100))
BEGIN
    SELECT id, username, real_name, phone, role, created_at 
    FROM users 
    WHERE username LIKE CONCAT('%', keyword, '%') 
       OR real_name LIKE CONCAT('%', keyword, '%');
END //
DELIMITER ;

-- ==================== PERMISSIONS & ROLES ====================
-- 注意：以下 SQL 语句用于课程设计报告展示。
-- 在实际环境中需要 ROOT 权限执行，Docker 环境可能无法直接执行。

-- ========== 创建角色 ==========
-- DROP ROLE IF EXISTS 'role_admin';
-- DROP ROLE IF EXISTS 'role_staff';
-- DROP ROLE IF EXISTS 'role_viewer';

-- CREATE ROLE 'role_admin';
-- CREATE ROLE 'role_staff';
-- CREATE ROLE 'role_viewer';

-- ========== 管理员角色权限 (全部权限) ==========
-- GRANT ALL PRIVILEGES ON pharmacy_db.* TO 'role_admin';

-- ========== 普通员工角色权限 ==========
-- 可以查看药品、客户、供应商
-- GRANT SELECT ON pharmacy_db.v_staff_medicines TO 'role_staff';
-- GRANT SELECT ON pharmacy_db.customers TO 'role_staff';
-- GRANT SELECT ON pharmacy_db.suppliers TO 'role_staff';

-- 可以插入销售记录和入库记录
-- GRANT INSERT ON pharmacy_db.sales TO 'role_staff';
-- GRANT INSERT ON pharmacy_db.inbounds TO 'role_staff';

-- 可以执行搜索存储过程
-- GRANT EXECUTE ON PROCEDURE pharmacy_db.sp_search_medicines TO 'role_staff';
-- GRANT EXECUTE ON PROCEDURE pharmacy_db.sp_search_customers TO 'role_staff';
-- GRANT EXECUTE ON PROCEDURE pharmacy_db.sp_search_sales TO 'role_staff';

-- ========== 访客角色权限 (只读) ==========
-- GRANT SELECT ON pharmacy_db.v_staff_medicines TO 'role_viewer';
-- GRANT SELECT ON pharmacy_db.v_sales_staff TO 'role_viewer';

-- ========== 创建用户并分配角色 ==========
-- CREATE USER 'admin_user'@'%' IDENTIFIED BY 'Admin@123';
-- GRANT 'role_admin' TO 'admin_user'@'%';
-- SET DEFAULT ROLE 'role_admin' TO 'admin_user'@'%';

-- CREATE USER 'staff_zhangsan'@'%' IDENTIFIED BY 'Staff@123';
-- GRANT 'role_staff' TO 'staff_zhangsan'@'%';
-- SET DEFAULT ROLE 'role_staff' TO 'staff_zhangsan'@'%';

-- CREATE USER 'viewer_guest'@'%' IDENTIFIED BY 'Guest@123';
-- GRANT 'role_viewer' TO 'viewer_guest'@'%';
-- SET DEFAULT ROLE 'role_viewer' TO 'viewer_guest'@'%';

-- ========== 刷新权限 ==========
-- FLUSH PRIVILEGES;

SELECT 'Advanced database features (Views, SPs, Permissions) created successfully!' AS Status;

