package main

import (
	"github.com/gin-gonic/gin"
	"github.com/yousaling0624/database-course-project/backend/internal/api"
	"github.com/yousaling0624/database-course-project/backend/internal/database"
)

func main() {
	// Connect to Database
	database.Connect()

	// Initialize Router
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Content-Type", "application/json; charset=utf-8")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Routes
	apiGroup := r.Group("/api")
	{
		// Auth
		apiGroup.POST("/login", api.Login)

		// Dashboard
		apiGroup.GET("/dashboard/stats", api.GetStats)

		// Users
		apiGroup.GET("/users", api.GetUsers)
		apiGroup.POST("/users", api.CreateUser)
		apiGroup.PUT("/users/:id", api.UpdateUser)
		apiGroup.DELETE("/users/:id", api.DeleteUser)

		// Medicines
		apiGroup.GET("/medicines", api.GetMedicines)
		apiGroup.POST("/medicines", api.CreateMedicine)
		apiGroup.PUT("/medicines/:id", api.UpdateMedicine)
		apiGroup.DELETE("/medicines/:id", api.DeleteMedicine)

		// Customers
		apiGroup.GET("/customers", api.GetCustomers)
		apiGroup.POST("/customers", api.CreateCustomer)
		apiGroup.PUT("/customers/:id", api.UpdateCustomer)
		apiGroup.DELETE("/customers/:id", api.DeleteCustomer)

		// Suppliers
		apiGroup.GET("/suppliers", api.GetSuppliers)
		apiGroup.POST("/suppliers", api.CreateSupplier)
		apiGroup.PUT("/suppliers/:id", api.UpdateSupplier)
		apiGroup.DELETE("/suppliers/:id", api.DeleteSupplier)

		// Inbounds
		apiGroup.GET("/inbounds", api.GetInbounds)
		apiGroup.POST("/inbounds", api.CreateInbound)
		apiGroup.PUT("/inbounds/:id", api.UpdateInbound)
		apiGroup.DELETE("/inbounds/:id", api.DeleteInbound)

		// Sales
		apiGroup.GET("/sales", api.GetSales)
		apiGroup.POST("/sales", api.CreateSale)
		apiGroup.PUT("/sales/:id", api.UpdateSale)
		apiGroup.DELETE("/sales/:id", api.DeleteSale)

		// Reports
		apiGroup.GET("/reports/inbound", api.GetInboundReport)
		apiGroup.GET("/reports/inventory", api.GetInventoryReport)
		apiGroup.GET("/reports/sales", api.GetSalesReport)
		apiGroup.GET("/reports/financial", api.GetFinancialReport)

		// Returns
		apiGroup.POST("/returns/sales", api.CreateSalesReturn)
		apiGroup.POST("/returns/purchase", api.CreatePurchaseReturn)

		// Stock Adjustment
		apiGroup.POST("/stock/adjust", api.AdjustStock)

		// System Maintenance
		apiGroup.GET("/system/backup", api.BackupDatabase)
		apiGroup.POST("/system/restore", api.RestoreDatabase)

		// Fuzzy Search
		apiGroup.GET("/search/users", api.SearchUsers)
		apiGroup.GET("/search/customers", api.SearchCustomers)
		apiGroup.GET("/search/suppliers", api.SearchSuppliers)

		// Database Configuration (admin only)
		apiGroup.GET("/system/database/status", api.GetDatabaseStatus)
		apiGroup.GET("/system/database", api.GetDatabaseConfig)
		apiGroup.POST("/system/database", api.UpdateDatabaseConfig)
		apiGroup.POST("/system/database/test", api.TestDatabaseConfig)

		// Analysis
		apiGroup.GET("/analysis/top-selling", api.GetTopSellingAnalysis)
		apiGroup.GET("/analysis/trend", api.GetSalesTrendAnalysis)
	}

	// Start Server
	r.Run(":8080")
}
