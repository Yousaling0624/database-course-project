USE pharma_db;

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
