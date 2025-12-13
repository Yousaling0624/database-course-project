package model

import (
	"time"
)

type User struct {
	ID        int64     `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"` // Don't return password
	Role      string    `gorm:"default:staff" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Medicine struct {
	ID           int64   `gorm:"primaryKey" json:"id"`
	Code         string  `gorm:"unique;not null" json:"code"`
	Name         string  `gorm:"not null" json:"name"`
	Type         string  `gorm:"not null" json:"type"` // OTC, Rx, etc.
	Spec         string  `json:"spec"`
	Price        float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	Stock        int     `gorm:"not null;default:0" json:"stock"`
	Manufacturer string  `json:"manufacturer"`
	Status       string  `gorm:"default:active" json:"status"` // active, inactive
}

type Customer struct {
	ID        int64     `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
}

type Supplier struct {
	ID        int64     `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Contact   string    `json:"contact"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
}

type Inbound struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	MedicineID  int64     `gorm:"not null" json:"medicine_id"`
	SupplierID  int64     `json:"supplier_id"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Price       float64   `gorm:"type:decimal(10,2);not null" json:"price"`
	InboundDate time.Time `json:"inbound_date"`

	// Preload
	Medicine *Medicine `gorm:"foreignKey:MedicineID" json:"medicine,omitempty"`
	Supplier *Supplier `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
}

type Sales struct {
	ID         int64     `gorm:"primaryKey" json:"id"`
	OrderID    string    `gorm:"not null" json:"order_id"`
	MedicineID int64     `gorm:"not null" json:"medicine_id"`
	Quantity   int       `gorm:"not null" json:"quantity"`
	TotalPrice float64   `gorm:"type:decimal(10,2);not null" json:"total_price"`
	SaleDate   time.Time `json:"sale_date"`
	CustomerID int64     `json:"customer_id"`

	// Preload
	Medicine *Medicine `gorm:"foreignKey:MedicineID" json:"medicine,omitempty"`
	Customer *Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}
