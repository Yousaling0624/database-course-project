package api

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yousaling0624/database-course-project/backend/internal/config"
	"github.com/yousaling0624/database-course-project/backend/internal/database"
	"github.com/yousaling0624/database-course-project/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
)

// Auth
func Login(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If database is not connected, allow admin/password login
	if !database.IsConnected {
		if req.Username == "admin" && req.Password == "password" {
			c.JSON(http.StatusOK, gin.H{
				"message": "Login successful (offline mode)",
				"token":   "offline-token",
				"user": gin.H{
					"id":        0,
					"username":  "admin",
					"real_name": "Administrator",
					"role":      "admin",
				},
			})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Database not connected. Only admin can login."})
		return
	}

	var user model.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   "dummy-token",
		"user":    user,
	})
}

// ==================== Users ====================
func GetUsers(c *gin.Context) {
	var users []model.User
	database.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

func CreateUser(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user model.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input model.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.Username = input.Username
	user.RealName = input.RealName
	user.Phone = input.Phone
	user.Role = input.Role
	if input.Password != "" {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hashedPassword)
	}

	database.DB.Save(&user)
	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// ==================== Medicines ====================
func GetMedicines(c *gin.Context) {
	var meds []model.Medicine
	search := c.Query("search")

	query := database.DB.Model(&model.Medicine{})
	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Find(&meds)
	c.JSON(http.StatusOK, meds)
}

func CreateMedicine(c *gin.Context) {
	var med model.Medicine
	if err := c.ShouldBindJSON(&med); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&med).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, med)
}

func UpdateMedicine(c *gin.Context) {
	id := c.Param("id")
	var med model.Medicine
	if err := database.DB.First(&med, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Medicine not found"})
		return
	}

	var input model.Medicine
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&med).Updates(input)
	c.JSON(http.StatusOK, med)
}

func DeleteMedicine(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.Medicine{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Medicine deleted"})
}

// ==================== Customers ====================
func GetCustomers(c *gin.Context) {
	var customers []model.Customer
	database.DB.Find(&customers)
	c.JSON(http.StatusOK, customers)
}

func CreateCustomer(c *gin.Context) {
	var customer model.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, customer)
}

func UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer model.Customer
	if err := database.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	var input model.Customer
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&customer).Updates(input)
	c.JSON(http.StatusOK, customer)
}

func DeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.Customer{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted"})
}

// ==================== Suppliers ====================
func GetSuppliers(c *gin.Context) {
	var suppliers []model.Supplier
	database.DB.Find(&suppliers)
	c.JSON(http.StatusOK, suppliers)
}

func CreateSupplier(c *gin.Context) {
	var supplier model.Supplier
	if err := c.ShouldBindJSON(&supplier); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&supplier).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, supplier)
}

func UpdateSupplier(c *gin.Context) {
	id := c.Param("id")
	var supplier model.Supplier
	if err := database.DB.First(&supplier, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Supplier not found"})
		return
	}

	var input model.Supplier
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&supplier).Updates(input)
	c.JSON(http.StatusOK, supplier)
}

func DeleteSupplier(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.Supplier{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Supplier deleted"})
}

// ==================== Inbounds ====================
func GetInbounds(c *gin.Context) {
	var inbounds []model.Inbound
	database.DB.Preload("Medicine").Preload("Supplier").Find(&inbounds)
	c.JSON(http.StatusOK, inbounds)
}

func CreateInbound(c *gin.Context) {
	var req struct {
		MedicineID int64   `json:"medicine_id"`
		SupplierID int64   `json:"supplier_id"`
		Quantity   int     `json:"quantity"`
		Price      float64 `json:"price"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var med model.Medicine
	if err := tx.First(&med, req.MedicineID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Medicine not found"})
		return
	}

	med.Stock += req.Quantity
	if err := tx.Save(&med).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	inbound := model.Inbound{
		MedicineID:  req.MedicineID,
		SupplierID:  req.SupplierID,
		Quantity:    req.Quantity,
		Price:       req.Price,
		InboundDate: time.Now(),
	}
	if err := tx.Create(&inbound).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inbound record"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, inbound)
}

// ==================== Sales ====================
func GetSales(c *gin.Context) {
	var sales []model.Sales
	database.DB.Preload("Medicine").Preload("Customer").Find(&sales)
	c.JSON(http.StatusOK, sales)
}

func CreateSale(c *gin.Context) {
	var req struct {
		MedicineID int64 `json:"medicine_id"`
		CustomerID int64 `json:"customer_id"`
		Quantity   int   `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var med model.Medicine
	if err := tx.First(&med, req.MedicineID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Medicine not found"})
		return
	}

	if med.Stock < req.Quantity {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
		return
	}

	med.Stock -= req.Quantity
	if err := tx.Save(&med).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	sale := model.Sales{
		OrderID:    fmt.Sprintf("ORD-%d", time.Now().Unix()),
		MedicineID: med.ID,
		CustomerID: req.CustomerID,
		Quantity:   req.Quantity,
		TotalPrice: med.Price * float64(req.Quantity),
		SaleDate:   time.Now(),
	}
	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sale record"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, sale)
}

// Dashboard Stats
func GetStats(c *gin.Context) {
	var totalStock int64
	var totalSales float64
	var lowStockCount int64

	database.DB.Model(&model.Medicine{}).Select("COALESCE(sum(stock), 0)").Row().Scan(&totalStock)
	database.DB.Model(&model.Sales{}).Select("COALESCE(sum(total_price), 0)").Where("sale_date > ?", time.Now().AddDate(0, -1, 0)).Row().Scan(&totalSales)
	database.DB.Model(&model.Medicine{}).Where("stock < ?", 50).Count(&lowStockCount)

	c.JSON(http.StatusOK, gin.H{
		"total_stock": totalStock,
		"month_sales": totalSales,
		"low_stock":   lowStockCount,
	})
}

// ==================== Reports ====================

// Inbound Report - by date range
func GetInboundReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var inbounds []model.Inbound
	query := database.DB.Preload("Medicine").Preload("Supplier")

	if startDate != "" && endDate != "" {
		query = query.Where("inbound_date BETWEEN ? AND ?", startDate, endDate)
	}

	query.Order("inbound_date DESC").Find(&inbounds)

	// Calculate totals
	var totalQuantity int
	var totalAmount float64
	for _, inb := range inbounds {
		totalQuantity += inb.Quantity
		totalAmount += inb.Price * float64(inb.Quantity)
	}

	c.JSON(http.StatusOK, gin.H{
		"records":        inbounds,
		"total_quantity": totalQuantity,
		"total_amount":   totalAmount,
	})
}

// Inventory Report - stock status
func GetInventoryReport(c *gin.Context) {
	var medicines []model.Medicine
	database.DB.Order("stock ASC").Find(&medicines)

	var totalStock int
	var totalValue float64
	var lowStockItems []model.Medicine
	var outOfStockItems []model.Medicine

	for _, med := range medicines {
		totalStock += med.Stock
		totalValue += med.Price * float64(med.Stock)
		if med.Stock == 0 {
			outOfStockItems = append(outOfStockItems, med)
		} else if med.Stock < 50 {
			lowStockItems = append(lowStockItems, med)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"medicines":          medicines,
		"total_stock":        totalStock,
		"total_value":        totalValue,
		"low_stock_items":    lowStockItems,
		"out_of_stock_items": outOfStockItems,
	})
}

// Sales Report - by date range
func GetSalesReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var sales []model.Sales
	query := database.DB.Preload("Medicine").Preload("Customer")

	if startDate != "" && endDate != "" {
		query = query.Where("sale_date BETWEEN ? AND ?", startDate, endDate)
	}

	query.Order("sale_date DESC").Find(&sales)

	var totalQuantity int
	var totalAmount float64
	for _, sale := range sales {
		totalQuantity += sale.Quantity
		totalAmount += sale.TotalPrice
	}

	c.JSON(http.StatusOK, gin.H{
		"records":        sales,
		"total_quantity": totalQuantity,
		"total_amount":   totalAmount,
	})
}

// Financial Report - daily/monthly stats
func GetFinancialReport(c *gin.Context) {
	reportType := c.Query("type") // "daily" or "monthly"

	now := time.Now()
	var startDate time.Time

	if reportType == "daily" {
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	} else {
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}

	// Sales income
	var salesIncome float64
	database.DB.Model(&model.Sales{}).Select("COALESCE(sum(total_price), 0)").Where("sale_date >= ?", startDate).Row().Scan(&salesIncome)

	// Purchase cost (Total expenditure)
	var purchaseCost float64
	database.DB.Model(&model.Inbound{}).Select("COALESCE(sum(price * quantity), 0)").Where("inbound_date >= ?", startDate).Row().Scan(&purchaseCost)

	// Calculate Cost of Goods Sold (COGS) based on sold items
	var sales []model.Sales
	database.DB.Where("sale_date >= ?", startDate).Find(&sales)

	// Get average cost for each medicine
	type Cost struct {
		MedicineID int64
		AvgCost    float64
	}
	var costs []Cost
	// Using average inbound price as an approximation for cost price
	database.DB.Model(&model.Inbound{}).
		Select("medicine_id, AVG(price) as avg_cost").
		Group("medicine_id").
		Scan(&costs)

	costMap := make(map[int64]float64)
	for _, c := range costs {
		costMap[c.MedicineID] = c.AvgCost
	}

	var totalCOGS float64
	for _, s := range sales {
		if cost, ok := costMap[s.MedicineID]; ok {
			totalCOGS += float64(s.Quantity) * cost
		}
	}

	// Sales count
	var salesCount int64
	database.DB.Model(&model.Sales{}).Where("sale_date >= ?", startDate).Count(&salesCount)

	// Purchase count
	var purchaseCount int64
	database.DB.Model(&model.Inbound{}).Where("inbound_date >= ?", startDate).Count(&purchaseCount)

	c.JSON(http.StatusOK, gin.H{
		"report_type":    reportType,
		"start_date":     startDate,
		"sales_income":   salesIncome,
		"purchase_cost":  purchaseCost,
		"gross_profit":   salesIncome - totalCOGS, // Profit based on sales vs COGS
		"sales_count":    salesCount,
		"purchase_count": purchaseCount,
	})
}

// ==================== Returns ====================

// Sales Return - restore stock
func CreateSalesReturn(c *gin.Context) {
	var req struct {
		SaleID int64  `json:"sale_id"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var sale model.Sales
	if err := tx.First(&sale, req.SaleID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sale not found"})
		return
	}

	// Restore stock
	var med model.Medicine
	if err := tx.First(&med, sale.MedicineID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Medicine not found"})
		return
	}

	med.Stock += sale.Quantity
	if err := tx.Save(&med).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore stock"})
		return
	}

	// Delete the sale record (or mark as returned)
	if err := tx.Delete(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process return"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"message":           "Return processed successfully",
		"returned_quantity": sale.Quantity,
		"refund_amount":     sale.TotalPrice,
	})
}

// Purchase Return - reduce stock
func CreatePurchaseReturn(c *gin.Context) {
	var req struct {
		InboundID int64  `json:"inbound_id"`
		Reason    string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var inbound model.Inbound
	if err := tx.First(&inbound, req.InboundID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Inbound record not found"})
		return
	}

	// Reduce stock
	var med model.Medicine
	if err := tx.First(&med, inbound.MedicineID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Medicine not found"})
		return
	}

	if med.Stock < inbound.Quantity {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock for return"})
		return
	}

	med.Stock -= inbound.Quantity
	if err := tx.Save(&med).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	// Delete the inbound record
	if err := tx.Delete(&inbound).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process return"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"message":           "Purchase return processed successfully",
		"returned_quantity": inbound.Quantity,
	})
}

// ==================== Stock Adjustment (盘点) ====================
func AdjustStock(c *gin.Context) {
	var req struct {
		MedicineID int64  `json:"medicine_id"`
		NewStock   int    `json:"new_stock"`
		Reason     string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var med model.Medicine
	if err := database.DB.First(&med, req.MedicineID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Medicine not found"})
		return
	}

	oldStock := med.Stock
	med.Stock = req.NewStock
	database.DB.Save(&med)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Stock adjusted",
		"old_stock":  oldStock,
		"new_stock":  req.NewStock,
		"difference": req.NewStock - oldStock,
	})
}

// ==================== System Maintenance ====================

// BackupDatabase exports all data as SQL statements
func BackupDatabase(c *gin.Context) {
	var sql strings.Builder

	sql.WriteString("-- 康源医药管理系统 - 数据库备份\n")
	sql.WriteString(fmt.Sprintf("-- 备份时间: %s\n", time.Now().Format("2006-01-02 15:04:05")))
	sql.WriteString("-- ========================================\n\n")

	sql.WriteString("SET FOREIGN_KEY_CHECKS = 0;\n\n")

	// Backup suppliers
	var suppliers []model.Supplier
	database.DB.Find(&suppliers)
	if len(suppliers) > 0 {
		sql.WriteString("-- 供应商数据\n")
		sql.WriteString("TRUNCATE TABLE suppliers;\n")
		sql.WriteString("INSERT INTO suppliers (id, name, contact, phone, created_at) VALUES\n")
		for i, s := range suppliers {
			sql.WriteString(fmt.Sprintf("(%d, '%s', '%s', '%s', '%s')",
				s.ID, escapeSQL(s.Name), escapeSQL(s.Contact), escapeSQL(s.Phone), s.CreatedAt.Format("2006-01-02 15:04:05")))
			if i < len(suppliers)-1 {
				sql.WriteString(",\n")
			} else {
				sql.WriteString(";\n\n")
			}
		}
	}

	// Backup customers
	var customers []model.Customer
	database.DB.Find(&customers)
	if len(customers) > 0 {
		sql.WriteString("-- 客户数据\n")
		sql.WriteString("TRUNCATE TABLE customers;\n")
		sql.WriteString("INSERT INTO customers (id, name, phone, created_at) VALUES\n")
		for i, c := range customers {
			sql.WriteString(fmt.Sprintf("(%d, '%s', '%s', '%s')",
				c.ID, escapeSQL(c.Name), escapeSQL(c.Phone), c.CreatedAt.Format("2006-01-02 15:04:05")))
			if i < len(customers)-1 {
				sql.WriteString(",\n")
			} else {
				sql.WriteString(";\n\n")
			}
		}
	}

	// Backup medicines
	var medicines []model.Medicine
	database.DB.Find(&medicines)
	if len(medicines) > 0 {
		sql.WriteString("-- 药品数据\n")
		sql.WriteString("TRUNCATE TABLE medicines;\n")
		sql.WriteString("INSERT INTO medicines (id, code, name, type, spec, price, stock, manufacturer, status) VALUES\n")
		for i, m := range medicines {
			sql.WriteString(fmt.Sprintf("(%d, '%s', '%s', '%s', '%s', %.2f, %d, '%s', '%s')",
				m.ID, escapeSQL(m.Code), escapeSQL(m.Name), escapeSQL(m.Type), escapeSQL(m.Spec),
				m.Price, m.Stock, escapeSQL(m.Manufacturer), escapeSQL(m.Status)))
			if i < len(medicines)-1 {
				sql.WriteString(",\n")
			} else {
				sql.WriteString(";\n\n")
			}
		}
	}

	// Backup inbounds
	var inbounds []model.Inbound
	database.DB.Find(&inbounds)
	if len(inbounds) > 0 {
		sql.WriteString("-- 入库记录\n")
		sql.WriteString("TRUNCATE TABLE inbounds;\n")
		sql.WriteString("INSERT INTO inbounds (id, medicine_id, supplier_id, quantity, price, inbound_date) VALUES\n")
		for i, ib := range inbounds {
			sql.WriteString(fmt.Sprintf("(%d, %d, %d, %d, %.2f, '%s')",
				ib.ID, ib.MedicineID, ib.SupplierID, ib.Quantity, ib.Price, ib.InboundDate.Format("2006-01-02 15:04:05")))
			if i < len(inbounds)-1 {
				sql.WriteString(",\n")
			} else {
				sql.WriteString(";\n\n")
			}
		}
	}

	// Backup sales
	var sales []model.Sales
	database.DB.Find(&sales)
	if len(sales) > 0 {
		sql.WriteString("-- 销售记录\n")
		sql.WriteString("TRUNCATE TABLE sales;\n")
		sql.WriteString("INSERT INTO sales (id, order_id, medicine_id, customer_id, quantity, total_price, sale_date) VALUES\n")
		for i, s := range sales {
			sql.WriteString(fmt.Sprintf("(%d, '%s', %d, %d, %d, %.2f, '%s')",
				s.ID, escapeSQL(s.OrderID), s.MedicineID, s.CustomerID, s.Quantity, s.TotalPrice, s.SaleDate.Format("2006-01-02 15:04:05")))
			if i < len(sales)-1 {
				sql.WriteString(",\n")
			} else {
				sql.WriteString(";\n\n")
			}
		}
	}

	sql.WriteString("SET FOREIGN_KEY_CHECKS = 1;\n")

	// Return as downloadable SQL file
	c.Header("Content-Type", "application/sql; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=backup_%s.sql", time.Now().Format("20060102_150405")))
	c.String(http.StatusOK, sql.String())
}

// escapeSQL escapes single quotes in SQL strings
func escapeSQL(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

// RestoreDatabase imports data from SQL file content
func RestoreDatabase(c *gin.Context) {
	// Read SQL content from request body
	sqlContent, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取SQL文件内容"})
		return
	}

	sqlStr := string(sqlContent)
	if len(sqlStr) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SQL文件内容为空"})
		return
	}

	// Split SQL into statements
	statements := strings.Split(sqlStr, ";")

	tx := database.DB.Begin()

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}
		if err := tx.Exec(stmt).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("执行SQL失败: %s", err.Error())})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "数据库恢复成功"})
}

// ==================== Fuzzy Search ====================
func SearchUsers(c *gin.Context) {
	keyword := c.Query("keyword")
	var users []model.User
	database.DB.Where("username LIKE ? OR real_name LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&users)
	c.JSON(http.StatusOK, users)
}

func SearchCustomers(c *gin.Context) {
	keyword := c.Query("keyword")
	var customers []model.Customer
	database.DB.Where("name LIKE ? OR phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&customers)
	c.JSON(http.StatusOK, customers)
}

func SearchSuppliers(c *gin.Context) {
	keyword := c.Query("keyword")
	var suppliers []model.Supplier
	database.DB.Where("name LIKE ? OR contact LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&suppliers)
	c.JSON(http.StatusOK, suppliers)
}

// ==================== Database Configuration ====================

// GetDatabaseStatus returns current database connection status
func GetDatabaseStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"connected": database.IsConnected,
	})
}

// GetDatabaseConfig returns current database configuration (password masked)
func GetDatabaseConfig(c *gin.Context) {
	cfg := config.Get()
	if cfg == nil {
		// Return defaults
		cfg = config.Default()
	}

	c.JSON(http.StatusOK, gin.H{
		"host":     cfg.Database.Host,
		"port":     cfg.Database.Port,
		"user":     cfg.Database.User,
		"password": "********", // Mask password
		"database": cfg.Database.Database,
	})
}

// TestDatabaseConfig tests a database connection without saving
func TestDatabaseConfig(c *gin.Context) {
	var req struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		User     string `json:"user"`
		Password string `json:"password"`
		Database string `json:"database"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		req.User, req.Password, req.Host, req.Port, req.Database)

	if err := database.TestConnection(dsn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Connection successful",
	})
}

// UpdateDatabaseConfig saves new database configuration and reconnects
func UpdateDatabaseConfig(c *gin.Context) {
	var req struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		User     string `json:"user"`
		Password string `json:"password"`
		Database string `json:"database"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build new config
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Host:     req.Host,
			Port:     req.Port,
			User:     req.User,
			Password: req.Password,
			Database: req.Database,
		},
	}

	// Try to connect first
	dsn := cfg.Database.GetDSN()
	if err := database.Reconnect(dsn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Failed to connect: " + err.Error(),
		})
		return
	}

	// Save config
	if err := config.Save(cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Connected but failed to save config: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Database configuration updated and connected",
	})
}
