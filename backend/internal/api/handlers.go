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

// Search Response Structs
type SearchSalesRecord struct {
	model.Sales
	MedicineName string `json:"medicine_name"`
	MedicineType string `json:"medicine_type"`
	CustomerName string `json:"customer_name"`
}

type SearchInboundRecord struct {
	model.Inbound
	MedicineName string `json:"medicine_name"`
	SupplierName string `json:"supplier_name"`
}

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

	// Password hashing
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)

	// Auto-handle duplicate usernames
	originalUsername := user.Username
	suffix := 1
	for {
		var count int64
		database.DB.Model(&model.User{}).Where("username = ?", user.Username).Count(&count)
		if count == 0 {
			break
		}
		user.Username = fmt.Sprintf("%s%d", originalUsername, suffix)
		suffix++
	}

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
	meds := make([]model.Medicine, 0)
	search := c.Query("search")

	// Use Stored Procedure for fuzzy search (matches name, code, or manufacturer)
	if err := database.DB.Raw("CALL sp_search_medicines(?)", search).Scan(&meds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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
	keyword := c.Query("keyword")
	customers := make([]model.Customer, 0)
	if err := database.DB.Raw("CALL sp_search_customers(?)", keyword).Scan(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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
	keyword := c.Query("keyword")
	suppliers := make([]model.Supplier, 0)
	if err := database.DB.Raw("CALL sp_search_suppliers(?)", keyword).Scan(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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
	keyword := c.Query("keyword")
	inbounds := make([]SearchInboundRecord, 0)
	if err := database.DB.Raw("CALL sp_search_inbounds(?)", keyword).Scan(&inbounds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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

	// Stock update is now handled by database trigger tr_after_inbound_insert

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
	keyword := c.Query("keyword")
	filterType := c.Query("type") // e.g. "处方药"
	sales := make([]SearchSalesRecord, 0)
	// Pass both keyword and filterType to SP
	if err := database.DB.Raw("CALL sp_search_sales(?, ?)", keyword, filterType).Scan(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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

	// Stock check and update is now handled by database triggers:
	// tr_before_sale_check_stock (validation) and tr_after_sale_insert (update)

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

	// Top Selling
	type TopSellingItem struct {
		Name         string  `json:"name"`
		TotalSold    int     `json:"total_sold"`
		TotalRevenue float64 `json:"total_revenue"`
	}
	var topSelling []TopSellingItem
	database.DB.Raw("CALL sp_top_selling_medicines(?)", 5).Scan(&topSelling)

	// Sales Trend (Last 7 Days)
	type SalesTrendItem struct {
		SaleDay      string  `json:"sale_day"`
		TotalRevenue float64 `json:"total_revenue"`
	}
	var salesTrend []SalesTrendItem
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -6)
	database.DB.Raw("CALL sp_sales_trend(?, ?)", startDate.Format("2006-01-02"), endDate.Format("2006-01-02")).Scan(&salesTrend)

	c.JSON(http.StatusOK, gin.H{
		"total_stock": totalStock,
		"month_sales": totalSales,
		"low_stock":   lowStockCount,
		"top_selling": topSelling,
		"sales_trend": salesTrend,
	})
}

// ==================== Reports ====================

// Inbound Report - by date range
func GetInboundReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	type InboundRecord struct {
		ID           int64     `json:"id"`
		MedicineName string    `json:"medicine_name"`
		SupplierName string    `json:"supplier_name"`
		Quantity     int       `json:"quantity"`
		Price        float64   `json:"price"`
		TotalCost    float64   `json:"total_cost"`
		InboundDate  time.Time `json:"inbound_date"`
	}

	var inbounds = make([]InboundRecord, 0)

	// Default date range if not provided (default to last 30 days or all time)
	if startDate == "" {
		startDate = "1970-01-01"
	}
	if endDate == "" {
		endDate = "2099-12-31"
	}

	// Use Stored Procedure for reporting
	if err := database.DB.Raw("CALL sp_inbound_report(?, ?)", startDate, endDate).Scan(&inbounds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate totals
	var totalQuantity int
	var totalAmount float64
	for _, inb := range inbounds {
		totalQuantity += inb.Quantity
		totalAmount += inb.TotalCost
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

	type SalesRecord struct {
		ID           int64     `json:"id"`
		OrderID      string    `json:"order_id"`
		MedicineName string    `json:"medicine_name"`
		CustomerName string    `json:"customer_name"`
		Quantity     int       `json:"quantity"`
		TotalPrice   float64   `json:"total_price"`
		SaleDate     time.Time `json:"sale_date"`
	}

	var sales = make([]SalesRecord, 0)

	// Default date range if not provided
	if startDate == "" {
		startDate = "1970-01-01"
	}
	if endDate == "" {
		endDate = "2099-12-31"
	}

	// Use Stored Procedure for reporting
	if err := database.DB.Raw("CALL sp_sales_report(?, ?)", startDate, endDate).Scan(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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

	type FinancialStats struct {
		PeriodType   string    `json:"period_type"`
		PeriodStart  time.Time `json:"period_start"`
		SalesIncome  float64   `json:"sales_income"`
		PurchaseCost float64   `json:"purchase_cost"`
		GrossProfit  float64   `json:"gross_profit"`
	}

	var stats FinancialStats
	// Use Stored Procedure for financial stats
	if err := database.DB.Raw("CALL sp_financial_stats(?)", reportType).Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Helper for counts (SP doesn't include them)
	now := time.Now()
	var startDate time.Time
	if reportType == "daily" {
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	} else {
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}

	var salesCount int64
	database.DB.Model(&model.Sales{}).Where("sale_date >= ?", startDate).Count(&salesCount)

	var purchaseCount int64
	database.DB.Model(&model.Inbound{}).Where("inbound_date >= ?", startDate).Count(&purchaseCount)

	c.JSON(http.StatusOK, gin.H{
		"report_type":    stats.PeriodType,
		"start_date":     stats.PeriodStart,
		"sales_income":   stats.SalesIncome,
		"purchase_cost":  stats.PurchaseCost,
		"gross_profit":   stats.GrossProfit,
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

	// Stock restoration is now handled by database trigger tr_after_sale_delete

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

	// Stock reduction is now handled by database trigger tr_after_inbound_delete

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

	// Use raw SQL connection to ensure session variables (FOREIGN_KEY_CHECKS) persist
	// GORM's transaction might pick different connections if not careful, though tx usually binds.
	// But TRUNCATE is DDL and commits transaction in MySQL. So we shouldn't use a transaction for the whole if we use TRUNCATE.
	// Instead, we execute statements sequentially on a single connection.

	sqlDB, err := database.DB.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接错误"})
		return
	}

	// Acquire a dedicated connection for the session
	conn, err := sqlDB.Conn(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取数据库连接失败"})
		return
	}
	defer conn.Close()

	// Disable foreign key checks
	if _, err := conn.ExecContext(c, "SET FOREIGN_KEY_CHECKS = 0"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法禁用外键检查"})
		return
	}
	defer conn.ExecContext(c, "SET FOREIGN_KEY_CHECKS = 1")

	// Split SQL into statements
	statements := strings.Split(sqlStr, ";")

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}

		// TRUNCATE is fine here since we are not in a GORM transaction wrapper that expects rollback.
		if _, err := conn.ExecContext(c, stmt); err != nil {
			// Don't stop immediately if it's just a warning, but for errors we returns
			// However, dropping/truncating might fail if locked?
			// We just return error.
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("执行SQL失败: %s\n%v", stmt, err)})
			return
		}
	}

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
