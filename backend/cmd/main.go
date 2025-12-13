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

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Routes
	apiGroup := r.Group("/api")
	{
		apiGroup.POST("/login", api.Login)
		apiGroup.GET("/dashboard/stats", api.GetStats)
		apiGroup.GET("/medicines", api.GetMedicines)
		apiGroup.POST("/medicines", api.CreateMedicine)
		apiGroup.POST("/sales", api.CreateSale)
	}

	// Start Server
	r.Run(":8080")
}
