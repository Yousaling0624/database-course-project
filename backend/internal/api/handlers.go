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

	// Compare password (In real app use bcrypt.CompareHashAndPassword)
	// For simplicity, we assume the seed uses bcrypt.
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   "dummy-token", // In real app use JWT
		"user":    user,
	})
}

// Medicine CRUD
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

// Dashboard Stats
func GetStats(c *gin.Context) {
	var totalStock int64
	var totalSales float64
	var lowStockCount int64

	database.DB.Model(&model.Medicine{}).Select("sum(stock)").Row().Scan(&totalStock)
	database.DB.Model(&model.Sales{}).Select("sum(total_price)").Where("sale_date > ?", time.Now().AddDate(0, -1, 0)).Row().Scan(&totalSales)
	database.DB.Model(&model.Medicine{}).Where("stock < ?", 50).Count(&lowStockCount)

	c.JSON(http.StatusOK, gin.H{
		"total_stock": totalStock,
		"month_sales": totalSales,
		"low_stock":   lowStockCount,
	})
}

// Sales
func CreateSale(c *gin.Context) {
	// Simplified sale creation: medicine_id, quantity
	// Real app should handle transaction, update stock
	var req struct {
		MedicineID int64 `json:"medicine_id"`
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

	// Deduct stock
	med.Stock -= req.Quantity
	if err := tx.Save(&med).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	// Create Sale Record
	sale := model.Sales{
		OrderID:    fmt.Sprintf("ORD-%d", time.Now().Unix()),
		MedicineID: med.ID,
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
