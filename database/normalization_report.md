# 数据库设计报告

## 3. 逻辑结构设计

### 3.1 这里是从 E-R 图向关系模型的转换
本系统包含以下主要实体及其关系：

1.  **Users (员工)**: 包含用户ID、用户名、密码、角色。
2.  **Medicines (药品)**: 包含药品ID、编码、名称、类型、规格、价格、库存、厂家。
3.  **Suppliers (供应商)**: 包含供应商ID、名称、联系人、电话。
4.  **Customers (客户)**: 包含客户ID、姓名、电话。
5.  **Inbounds (入库)**: 关联 药品 和 供应商。
6.  **Sales (销售)**: 关联 药品 和 客户。

### 3.2 关系模式与范式分析 (BCNF)

我们对主要关系模式进行范式分析，目标是达到 **BCNF (Boyce-Codd Normal Form)**。

#### (1) Medicines (药品表)
*   **模式**: `(id, code, name, type, spec, price, stock, manufacturer)`
*   **函数依赖**:
    *   `id -> {code, name, type, ...}` (主键决定所有属性)
    *   `code -> {name, type, ...}` (药品编码也是唯一的候选键)
*   **分析**:
    *   所有非主属性完全依赖于候选键。
    *   不存在传递依赖。
    *   每一个决定因素（`id`, `code`）都包含候选键。
*   **结论**: 符合 **BCNF**。

#### (2) Sales (销售表)
*   **模式**: `(id, order_id, medicine_id, customer_id, quantity, total_price, sale_date)`
*   **函数依赖**:
    *   `id -> {order_id, medicine_id, ...}`
    *   `order_id` (业务流水号) 在单次交易中唯一标识一条记录（本系统假设一单一种药，或通过拆单实现）。
*   **分析**:
    *   不存在主属性对码的部分依赖或传递依赖。
*   **结论**: 符合 **BCNF**。

#### (3) Inbounds (入库表)
*   类似 Sales 表，`id` 为主键，关联 `medicine_id` 和 `supplier_id`。符合 **BCNF**。

### 3.3 用户子模式 (视图设计)

为了满足不同角色的访问需求并实现权限控制，我们设计了以下视图：

| 视图名称 | 用途 | 适用角色 |
|---------|------|---------|
| `v_staff_medicines` | 药品基本信息（隐藏成本） | 普通员工 |
| `v_sales_staff` | 销售记录（隐藏客户敏感信息） | 销售员 |
| `v_inventory_staff` | 入库和库存信息 | 库存管理员 |
| `v_admin_financials` | 财务统计视图（含成本/利润） | 管理员 |
| `v_customer_ranking` | 客户消费排行 | 管理员 |

## 4. 物理结构设计

### 4.1 字段类型选择
*   `DECIMAL(10, 2)`: 用于 `price`, `total_price`。选择 `DECIMAL` 而非 `FLOAT` 是因为财务金额要求精确计算，避免浮点数误差。
*   `VARCHAR(x)`: 用于姓名、地址。根据实际业务长度预估，避免空间浪费。
*   `BIGINT`: 用于 `id` 主键，确保数据量增长后主键够用。

### 4.2 索引设计
*   **主键索引 (Primary Key)**: 所有表都在 `id` 上建立了聚簇索引。
*   **唯一索引 (Unique Index)**: 
    *   `users(username)`: 保证用户名唯一，加快登录查询。
    *   `medicines(code)`: 保证药品编码唯一，加快扫码查询。
*   **普通索引 (Index)**:
    *   `medicines(name)`: **B-Tree 索引**。因为常用的模糊查询 `LIKE '王%'` 或 `LIKE '%感冒%'` 在特定数据库优化下可利用索引（前缀匹配），B-Tree 适合范围查询和排序。
    *   `sales(sale_date)`: 加快按日期范围统计报表的速度。

### 4.3 完整性约束
*   **实体完整性**: 主键非空且唯一。
*   **参照完整性**: 
    *   `sales.medicine_id` -> `medicines.id` (外键约束)。
    *   `sales.customer_id` -> `customers.id` (外键约束)。
*   **域完整性**: `role` 字段默认为 'staff'，`status` 默认为 'active'。

## 5. 触发器 SQL 脚本

```sql
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
```

## 6. 存储过程 SQL 脚本

```sql
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

-- 存储过程：模糊查询销售记录
DELIMITER //
CREATE PROCEDURE sp_search_sales(IN keyword VARCHAR(100))
BEGIN
    SELECT s.*, m.name AS medicine_name, m.type AS medicine_type, c.name AS customer_name
    FROM sales s
    LEFT JOIN medicines m ON s.medicine_id = m.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.order_id LIKE CONCAT('%', keyword, '%')
       OR m.name LIKE CONCAT('%', keyword, '%')
       OR c.name LIKE CONCAT('%', keyword, '%')
    ORDER BY s.sale_date DESC;
END //
DELIMITER ;

-- 存储过程：财务统计
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
        (SELECT COALESCE(SUM(price * quantity), 0) FROM inbounds WHERE inbound_date >= start_dt) AS purchase_cost;
END //
DELIMITER ;
```

## 7. 函数 SQL 脚本

```sql
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
```

## 8. 视图 SQL 脚本

```sql
-- 普通员工药品视图（隐藏进货价）
CREATE OR REPLACE VIEW v_staff_medicines AS
SELECT id, code, name, type, spec, price, stock, manufacturer, status
FROM medicines;

-- 销售员视图 - 隐藏客户敏感信息
CREATE OR REPLACE VIEW v_sales_staff AS
SELECT s.id, s.order_id, m.name AS medicine_name, m.type AS medicine_type,
       s.quantity, s.total_price, s.sale_date
FROM sales s
JOIN medicines m ON s.medicine_id = m.id;

-- 管理员财务视图
CREATE OR REPLACE VIEW v_admin_financials AS
SELECT DATE(s.sale_date) AS sale_day, SUM(s.total_price) AS daily_revenue
FROM sales s
GROUP BY DATE(s.sale_date)
ORDER BY sale_day DESC;
```

## 9. 权限控制 SQL 脚本

```sql
-- 创建角色
CREATE ROLE 'role_admin';
CREATE ROLE 'role_staff';
CREATE ROLE 'role_viewer';

-- 管理员权限
GRANT ALL PRIVILEGES ON pharmacy_db.* TO 'role_admin';

-- 普通员工权限
GRANT SELECT ON pharmacy_db.v_staff_medicines TO 'role_staff';
GRANT SELECT ON pharmacy_db.customers TO 'role_staff';
GRANT INSERT ON pharmacy_db.sales TO 'role_staff';
GRANT EXECUTE ON PROCEDURE pharmacy_db.sp_search_medicines TO 'role_staff';

-- 访客权限（只读）
GRANT SELECT ON pharmacy_db.v_staff_medicines TO 'role_viewer';

-- 创建用户并分配角色
CREATE USER 'staff_zhangsan'@'%' IDENTIFIED BY 'Staff@123';
GRANT 'role_staff' TO 'staff_zhangsan'@'%';
SET DEFAULT ROLE 'role_staff' TO 'staff_zhangsan'@'%';

FLUSH PRIVILEGES;
```

## 10. 事务示例

```sql
-- 销售事务：确保库存检查和扣减的原子性
START TRANSACTION;

-- 检查库存
SELECT stock INTO @current_stock FROM medicines WHERE id = 1 FOR UPDATE;

-- 验证库存充足
IF @current_stock >= 10 THEN
    -- 创建销售记录
    INSERT INTO sales (order_id, medicine_id, customer_id, quantity, total_price)
    VALUES ('ORD-20231215001', 1, 1, 10, 150.00);
    
    -- 更新库存（由触发器自动完成，此处仅作说明）
    COMMIT;
ELSE
    ROLLBACK;
    SELECT '库存不足' AS error;
END IF;
```

