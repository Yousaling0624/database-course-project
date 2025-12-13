package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
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

	// Purchase cost
	var purchaseCost float64
	database.DB.Model(&model.Inbound{}).Select("COALESCE(sum(price * quantity), 0)").Where("inbound_date >= ?", startDate).Row().Scan(&purchaseCost)

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
		"gross_profit":   salesIncome - purchaseCost,
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
func BackupDatabase(c *gin.Context) {
	// Export all data as JSON
	var users []model.User
	var medicines []model.Medicine
	var customers []model.Customer
	var suppliers []model.Supplier
	var inbounds []model.Inbound
	var sales []model.Sales

	database.DB.Find(&users)
	database.DB.Find(&medicines)
	database.DB.Find(&customers)
	database.DB.Find(&suppliers)
	database.DB.Find(&inbounds)
	database.DB.Find(&sales)

	backup := gin.H{
		"backup_time": time.Now(),
		"users":       users,
		"medicines":   medicines,
		"customers":   customers,
		"suppliers":   suppliers,
		"inbounds":    inbounds,
		"sales":       sales,
	}

	c.JSON(http.StatusOK, backup)
}

func RestoreDatabase(c *gin.Context) {
	var backup struct {
		Users     []model.User     `json:"users"`
		Medicines []model.Medicine `json:"medicines"`
		Customers []model.Customer `json:"customers"`
		Suppliers []model.Supplier `json:"suppliers"`
		Inbounds  []model.Inbound  `json:"inbounds"`
		Sales     []model.Sales    `json:"sales"`
	}

	if err := c.ShouldBindJSON(&backup); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	// Clear existing data
	tx.Exec("DELETE FROM sales")
	tx.Exec("DELETE FROM inbounds")
	tx.Exec("DELETE FROM suppliers")
	tx.Exec("DELETE FROM customers")
	tx.Exec("DELETE FROM medicines")
	tx.Exec("DELETE FROM users")

	// Restore data
	for _, u := range backup.Users {
		tx.Create(&u)
	}
	for _, m := range backup.Medicines {
		tx.Create(&m)
	}
	for _, c := range backup.Customers {
		tx.Create(&c)
	}
	for _, s := range backup.Suppliers {
		tx.Create(&s)
	}
	for _, i := range backup.Inbounds {
		tx.Create(&i)
	}
	for _, s := range backup.Sales {
		tx.Create(&s)
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Database restored successfully"})
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
